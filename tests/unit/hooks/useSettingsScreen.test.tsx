/**
 * Pruebas unitarias del hook useSettingsScreen.
 */

import { renderHook, waitFor } from '@testing-library/react-native'

import { useSettingsScreen } from '@src/hooks/useSettingsScreen'
import { loadSettings } from '@src/db/settings'
import { getProfile } from '@src/db/profile'
import { buildSettings } from '../../helpers/factories'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() })
}))

jest.mock('@src/db/settings', () => ({
  loadSettings: jest.fn()
}))

jest.mock('@src/db/profile', () => ({
  getProfile: jest.fn(async () => null)
}))

jest.mock('@src/services/appUpdate', () => ({
  installedVersion: jest.fn(() => '1.2.0')
}))

const loadSettingsMock = loadSettings as jest.Mock
const getProfileMock = getProfile as jest.Mock

describe('useSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    loadSettingsMock.mockResolvedValue(buildSettings({ baseCurrency: 'VES' }))
    getProfileMock.mockResolvedValue({ firstName: 'Maria', lastName: 'Gomez', email: 'm@g.com' })
  })

  it('inicializa y carga los datos de perfil y ajustes', async () => {
    const { result } = await renderHook(() => useSettingsScreen())
    await waitFor(() => expect(result.current?.displayName).toBe('Maria Gomez'))

    expect(result.current.baseCurrency).toBe('VES')
    expect(result.current.versionLabel).toBe('v1.2.0')
  })

  it('navega a subpantallas con navigateTo', async () => {
    const { result } = await renderHook(() => useSettingsScreen())
    await waitFor(() => expect(result.current?.displayName).toBe('Maria Gomez'))

    result.current.navigateTo('/settings/currency')
    expect(mockPush).toHaveBeenCalledWith('/settings/currency')
  })
})
