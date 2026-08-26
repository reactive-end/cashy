/**
 * Pruebas de integracion de la pantalla de edicion de perfil.
 * Verifica precarga, validacion en vivo, guardado de identidad
 * y administracion de ingresos con persistencia inmediata.
 */

import { render, userEvent } from '@testing-library/react-native'

import EditProfile from '../../app/edit-profile'
import * as incomesRepo from '@src/db/incomes'
import * as profileRepo from '@src/db/profile'
import { buildIncome } from '../helpers/factories'

const saveProfileMock = profileRepo.saveProfile as jest.Mock
const getProfileMock = profileRepo.getProfile as jest.Mock
const getIncomesMock = incomesRepo.getIncomes as jest.Mock
const insertIncomeMock = incomesRepo.insertIncome as jest.Mock

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), back: jest.fn(), push: jest.fn() })
}))

jest.mock('@src/db/profile', () => ({
  getProfile: jest.fn(async () => ({
    firstName: 'Carlos',
    lastName: 'Perez',
    email: 'carlos@perez.com'
  })),
  saveProfile: jest.fn(async () => undefined)
}))

jest.mock('@src/db/incomes', () => ({
  getIncomes: jest.fn(async () => []),
  insertIncome: jest.fn(async () => undefined),
  updateIncome: jest.fn(async () => undefined),
  deleteIncome: jest.fn(async () => undefined)
}))

describe('pantalla de edicion de perfil', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getProfileMock.mockResolvedValue({
      firstName: 'Carlos',
      lastName: 'Perez',
      email: 'carlos@perez.com'
    })
    getIncomesMock.mockResolvedValue([buildIncome({ name: 'Salario' })])
  })

  it('precarga identidad e ingresos guardados', async () => {
    const screen = await render(<EditProfile />)

    expect(await screen.findByTestId('profile-firstName')).toBeTruthy()
    const nameField = screen.getByLabelText('Nombre').props as { value?: string }
    expect(nameField.value).toBe('Carlos')
    expect(screen.getByText('Salario')).toBeTruthy()
  })

  it('valida el correo en vivo y guarda la identidad corregida', async () => {
    const screen = await render(<EditProfile />)
    const user = userEvent.setup()
    await screen.findByTestId('profile-email')

    await userEvent.clear(screen.getByLabelText('Correo'))
    await user.type(screen.getByLabelText('Correo'), 'roto')

    expect(screen.getByText('Ingresa un correo valido')).toBeTruthy()
    const guardar = screen.getByLabelText('Guardar identidad')
    expect(guardar.props.accessibilityState.disabled).toBe(true)

    await userEvent.clear(screen.getByLabelText('Correo'))
    await user.type(screen.getByLabelText('Correo'), 'nuevo@perez.com')
    await user.press(screen.getByText('Guardar identidad'))

    expect(saveProfileMock).toHaveBeenCalledWith({
      firstName: 'Carlos',
      lastName: 'Perez',
      email: 'nuevo@perez.com'
    })
    expect(await screen.findByText('Datos guardados correctamente')).toBeTruthy()
  })

  it('agrega un ingreso nuevo con persistencia inmediata', async () => {
    const screen = await render(<EditProfile />)
    const user = userEvent.setup()
    await screen.findByTestId('income-name')

    await user.type(screen.getByLabelText('Concepto'), 'Freelance')
    await user.type(screen.getByTestId('income-amount'), '30000')
    await user.type(screen.getByLabelText('Dia de cobro (1-31)'), '20')
    await user.press(screen.getByText('Agregar ingreso'))

    expect(insertIncomeMock).toHaveBeenCalledWith(
      { name: 'Freelance', amount: 300, currency: 'USD', paydayDay: 20 },
      expect.any(String)
    )
  })
})
