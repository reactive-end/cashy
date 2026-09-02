/**
 * Pruebas unitarias del hook useAccountSettings.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import { useAccountSettings } from '@src/hooks/useAccountSettings'
import { getProfile } from '@src/db/profile'
import { loadSettings } from '@src/db/settings'
import { getExchangeRates } from '@src/services/rates'
import { getIncomes } from '@src/db/incomes'
import { useAuth } from '@src/hooks/useAuth'
import { useSubscription } from '@src/hooks/useSubscription'
import { buildRates, buildSettings } from '../../helpers/factories'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() })
}))

jest.mock('@src/db/profile', () => ({
  getProfile: jest.fn(async () => null)
}))

jest.mock('@src/db/settings', () => ({
  loadSettings: jest.fn()
}))

jest.mock('@src/services/rates', () => ({
  getExchangeRates: jest.fn()
}))

jest.mock('@src/db/incomes', () => ({
  getIncomes: jest.fn(async () => [])
}))

jest.mock('@src/db/incomeReceipts', () => ({
  formatYearMonth: jest.fn(() => '2026-08'),
  getIncomeReceipts: jest.fn(async () => [])
}))

jest.mock('@src/hooks/useAuth', () => ({
  useAuth: jest.fn()
}))

jest.mock('@src/hooks/useSubscription', () => ({
  useSubscription: jest.fn()
}))

const getProfileMock = getProfile as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock
const getExchangeRatesMock = getExchangeRates as jest.Mock
const useAuthMock = useAuth as jest.Mock
const useSubscriptionMock = useSubscription as jest.Mock

describe('useAccountSettings', () => {
  const mockSignIn = jest.fn()
  const mockSignOut = jest.fn()
  const mockRefreshSub = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    loadSettingsMock.mockResolvedValue(buildSettings())
    getExchangeRatesMock.mockResolvedValue(buildRates())
    getProfileMock.mockResolvedValue({ firstName: 'Pedro', lastName: 'Perez', email: 'p@p.com' })

    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: false,
      signIn: mockSignIn,
      signOut: mockSignOut,
      loading: false
    })

    useSubscriptionMock.mockReturnValue({
      isPro: false,
      subscription: null,
      refresh: mockRefreshSub
    })
  })

  it('carga datos de perfil guardados', async () => {
    const { result } = await renderHook(() => useAccountSettings())
    await waitFor(() => expect(result.current?.profileName).toBe('Pedro Perez'))

    expect(result.current.profileEmail).toBe('p@p.com')
    expect(result.current.subscriptionText).toContain('Actualiza a Cashy PRO')
  })

  it('navega a subpantallas con openEditProfile y openProPayment', async () => {
    const { result } = await renderHook(() => useAccountSettings())
    await waitFor(() => expect(result.current?.profileName).toBe('Pedro Perez'))

    result.current.openEditProfile()
    expect(mockPush).toHaveBeenCalledWith('/edit-profile')

    result.current.openProPayment()
    expect(mockPush).toHaveBeenCalledWith('/settings/pro-payment')
  })

  it('vincula Google exitosamente al invocar handleLinkGoogle', async () => {
    mockSignIn.mockResolvedValue({ success: true })
    const { result } = await renderHook(() => useAccountSettings())
    await waitFor(() => expect(result.current?.profileName).toBe('Pedro Perez'))

    await act(async () => {
      await result.current.handleLinkGoogle()
    })

    expect(mockRefreshSub).toHaveBeenCalled()
    expect(result.current.notice?.tone).toBe('success')
  })

  it('muestra error cuando handleLinkGoogle falla', async () => {
    mockSignIn.mockResolvedValue({ success: false, error: 'Fallo al autenticar' })
    const { result } = await renderHook(() => useAccountSettings())
    await waitFor(() => expect(result.current?.profileName).toBe('Pedro Perez'))

    await act(async () => {
      await result.current.handleLinkGoogle()
    })

    expect(result.current.notice?.tone).toBe('danger')
    expect(result.current.notice?.message).toBe('Fallo al autenticar')
  })

  it('invoca handleSignOut y cierra sesion', async () => {
    const { result } = await renderHook(() => useAccountSettings())
    await waitFor(() => expect(result.current?.profileName).toBe('Pedro Perez'))

    await act(async () => {
      await result.current.handleSignOut()
    })

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('muestra vigencia pro cuando el usuario es PRO', async () => {
    useSubscriptionMock.mockReturnValue({
      isPro: true,
      subscription: { expiresAt: '2026-12-31T00:00:00.000Z' },
      refresh: mockRefreshSub
    })

    const { result } = await renderHook(() => useAccountSettings())
    await waitFor(() => expect(result.current?.profileName).toBe('Pedro Perez'))

    expect(result.current.subscriptionText).toContain('Suscripción Cashy PRO activa hasta el')
  })

  it('muestra vigencia vitalicia cuando el usuario es PRO sin fecha de expiracion', async () => {
    useSubscriptionMock.mockReturnValue({
      isPro: true,
      subscription: { expiresAt: null },
      refresh: mockRefreshSub
    })

    const { result } = await renderHook(() => useAccountSettings())
    await waitFor(() => expect(result.current?.profileName).toBe('Pedro Perez'))

    expect(result.current.subscriptionText).toContain('Suscripción Cashy PRO vitalicia activa.')
  })
})
