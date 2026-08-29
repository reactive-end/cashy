/**
 * Pruebas de integracion de la pantalla de edicion de perfil.
 * Verifica precarga, validacion en vivo, guardado de identidad
 * y administracion de ingresos con persistencia inmediata en vistas segmentadas.
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
const mockPush = jest.fn()
const mockBack = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), back: mockBack, push: mockPush })
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

  it('precarga identidad e ingresos guardados en sus secciones', async () => {
    const screen = await render(<EditProfile />)
    const user = userEvent.setup()

    expect(await screen.findByTestId('profile-firstName')).toBeTruthy()
    const nameField = screen.getByLabelText('Nombre').props as { value?: string }
    expect(nameField.value).toBe('Carlos')

    await user.press(screen.getByText('Ingresos'))
    expect(await screen.findByText('Salario')).toBeTruthy()
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

  it('navega a la pantalla dedicada de nuevo ingreso', async () => {
    const screen = await render(<EditProfile />)
    const user = userEvent.setup()

    await user.press(await screen.findByText('Ingresos'))
    await screen.findByText('Salario')

    await user.press(screen.getByText('Agregar otro ingreso'))
    expect(mockPush).toHaveBeenCalledWith('/new-income')
  })

  it('navega a la pantalla dedicada de edicion de ingreso', async () => {
    const screen = await render(<EditProfile />)
    const user = userEvent.setup()

    await user.press(await screen.findByText('Ingresos'))
    await screen.findByText('Salario')

    await user.press(screen.getByLabelText('Editar Salario'))
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/edit-income/[id]',
      params: { id: expect.any(String) }
    })
  })
})
