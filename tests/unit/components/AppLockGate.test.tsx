/**
 * Pruebas unitarias del organismo AppLockGate.
 */

import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { Text } from 'react-native'

import { AppLockGate, INACTIVITY_LOCK_THRESHOLD_MS } from '@src/components/organisms/AppLockGate'
import { useSettings } from '@src/hooks/useSettings'
import { authenticateWithBiometrics } from '@src/lib/biometrics'

jest.mock('@src/hooks/useSettings')
jest.mock('@src/lib/biometrics')

const useSettingsMock = useSettings as jest.Mock
const authenticateMock = authenticateWithBiometrics as jest.Mock

describe('AppLockGate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza directamente los hijos si biometricsEnabled es false', async () => {
    useSettingsMock.mockReturnValue({
      settings: { biometricsEnabled: false }
    })

    const screen = await render(
      <AppLockGate>
        <Text testID="contenido-privado">Contenido Privado</Text>
      </AppLockGate>
    )

    expect(screen.getByTestId('contenido-privado')).toBeTruthy()
    expect(screen.queryByTestId('app-lock-screen')).toBeNull()
  })

  it('muestra la pantalla de bloqueo y solicita autenticacion si biometricsEnabled es true', async () => {
    useSettingsMock.mockReturnValue({
      settings: { biometricsEnabled: true }
    })
    authenticateMock.mockResolvedValueOnce(false)

    const screen = await render(
      <AppLockGate>
        <Text testID="contenido-privado">Contenido Privado</Text>
      </AppLockGate>
    )

    expect(screen.getByTestId('app-lock-screen')).toBeTruthy()
    expect(screen.queryByTestId('contenido-privado')).toBeNull()
    expect(authenticateMock).toHaveBeenCalled()
  })

  it('desbloquea y muestra el contenido cuando la autenticacion tiene exito', async () => {
    useSettingsMock.mockReturnValue({
      settings: { biometricsEnabled: true }
    })
    authenticateMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    const screen = await render(
      <AppLockGate>
        <Text testID="contenido-privado">Contenido Privado</Text>
      </AppLockGate>
    )

    expect(screen.getByTestId('app-lock-screen')).toBeTruthy()

    const unlockButton = screen.getByTestId('app-lock-unlock-button')
    await act(async () => {
      fireEvent.press(unlockButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('contenido-privado')).toBeTruthy()
    })
    expect(screen.queryByTestId('app-lock-screen')).toBeNull()
  })
})
