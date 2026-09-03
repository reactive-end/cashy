/**
 * Pruebas de integracion para la pantalla de Bienvenida (Welcome).
 * Verifica los pasos explicativos a pantalla completa y el flujo de login con Google.
 */

import { render, userEvent } from '@testing-library/react-native'

import Welcome from '../../app/welcome'
import { useAuth } from '@src/hooks/useAuth'

jest.mock('@src/hooks/useAuth')

const mockReplace = jest.fn()
const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush })
}))

const useAuthMock = useAuth as jest.Mock
const signInMock = jest.fn()

describe('pantalla de Bienvenida (Welcome)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    signInMock.mockResolvedValue({ success: true })
    useAuthMock.mockReturnValue({
      signIn: signInMock,
      loading: false
    })
  })

  it('muestra el primer paso explicativo de la aplicacion', async () => {
    const screen = await render(<Welcome />)

    expect(screen.getByText('CONTROL TOTAL')).toBeTruthy()
    expect(screen.getByText('Paso 1 de 4')).toBeTruthy()
    expect(screen.getByText('Siguiente')).toBeTruthy()
  })

  it('avanza al siguiente paso al pulsar Siguiente', async () => {
    const screen = await render(<Welcome />)
    const user = userEvent.setup()

    await user.press(screen.getByText('Siguiente'))

    expect(screen.getByText('MULTIMONEDA EN VIVO')).toBeTruthy()
    expect(screen.getByText('Paso 2 de 4')).toBeTruthy()
    expect(screen.getByText('Anterior')).toBeTruthy()
  })

  it('permite retroceder al paso anterior con el boton Anterior', async () => {
    const screen = await render(<Welcome />)
    const user = userEvent.setup()

    await user.press(screen.getByText('Siguiente'))
    expect(screen.getByText('Paso 2 de 4')).toBeTruthy()

    await user.press(screen.getByText('Anterior'))
    expect(screen.getByText('Paso 1 de 4')).toBeTruthy()
  })

  it('salta directamente a la pantalla de login con el boton Saltar', async () => {
    const screen = await render(<Welcome />)
    const user = userEvent.setup()

    await user.press(screen.getByText('Saltar'))

    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('al llegar al ultimo paso permite comenzar e ir a login', async () => {
    const screen = await render(<Welcome />)
    const user = userEvent.setup()

    await user.press(screen.getByText('Siguiente'))
    await user.press(screen.getByText('Siguiente'))
    await user.press(screen.getByText('Siguiente'))

    expect(screen.getByText('100% PRIVADO Y SEGURO')).toBeTruthy()
    expect(screen.getByText('Comenzar')).toBeTruthy()

    await user.press(screen.getByText('Comenzar'))
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })
})
