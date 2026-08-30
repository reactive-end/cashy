/**
 * Pruebas unitarias del hook useSubscription.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import { useAuth } from '@src/hooks/useAuth'
import { __resetSubscriptionCacheForTests, useSubscription } from '@src/hooks/useSubscription'
import * as subService from '@src/services/subscriptions'
import type { UserSubscription } from '@src/types/domain'

jest.mock('@src/hooks/useAuth')
jest.mock('@src/services/subscriptions')

const useAuthMock = useAuth as jest.Mock
const fetchUserSubscriptionMock = subService.fetchUserSubscription as jest.Mock
const isSubscriptionActiveMock = subService.isSubscriptionActive as jest.Mock
const loadSubscriptionCacheMock = subService.loadSubscriptionCache as jest.Mock

describe('useSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __resetSubscriptionCacheForTests()
    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: false
    })
    loadSubscriptionCacheMock.mockResolvedValue(null)
    isSubscriptionActiveMock.mockReturnValue(false)
  })

  it('carga desde cache cuando no hay sesion autenticada', async () => {
    const cachedSub: UserSubscription = {
      id: 'sub-cached',
      userId: 'usr-cached',
      email: 'cache@example.com',
      plan: 'free',
      status: 'active',
      expiresAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }
    loadSubscriptionCacheMock.mockResolvedValue(cachedSub)

    const { result } = await renderHook(() => useSubscription())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.subscription).toEqual(cachedSub)
    expect(result.current.plan).toBe('free')
    expect(result.current.isPro).toBe(false)
  })

  it('consulta Supabase cuando el usuario esta autenticado', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'usr-pro', email: 'pro@example.com', firstName: 'Pro', lastName: 'User' },
      isAuthenticated: true
    })

    const proSub: UserSubscription = {
      id: 'sub-pro',
      userId: 'usr-pro',
      email: 'pro@example.com',
      plan: 'pro',
      status: 'active',
      expiresAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }

    fetchUserSubscriptionMock.mockResolvedValue(proSub)
    isSubscriptionActiveMock.mockReturnValue(true)

    const { result } = await renderHook(() => useSubscription())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.subscription).toEqual(proSub)
    expect(result.current.plan).toBe('pro')
    expect(result.current.isPro).toBe(true)
  })

  it('permite refrescar la suscripcion manualmente', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'usr-pro', email: 'pro@example.com', firstName: 'Pro', lastName: 'User' },
      isAuthenticated: true
    })

    fetchUserSubscriptionMock.mockResolvedValue(null)

    const { result } = await renderHook(() => useSubscription())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.refresh()
    })

    expect(fetchUserSubscriptionMock).toHaveBeenCalledTimes(2)
  })
})
