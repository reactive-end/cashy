/**
 * Pruebas de utilidades del cliente Supabase y procesamiento
 * de identidades OAuth de Google.
 */

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { AuthError } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'

import {
  extractGoogleIdentity,
  extractParamsFromUrl,
  getCurrentAuthUser,
  getCurrentSession,
  signInWithGoogle,
  signInWithGoogleNative,
  signInWithGoogleWeb,
  signOut,
  supabase
} from '@src/services/supabase'

jest.mock('expo-web-browser')

const openAuthSessionAsyncMock = WebBrowser.openAuthSessionAsync as jest.Mock

describe('extractGoogleIdentity', () => {
  it('extrae nombre y apellido desde full_name', () => {
    const user = {
      id: 'uuid-1',
      email: 'juan.perez@example.com',
      user_metadata: {
        full_name: 'Juan Perez',
        avatar_url: 'https://example.com/avatar.png'
      }
    }

    const identity = extractGoogleIdentity(user)
    expect(identity.id).toBe('uuid-1')
    expect(identity.email).toBe('juan.perez@example.com')
    expect(identity.firstName).toBe('Juan')
    expect(identity.lastName).toBe('Perez')
    expect(identity.avatarUrl).toBe('https://example.com/avatar.png')
  })

  it('prioriza given_name y family_name cuando estan disponibles', () => {
    const user = {
      id: 'uuid-2',
      email: 'maria@example.com',
      user_metadata: {
        full_name: 'Maria Gomez Rodriguez',
        given_name: 'Maria',
        family_name: 'Gomez Rodriguez'
      }
    }

    const identity = extractGoogleIdentity(user)
    expect(identity.firstName).toBe('Maria')
    expect(identity.lastName).toBe('Gomez Rodriguez')
  })

  it('asigna valor por defecto si no hay nombres en metadatos', () => {
    const user = {
      id: 'uuid-3',
      email: 'solo.correo@example.com',
      user_metadata: {}
    }

    const identity = extractGoogleIdentity(user)
    expect(identity.firstName).toBe('Usuario')
    expect(identity.lastName).toBe('')
  })
})

describe('extractParamsFromUrl', () => {
  it('extrae parametros desde hash fragment (#)', () => {
    const url = 'cashy://auth/callback#access_token=token123&refresh_token=ref456&type=bearer'
    const params = extractParamsFromUrl(url)

    expect(params.access_token).toBe('token123')
    expect(params.refresh_token).toBe('ref456')
    expect(params.type).toBe('bearer')
  })

  it('extrae parametros desde query string (?)', () => {
    const url = 'cashy://auth/callback?code=codigo123&state=xyz'
    const params = extractParamsFromUrl(url)

    expect(params.code).toBe('codigo123')
    expect(params.state).toBe('xyz')
  })

  it('devuelve objeto vacio si la url no tiene parametros', () => {
    const url = 'cashy://auth/callback'
    const params = extractParamsFromUrl(url)

    expect(params).toEqual({})
  })
})

describe('signInWithGoogleNative', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('inicia sesion exitosamente con idToken nativo', async () => {
    const fakeUser = {
      id: 'native-u1',
      email: 'native@example.com',
      app_metadata: {},
      user_metadata: { full_name: 'Native User' },
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00Z'
    }

    const fakeSession = {
      access_token: 'native-tok',
      refresh_token: 'native-ref',
      expires_in: 3600,
      token_type: 'bearer' as const,
      user: fakeUser
    }

    jest.spyOn(supabase.auth, 'signInWithIdToken').mockResolvedValueOnce({
      data: { user: fakeUser, session: fakeSession },
      error: null
    })

    const result = await signInWithGoogleNative()
    expect(result.success).toBe(true)
    expect(result.user?.email).toBe('native@example.com')
    expect(result.session?.access_token).toBe('native-tok')
  })

  it('retorna canceled cuando el usuario cancela la seleccion de cuenta', async () => {
    jest.spyOn(GoogleSignin, 'signIn').mockRejectedValueOnce({
      code: statusCodes.SIGN_IN_CANCELLED
    })

    const result = await signInWithGoogleNative()
    expect(result.success).toBe(false)
    expect(result.canceled).toBe(true)
  })

  it('maneja error cuando supabase.auth.signInWithIdToken falla', async () => {
    jest.spyOn(GoogleSignin, 'signIn').mockResolvedValueOnce({
      type: 'success',
      data: {
        idToken: 'some-token',
        scopes: [],
        serverAuthCode: null,
        user: { id: '1', name: 'A', email: 'a@a.com', photo: '', familyName: '', givenName: '' }
      }
    })

    jest.spyOn(supabase.auth, 'signInWithIdToken').mockResolvedValueOnce({
      data: { user: null, session: null },
      error: new AuthError('Token inválido', 401)
    })

    const result = await signInWithGoogleNative()
    expect(result.success).toBe(false)
    expect(result.error).toContain('Token inválido')
  })

  it('retorna canceled cuando signinResult.type es cancelled', async () => {
    jest.spyOn(GoogleSignin, 'signIn').mockResolvedValueOnce({
      type: 'cancelled',
      data: null
    })

    const result = await signInWithGoogleNative()
    expect(result.success).toBe(false)
    expect(result.canceled).toBe(true)
  })
})

