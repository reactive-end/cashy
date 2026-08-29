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
const getIncomesMock = incomesRepo.getIncomes as jest.Mock
const mockReplace = jest.fn()
const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush })
}))

jest.mock('@src/db/profile', () => ({ saveProfile: jest.fn(async () => undefined) }))
jest.mock('@src/db/incomes', () => ({
  getIncomes: jest.fn(async () => []),
  replaceIncomes: jest.fn(async () => []),
  deleteIncome: jest.fn(async () => undefined)
}))

/** Monta el wizard y completa el paso de identidad con datos validos */
async function mountWithValidIdentity() {
  const screen = await render(<Onboarding />)
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Nombre'), 'Carlos')
  await user.type(screen.getByLabelText('Apellido'), 'Perez')
  await user.type(screen.getByLabelText('Correo'), 'carlos@perez.com')
  await user.press(screen.getByText('Continuar'))

  await screen.findByText('Sin fuentes de ingreso')

  return { screen, user }
}

describe('pantalla de onboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getIncomesMock.mockResolvedValue([])
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

  it('navega a /new-income al presionar Agregar ingreso', async () => {
    const { screen, user } = await mountWithValidIdentity()

    await user.press(screen.getByText('Agregar ingreso'))
    expect(mockPush).toHaveBeenCalledWith('/new-income')
  })

  it('completa el onboarding y guarda el perfil al presionar Terminar', async () => {
    const { screen, user } = await mountWithValidIdentity()

    await user.press(screen.getByText('Terminar'))

    expect(saveProfileMock).toHaveBeenCalledWith({
      firstName: 'Carlos',
      lastName: 'Perez',
      email: 'carlos@perez.com'
    })
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('Volver regresa al paso de identidad conservando lo escrito', async () => {
    const { screen, user } = await mountWithValidIdentity()

    await user.press(screen.getByText('Volver'))

    await screen.findByTestId('onboarding-firstName')
    const campoNombre = screen.getByLabelText('Nombre').props as { value?: string }
    expect(campoNombre.value).toBe('Carlos')
  })

  it('muestra ingresos registrados y navega a edicion al presionar editar', async () => {
    getIncomesMock.mockResolvedValue([
      { id: 'inc-1', name: 'Salario', amount: 15, currency: 'USD', paydayDay: 5 }
    ])

    const screen = await render(<Onboarding />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Nombre'), 'Carlos')
    await user.type(screen.getByLabelText('Apellido'), 'Perez')
    await user.type(screen.getByLabelText('Correo'), 'carlos@perez.com')
    await user.press(screen.getByText('Continuar'))

    expect(await screen.findByText('Salario')).toBeTruthy()
    await user.press(screen.getByLabelText('Editar Salario'))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/edit-income/[id]',
      params: { id: 'inc-1' }
    })
  })
})
