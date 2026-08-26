/**
 * Pruebas unitarias del hook useOnboarding.
 * Cubren validaciones en tiempo real, navegacion entre pasos,
 * administracion del borrador de ingresos y persistencia final.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import * as incomesRepo from '@src/db/incomes'
import * as profileRepo from '@src/db/profile'
import { emit, subscribe } from '@src/lib/events'
import { useOnboarding } from '@src/hooks/useOnboarding'

const saveProfileMock = profileRepo.saveProfile as jest.Mock
const replaceIncomesMock = incomesRepo.replaceIncomes as jest.Mock

jest.mock('@src/db/profile', () => ({ saveProfile: jest.fn(async () => undefined) }))
jest.mock('@src/db/incomes', () => ({ replaceIncomes: jest.fn(async () => []) }))

/** Rellena el paso de identidad con datos validos */
async function completeIdentity(result: ReturnType<typeof useOnboarding>): Promise<void> {
  await act(async () => {
    result.changeProfileField('firstName', 'Carlos')
    result.changeProfileField('lastName', 'Perez')
    result.changeProfileField('email', 'c@perez.com')
  })
}

describe('useOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('arranca en el paso 1 con el perfil invalido y sin mensajes', async () => {
    const { result } = await renderHook(() => useOnboarding())

    expect(result.current.step).toBe(0)
    expect(result.current.isProfileValid).toBe(false)
    expect(result.current.profileErrors.firstName).toBeNull()
    expect(result.current.profileErrors.lastName).toBeNull()
    expect(result.current.profileErrors.email).toBeNull()
  })

  it('muestra errores desde el primer caracter y los limpia al corregir', async () => {
    const { result } = await renderHook(() => useOnboarding())

    await act(async () => {
      result.current.changeProfileField('firstName', 'A')
    })

    expect(result.current.profileErrors.firstName).toBe(
      'El nombre debe tener al menos 3 caracteres'
    )

    await act(async () => {
      result.current.changeProfileField('firstName', 'Ana')
    })

    expect(result.current.profileErrors.firstName).toBeNull()
  })

  it('rechaza numeros en el nombre y correos mal formados', async () => {
    const { result } = await renderHook(() => useOnboarding())

    await act(async () => {
      result.current.changeProfileField('firstName', 'Ana123')
    })
    expect(result.current.profileErrors.firstName).toBe('El nombre solo admite letras')

    await act(async () => {
      result.current.changeProfileField('firstName', 'Ana')
      result.current.changeProfileField('lastName', 'Perez')
      result.current.changeProfileField('email', 'sin-arroba')
    })
    expect(result.current.profileErrors.email).toBe('Ingresa un correo valido')
    expect(result.current.isProfileValid).toBe(false)

    await act(async () => {
      result.current.changeProfileField('email', 'ana@perez.com')
    })
    expect(result.current.isProfileValid).toBe(true)
  })

  it('avanza solo con identidad valida y vuelve conservando los valores', async () => {
    const { result } = await renderHook(() => useOnboarding())

    await act(async () => {
      result.current.advanceStep()
    })
    expect(result.current.step).toBe(0)

    await completeIdentity(result.current)

    await act(async () => {
      result.current.advanceStep()
    })
    expect(result.current.step).toBe(1)

    await act(async () => {
      result.current.goBackStep()
    })
    expect(result.current.step).toBe(0)
    expect(result.current.profile.firstName).toBe('Carlos')
  })

  describe('tabla de ingresos', () => {
    /** Hook montado directamente en el paso de ingresos */
    async function mountOnIncomesStep() {
      const { result } = await renderHook(() => useOnboarding())
      await completeIdentity(result.current)

      await act(async () => {
        result.current.advanceStep()
      })

      return result
    }

    /** Fila valida lista para confirmarse */
    function salaryRow() {
      return {
        name: 'Salario',
        amountCents: 150000,
        currency: 'USD' as const,
        paydayDayText: '5'
      }
    }

    it('confirma filas validas convirtiendo centavos a decimales', async () => {
      const result = await mountOnIncomesStep()

      await act(async () => {
        result.current.changeRow(salaryRow())
      })

      let added = false
      await act(async () => {
        added = result.current.confirmRow()
      })

      expect(added).toBe(true)
      expect(result.current.draftIncomes).toHaveLength(1)
      expect(result.current.draftIncomes[0].amount).toBe(1500)
      expect(result.current.draftIncomes[0].paydayDay).toBe(5)
      expect(result.current.row.name).toBe('')
    })

    it('rechaza filas incompletas sin alterar la tabla', async () => {
      const result = await mountOnIncomesStep()

      await act(async () => {
        result.current.changeRow({ ...salaryRow(), amountCents: 0 })
      })

      let added = true
      await act(async () => {
        added = result.current.confirmRow()
      })

      expect(added).toBe(false)
      expect(result.current.draftIncomes).toHaveLength(0)
    })

    it('edita y quita borradores existentes', async () => {
      const result = await mountOnIncomesStep()

      await act(async () => {
        result.current.changeRow(salaryRow())
      })

      await act(async () => {
        result.current.confirmRow()
      })

      const id = result.current.draftIncomes[0].id

      await act(async () => {
        result.current.editIncome(id)
      })
      expect(result.current.editingId).toBe(id)
      expect(result.current.row.amountCents).toBe(150000)

      await act(async () => {
        result.current.changeRow({ ...salaryRow(), name: 'Sueldo', paydayDayText: '30' })
      })

      await act(async () => {
        result.current.confirmRow()
      })

      expect(result.current.draftIncomes[0].name).toBe('Sueldo')
      expect(result.current.draftIncomes[0].paydayDay).toBe(30)

      await act(async () => {
        result.current.removeIncome(id)
      })

      expect(result.current.draftIncomes).toHaveLength(0)
    })

    it('finalizar persiste perfil e ingresos y emite eventos', async () => {
      const result = await mountOnIncomesStep()

      await act(async () => {
        result.current.changeRow(salaryRow())
      })

      await act(async () => {
        result.current.confirmRow()
      })

      const events: string[] = []
      const unsubscribeA = subscribe('profile-changed', () => events.push('perfil'))
      const unsubscribeB = subscribe('incomes-changed', () => events.push('ingresos'))

      let saved = false
      await act(async () => {
        saved = await result.current.finish()
      })

      unsubscribeA()
      unsubscribeB()

      expect(saved).toBe(true)
      expect(saveProfileMock).toHaveBeenCalledWith({
        firstName: 'Carlos',
        lastName: 'Perez',
        email: 'c@perez.com'
      })
      expect(replaceIncomesMock).toHaveBeenCalledWith([
        { name: 'Salario', amount: 1500, currency: 'USD', paydayDay: 5 }
      ])
      expect(events).toEqual(['perfil', 'ingresos'])
      await waitFor(() => expect(result.current.saving).toBe(false))
    })

    it('finalizar devuelve false cuando la escritura falla o el perfil es invalido', async () => {
      const { result: invalid } = await renderHook(() => useOnboarding())

      await act(async () => {
        await expect(invalid.current.finish()).resolves.toBe(false)
      })

      const result = await mountOnIncomesStep()
      saveProfileMock.mockRejectedValueOnce(new Error('db llena'))

      await act(async () => {
        await expect(result.current.finish()).resolves.toBe(false)
      })
      expect(replaceIncomesMock).not.toHaveBeenCalled()
    })
  })
})
