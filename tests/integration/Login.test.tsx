/**
 * Pruebas de integracion para la pantalla dedicada de Inicio de Sesion (LoginScreen).
 * Verifica la presentacion visual y el flujo de login con Google OAuth.
 */

import { render, userEvent } from '@testing-library/react-native'

import LoginScreen from '../../app/login'
import { isProfileComplete } from '@src/db/profile'
import { useAuth } from '@src/hooks/useAuth'

jest.mock('@src/hooks/useAuth')
jest.mock('@src/db/profile')

const mockReplace = jest.fn()
const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush })
}))

const useAuthMock = useAuth as jest.Mock
const isProfileCompleteMock = isProfileComplete as jest.Mock
const signInMock = jest.fn()
const signInAsDevMock = jest.fn()

describe('pantalla dedicada de Inicio de Sesion (LoginScreen)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    signInMock.mockResolvedValue({ success: true })
    signInAsDevMock.mockResolvedValue({ success: true })
    useAuthMock.mockReturnValue({
      signIn: signInMock,
      signInAsDev: signInAsDevMock,
      loading: false
    })
    isProfileCompleteMock.mockResolvedValue(false)
  })

  it('muestra el titulo y boton de login con Google', async () => {
    const screen = await render(<LoginScreen />)

    expect(screen.getByText('Inicia sesión')).toBeTruthy()
    expect(screen.getByText('Continuar con Google')).toBeTruthy()
    expect(screen.getByText(/Tus datos financieros viven 100% en este dispositivo/)).toBeTruthy()
  })

  it('inicia sesion con Google y navega a onboarding si no hay perfil previo', async () => {
    const screen = await render(<LoginScreen />)
    const user = userEvent.setup()

    await user.press(screen.getByText('Continuar con Google'))

    expect(signInMock).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/onboarding')
  })

  it('inicia sesion con Google y navega directo a tabs si el perfil ya existe', async () => {
    isProfileCompleteMock.mockResolvedValue(true)
    const screen = await render(<LoginScreen />)
    const user = userEvent.setup()

    await user.press(screen.getByText('Continuar con Google'))

    expect(signInMock).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)')
  })

  it('muestra aviso de error si la autenticacion falla', async () => {
    signInMock.mockResolvedValue({ success: false, error: 'Credenciales inválidas' })
    const screen = await render(<LoginScreen />)
    const user = userEvent.setup()

    await user.press(screen.getByText('Continuar con Google'))

    expect(screen.getByText('Credenciales inválidas')).toBeTruthy()
  })

  it('permite iniciar sesion con el boton de desarrollador en modo dev', async () => {
    const screen = await render(<LoginScreen />)
    const user = userEvent.setup()

    const devBtn = screen.getByTestId('dev-login-btn')
    expect(devBtn).toBeTruthy()
    expect(screen.getByText('Entrar como desarrollador (Testing local)')).toBeTruthy()

    await user.press(devBtn)

    expect(signInAsDevMock).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/onboarding')
  })
})
