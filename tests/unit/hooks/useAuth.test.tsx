/**
 * Pruebas unitarias del hook useAuth.
 */

import type { Session } from '@supabase/supabase-js'
import { act, renderHook, waitFor } from '@testing-library/react-native'

import { __resetAuthCacheForTests, useAuth } from '@src/hooks/useAuth'
import * as supabaseService from '@src/services/supabase'

jest.mock('@src/services/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    }
  },
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
  getCurrentSession: jest.fn(),
  getCurrentAuthUser: jest.fn(),
  extractGoogleIdentity: jest.fn()
}))

const signInMock = supabaseService.signInWithGoogle as jest.Mock
const signOutMock = supabaseService.signOut as jest.Mock
const getCurrentSessionMock = supabaseService.getCurrentSession as jest.Mock
const getCurrentAuthUserMock = supabaseService.getCurrentAuthUser as jest.Mock

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __resetAuthCacheForTests()
    getCurrentSessionMock.mockResolvedValue(null)
    getCurrentAuthUserMock.mockResolvedValue(null)
  })

  it('inicia con estado no autenticado si no hay sesion previa', async () => {
    const { result } = await renderHook(() => useAuth())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })

  it('inicia sesion exitosamente y actualiza el estado reactivo', async () => {
    const fakeUser = {
      id: 'usr-1',
      email: 'alex@example.com',
      firstName: 'Alex',
      lastName: 'Perez'
    }
    const fakeSession: Session = {
      access_token: 'tok-1',
      refresh_token: 'ref-1',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'usr-1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-01-01T00:00:00Z'
      }
    }

    signInMock.mockImplementation(async () => {
      getCurrentSessionMock.mockResolvedValue(fakeSession)
      getCurrentAuthUserMock.mockResolvedValue(fakeUser)
      return {
        success: true,
        user: fakeUser,
        session: fakeSession
      }
    })

    const { result } = await renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      const res = await result.current.signIn()
      expect(res.success).toBe(true)
    })

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))
    expect(result.current.user).toEqual(fakeUser)
  })

  it('cierra sesion correctamente', async () => {
    signOutMock.mockResolvedValue(undefined)

    const { result } = await renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
