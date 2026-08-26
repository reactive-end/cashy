/**
 * Pruebas de integracion del wizard de onboarding.
 * Recorren los dos pasos verificando validaciones en tiempo real,
 * bloqueo de avance, tabla de ingresos y guardado final.
 *
 * Usa userEvent (y no fireEvent) porque en React 19 + RNTL v14 es
 * la via fiable para que los cambios de estado se comprometan.
 */

import { render, userEvent } from '@testing-library/react-native'

import Onboarding from '../../app/onboarding'
import * as incomesRepo from '@src/db/incomes'
import * as profileRepo from '@src/db/profile'

const saveProfileMock = profileRepo.saveProfile as jest.Mock
const replaceIncomesMock = incomesRepo.replaceIncomes as jest.Mock
const mockReplace = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() })
}))

jest.mock('@src/db/profile', () => ({ saveProfile: jest.fn(async () => undefined) }))
jest.mock('@src/db/incomes', () => ({ replaceIncomes: jest.fn(async () => []) }))

/** Monta el wizard y completa el paso de identidad con datos validos */
async function mountWithValidIdentity() {
  const screen = await render(<Onboarding />)
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Nombre'), 'Carlos')
  await user.type(screen.getByLabelText('Apellido'), 'Perez')
  await user.type(screen.getByLabelText('Correo'), 'carlos@perez.com')
  await user.press(screen.getByText('Continuar'))

  await screen.findByTestId('income-name')

  return { screen, user }
}

describe('pantalla de onboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('bloquea Continuar sin datos y valida el nombre en vivo', async () => {
    const screen = await render(<Onboarding />)
    const user = userEvent.setup()

    expect(screen.getByLabelText('Continuar').props.accessibilityState.disabled).toBe(true)

    await user.type(screen.getByLabelText('Nombre'), 'A')

    expect(screen.getByText('El nombre debe tener al menos 3 caracteres')).toBeTruthy()
    expect(screen.getByLabelText('Continuar').props.accessibilityState.disabled).toBe(true)

    await user.type(screen.getByLabelText('Nombre'), 'na')

    expect(screen.queryByText('El nombre debe tener al menos 3 caracteres')).toBeNull()

    // El nombre solo ya no muestra error, pero el paso sigue invalido
    // hasta completar apellido y correo.
    await user.type(screen.getByLabelText('Apellido'), 'Perez')
    await user.type(screen.getByLabelText('Correo'), 'ana@perez.com')

    expect(screen.getByLabelText('Continuar').props.accessibilityState.disabled).toBe(false)
  })

  it('recorre ambos pasos, agrega un ingreso y guarda', async () => {
    const { screen, user } = await mountWithValidIdentity()

    await user.type(screen.getByLabelText('Concepto'), 'Salario')
    await user.type(screen.getByTestId('income-amount'), '1500')
    await user.type(screen.getByLabelText('Dia de cobro (1-31)'), '5')
    await user.press(screen.getByText('Agregar ingreso'))

    expect(await screen.findByText(/cobra el dia 5/)).toBeTruthy()

    await user.press(screen.getByText('Terminar'))

    expect(saveProfileMock).toHaveBeenCalledWith({
      firstName: 'Carlos',
      lastName: 'Perez',
      email: 'carlos@perez.com'
    })
    expect(replaceIncomesMock).toHaveBeenCalledWith([
      { name: 'Salario', amount: 15, currency: 'USD', paydayDay: 5 }
    ])
    // La navegacion ahora la orquesta el gate del layout raiz via profile-changed.
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('Volver regresa al paso de identidad conservando lo escrito', async () => {
    const { screen, user } = await mountWithValidIdentity()

    await user.press(screen.getByText('Volver'))

    await screen.findByTestId('onboarding-firstName')
    const campoNombre = screen.getByLabelText('Nombre').props as { value?: string }
    expect(campoNombre.value).toBe('Carlos')
  })

  it('el monto invalido impide agregar a la tabla', async () => {
    const { screen, user } = await mountWithValidIdentity()

    await user.type(screen.getByLabelText('Concepto'), 'Salario')

    expect(screen.getByLabelText('Agregar ingreso').props.accessibilityState.disabled).toBe(true)
    expect(saveProfileMock).not.toHaveBeenCalled()
    expect(replaceIncomesMock).not.toHaveBeenCalled()
  })

  it('edita un ingreso agregado desde la tabla', async () => {
    const { screen, user } = await mountWithValidIdentity()

    await user.type(screen.getByLabelText('Concepto'), 'Salario')
    await user.type(screen.getByTestId('income-amount'), '1500')
    await user.type(screen.getByLabelText('Dia de cobro (1-31)'), '5')
    await user.press(screen.getByText('Agregar ingreso'))
    await screen.findByText(/cobra el dia 5/)

    await user.press(screen.getByLabelText('Editar Salario'))
    await userEvent.clear(screen.getByLabelText('Concepto'))
    await user.type(screen.getByLabelText('Concepto'), 'Sueldo base')
    await user.press(screen.getByText('Guardar cambios'))

    expect(await screen.findByText('Sueldo base')).toBeTruthy()
    expect(screen.getByText(/cobra el dia 5/)).toBeTruthy()
    // El editor vuelve al modo agregar tras guardar.
    expect(screen.getByText('Agregar ingreso')).toBeTruthy()
    expect(replaceIncomesMock).not.toHaveBeenCalled()
  })
})
