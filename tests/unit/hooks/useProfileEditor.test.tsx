/**
 * Pruebas unitarias del hook useProfileEditor.
 * Cubren precarga, validaciones, persistencia de identidad,
 * CRUD de ingresos y eventos de sincronizacion.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import * as incomesRepo from '@src/db/incomes'
import * as profileRepo from '@src/db/profile'
import { subscribe } from '@src/lib/events'
import { useProfileEditor } from '@src/hooks/useProfileEditor'

import { buildIncome } from '../../helpers/factories'

const saveProfileMock = profileRepo.saveProfile as jest.Mock
const getProfileMock = profileRepo.getProfile as jest.Mock
const getIncomesMock = incomesRepo.getIncomes as jest.Mock
const insertIncomeMock = incomesRepo.insertIncome as jest.Mock
const updateIncomeMock = incomesRepo.updateIncome as jest.Mock
const deleteIncomeMock = incomesRepo.deleteIncome as jest.Mock

jest.mock('@src/db/profile', () => ({
  getProfile: jest.fn(async () => null),
  saveProfile: jest.fn(async () => undefined)
}))

jest.mock('@src/db/incomes', () => ({
  getIncomes: jest.fn(async () => []),
  insertIncome: jest.fn(),
  updateIncome: jest.fn(),
  deleteIncome: jest.fn(async () => undefined)
}))

describe('useProfileEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getIncomesMock.mockResolvedValue([])
    getProfileMock.mockResolvedValue(null)
  })

  it('precarga el perfil y los ingresos guardados', async () => {
    getProfileMock.mockResolvedValue({
      firstName: 'Carlos',
      lastName: 'Perez',
      email: 'c@p.com'
    })
    getIncomesMock.mockResolvedValue([buildIncome()])

    const { result } = await renderHook(() => useProfileEditor())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.profile).toEqual({
      firstName: 'Carlos',
      lastName: 'Perez',
      email: 'c@p.com'
    })
    expect(result.current.incomes).toHaveLength(1)
  })

  it('guarda la identidad recortada y emite profile-changed', async () => {
    const { result } = await renderHook(() => useProfileEditor())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      result.current.changeProfileField('firstName', '  Carlos ')
      result.current.changeProfileField('lastName', 'Perez')
      result.current.changeProfileField('email', 'c@p.com')
    })

    const events: string[] = []
    const unsubscribe = subscribe('profile-changed', () => events.push('perfil'))

    let saved = false
    await act(async () => {
      saved = await result.current.saveProfile()
    })

    unsubscribe()

    expect(saved).toBe(true)
    expect(saveProfileMock).toHaveBeenCalledWith({
      firstName: 'Carlos',
      lastName: 'Perez',
      email: 'c@p.com'
    })
    expect(events).toEqual(['perfil'])
  })

  it('rechaza guardar con identidad invalida', async () => {
    const { result } = await renderHook(() => useProfileEditor())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let saved = true
    await act(async () => {
      saved = await result.current.saveProfile()
    })

    expect(saved).toBe(false)
    expect(saveProfileMock).not.toHaveBeenCalled()
  })

  describe('ingresos', () => {
    /** Hook con identidad lista para operar ingresos */
    async function mountReady() {
      const { result } = await renderHook(() => useProfileEditor())
      await waitFor(() => expect(result.current.loading).toBe(false))

      return result
    }

    /** Fila valida de salario en centavos */
    function salaryRow() {
      return {
        name: 'Salario',
        amountCents: 200000,
        currency: 'USD' as const,
        paydayDayText: '5'
      }
    }

    it('inserta un ingreso nuevo y refresca la tabla', async () => {
      insertIncomeMock.mockResolvedValue(undefined)
      getIncomesMock.mockResolvedValueOnce([]).mockResolvedValueOnce([buildIncome()])
      const result = await mountReady()

      await act(async () => {
        result.current.changeRow(salaryRow())
      })

      let added = false
      await act(async () => {
        added = await result.current.confirmRow()
      })

      expect(added).toBe(true)
      expect(insertIncomeMock).toHaveBeenCalledWith(
        { name: 'Salario', amount: 2000, currency: 'USD', paydayDay: 5 },
        expect.any(String)
      )
      expect(result.current.incomes).toHaveLength(1)
      expect(result.current.row.name).toBe('')
    })

    it('actualiza el ingreso en edicion', async () => {
      const existing = buildIncome()
      getIncomesMock.mockResolvedValue([existing])
      const result = await mountReady()
      await waitFor(() => expect(result.current.incomes).toHaveLength(1))

      await act(async () => {
        result.current.editIncome(existing.id)
      })
      expect(result.current.editingId).toBe(existing.id)

      await act(async () => {
        result.current.changeRow({ ...salaryRow(), name: 'Sueldo' })
      })

      await act(async () => {
        await result.current.confirmRow()
      })

      expect(updateIncomeMock).toHaveBeenCalledWith(
        existing.id,
        expect.objectContaining({ name: 'Sueldo' })
      )
      expect(insertIncomeMock).not.toHaveBeenCalled()
    })

    it('quita el ingreso y limpia la edicion si era el mismo', async () => {
      const existing = buildIncome()
      getIncomesMock.mockResolvedValue([existing])
      const result = await mountReady()
      await waitFor(() => expect(result.current.incomes).toHaveLength(1))

      await act(async () => {
        result.current.editIncome(existing.id)
      })

      await act(async () => {
        await result.current.removeIncome(existing.id)
      })

      expect(deleteIncomeMock).toHaveBeenCalledWith(existing.id)
      expect(result.current.editingId).toBeNull()
      expect(result.current.row.name).toBe('')
    })

    it('cancelRowEdit descarta cambios sin tocar la base', async () => {
      const result = await mountReady()

      await act(async () => {
        result.current.changeRow(salaryRow())
      })

      await act(async () => {
        result.current.cancelRowEdit()
      })

      expect(result.current.row.name).toBe('')
      expect(insertIncomeMock).not.toHaveBeenCalled()
    })
  })
})