describe('signInWithGoogleWeb', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('maneja error si no se puede generar la URL de OAuth', async () => {
    jest.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValueOnce({
      data: { provider: 'google', url: null },
      error: new AuthError('Error al generar URL', 400)
    })

    const result = await signInWithGoogleWeb()
    expect(result.success).toBe(false)
    expect(result.error).toContain('Error al generar URL')
  })

  it('retorna canceled cuando el usuario cancela la ventana del navegador', async () => {
    jest.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValueOnce({
      data: { provider: 'google', url: 'https://auth.supabase.co/oauth' },
      error: null
    })

    openAuthSessionAsyncMock.mockResolvedValueOnce({ type: 'cancel' })

    const result = await signInWithGoogleWeb()
    expect(result.success).toBe(false)
    expect(result.canceled).toBe(true)
  })

  it('retorna error si el resultado del navegador no es success', async () => {
    jest.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValueOnce({
      data: { provider: 'google', url: 'https://auth.supabase.co/oauth' },
      error: null
    })

    openAuthSessionAsyncMock.mockResolvedValueOnce({ type: 'failed' })

    const result = await signInWithGoogleWeb()
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('procesa tokens access_token y refresh_token exitosamente', async () => {
    jest.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValueOnce({
      data: { provider: 'google', url: 'https://auth.supabase.co/oauth' },
      error: null
    })

    openAuthSessionAsyncMock.mockResolvedValueOnce({
      type: 'success',
      url: 'cashy://auth/callback#access_token=tok123&refresh_token=ref123'
    })

    const fakeUser = {
      id: 'u-1',
      email: 'alex@example.com',
      app_metadata: {},
      user_metadata: { full_name: 'Alex Developer' },
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00Z'
    }

    const fakeSession = {
      access_token: 'tok123',
      refresh_token: 'ref123',
      expires_in: 3600,
      token_type: 'bearer' as const,
      user: fakeUser
    }

    jest.spyOn(supabase.auth, 'setSession').mockResolvedValueOnce({
      data: { user: fakeUser, session: fakeSession },
      error: null
    })

    const result = await signInWithGoogleWeb()
    expect(result.success).toBe(true)
    expect(result.user?.firstName).toBe('Alex')
    expect(result.user?.lastName).toBe('Developer')
  })

  it('procesa auth code si se retorna por query string', async () => {
    jest.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValueOnce({
      data: { provider: 'google', url: 'https://auth.supabase.co/oauth' },
      error: null
    })

    openAuthSessionAsyncMock.mockResolvedValueOnce({
      type: 'success',
      url: 'cashy://auth/callback?code=code123'
    })

    const fakeUser = {
      id: 'u-2',
      email: 'code@example.com',
      app_metadata: {},
      user_metadata: { full_name: 'Code User' },
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00Z'
    }

    const fakeSession = {
      access_token: 'tok_code',
      refresh_token: 'ref_code',
      expires_in: 3600,
      token_type: 'bearer' as const,
      user: fakeUser
    }

    jest.spyOn(supabase.auth, 'exchangeCodeForSession').mockResolvedValueOnce({
      data: { user: fakeUser, session: fakeSession },
      error: null
    })

    const result = await signInWithGoogleWeb()
    expect(result.success).toBe(true)
    expect(result.user?.email).toBe('code@example.com')
  })
})

describe('signInWithGoogle general', () => {
  it('invoca el flujo nativo si el modulo esta disponible', async () => {
    const fakeUser = {
      id: 'u-gen',
      email: 'general@example.com',
      app_metadata: {},
      user_metadata: { full_name: 'General User' },
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00Z'
    }

    const fakeSession = {
      access_token: 'tok_gen',
      refresh_token: 'ref_gen',
      expires_in: 3600,
      token_type: 'bearer' as const,
      user: fakeUser
    }

    jest.spyOn(supabase.auth, 'signInWithIdToken').mockResolvedValueOnce({
      data: { user: fakeUser, session: fakeSession },
      error: null
    })

    const result = await signInWithGoogle()
    expect(result.success).toBe(true)
    expect(result.user?.email).toBe('general@example.com')
  })
})

describe('signOut y getSession', () => {
  it('cierra sesion llamando supabase.auth.signOut y GoogleSignin.signOut', async () => {
    const signOutSpy = jest.spyOn(supabase.auth, 'signOut').mockResolvedValueOnce({ error: null })
    await signOut()
    expect(signOutSpy).toHaveBeenCalledTimes(1)
    expect(GoogleSignin.signOut).toHaveBeenCalled()
  })

  it('obtiene la sesion actual', async () => {
    jest.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
      data: { session: null },
      error: null
    })
    const sess = await getCurrentSession()
    expect(sess).toBeNull()
  })

  it('obtiene el usuario actual', async () => {
    jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
      data: { user: null },
      error: new AuthError('Sin usuario autenticado', 400)
    })
    const user = await getCurrentAuthUser()
    expect(user).toBeNull()
  })
})
