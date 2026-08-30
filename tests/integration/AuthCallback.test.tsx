/**
 * Pruebas de integracion para la ruta de callback de OAuth (app/auth/callback.tsx).
 * Verifica la resolucion de tokens y redireccion adecuada.
 */

import { render, waitFor } from '@testing-library/react-native'
import { Linking } from 'react-native'

import AuthCallback from '../../app/auth/callback'
import { isProfileComplete } from '@src/db/profile'
import { supabase } from '@src/services/supabase'

jest.mock('@src/db/profile')
jest.mock('@src/services/supabase', () => {
  const actual = jest.requireActual('@src/services/supabase')
  return {
    ...actual,
    supabase: {
      auth: {
        setSession: jest.fn(),
        exchangeCodeForSession: jest.fn(),
        getSession: jest.fn()
      }
    }
  }
})

const mockReplace = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({})
}))

const isProfileCompleteMock = isProfileComplete as jest.Mock
const setSessionMock = supabase.auth.setSession as jest.Mock

describe('AuthCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    isProfileCompleteMock.mockResolvedValue(false)
    setSessionMock.mockResolvedValue({ data: { session: {} }, error: null })
  })

  it('procesa access_token y refresh_token del deep link y navega a onboarding', async () => {
    jest
      .spyOn(Linking, 'getInitialURL')
      .mockResolvedValue('cashy://auth/callback#access_token=token123&refresh_token=refresh456')

    await render(<AuthCallback />)

    await waitFor(() => {
      expect(setSessionMock).toHaveBeenCalledWith({
        access_token: 'token123',
        refresh_token: 'refresh456'
      })
      expect(mockReplace).toHaveBeenCalledWith('/onboarding')
    })
  })

  it('navega directo a tabs si el perfil ya estaba completo', async () => {
    isProfileCompleteMock.mockResolvedValue(true)
    jest
      .spyOn(Linking, 'getInitialURL')
      .mockResolvedValue('cashy://auth/callback#access_token=token123&refresh_token=refresh456')

    await render(<AuthCallback />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)')
    })
  })
})
