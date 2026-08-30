/**
 * Cliente de Supabase y orquestador de autenticacion con Google OAuth y Google Sign-In nativo.
 * Persiste la sesion en AsyncStorage para garantizar disponibilidad offline.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, type Session } from '@supabase/supabase-js'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'

import {
  GOOGLE_WEB_CLIENT_ID,
  SUPABASE_ANON_KEY,
  SUPABASE_REDIRECT_URL,
  SUPABASE_URL
} from '@src/constants/supabase'
import { getErrorMessage } from '@src/lib/errors'
import type { AuthUser } from '@src/types/domain'

/** Notifica a WebBrowser que complete sesiones pendientes si aplica */
void WebBrowser.maybeCompleteAuthSession()

/** Instancia del cliente de Supabase para toda la aplicacion */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

/** Forma del modulo @react-native-google-signin/google-signin */
type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin')

let googleSigninInstance: GoogleSigninModule | null = null
let googleSigninConfigured = false

/**
 * Detecta si la app corre dentro del cliente Expo Go.
 * @returns true cuando los modulos nativos no estan disponibles
 */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient
}

/**
 * Resuelve el modulo nativo de Google Sign-In bajo demanda.
 * @returns El modulo o null en Expo Go / entornos no compatibles
 */
export function getGoogleSigninModule(): GoogleSigninModule | null {
  if (isExpoGo()) return null

  if (!googleSigninInstance) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      googleSigninInstance = require('@react-native-google-signin/google-signin') as GoogleSigninModule
    } catch {
      return null
    }
  }

  return googleSigninInstance
}

/**
 * Configura GoogleSignin con el Web Client ID una sola vez.
 */
function ensureGoogleSigninConfigured(): boolean {
  const gSignin = getGoogleSigninModule()
  if (!gSignin) return false

  if (!googleSigninConfigured) {
    gSignin.GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['email', 'profile']
    })
    googleSigninConfigured = true
  }

  return true
}

/**
 * Extrae parametros de consulta o fragmentos de hash desde una URL.
 * @param url URL devuelta por el flujo de redireccion
 * @returns Diccionario clave-valor con los parametros decodificados
 */
export function extractParamsFromUrl(url: string): Record<string, string> {
  const hashIndex = url.indexOf('#')
  const queryIndex = url.indexOf('?')

  const rawParams =
    hashIndex !== -1
      ? url.substring(hashIndex + 1)
      : queryIndex !== -1
        ? url.substring(queryIndex + 1)
        : ''

  const params: Record<string, string> = {}
  if (!rawParams) return params

  const pairs = rawParams.split('&')
  for (const pair of pairs) {
    const [key, value] = pair.split('=')
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value)
    }
  }

  return params
}

/**
 * Extrae y normaliza la identidad del usuario a partir de su cuenta de Google.
 * @param user Usuario devuelto por la sesion de Supabase
 * @returns Estructura AuthUser con nombres limpios y correo
 */
export function extractGoogleIdentity(user: {
  id: string
  email?: string
  user_metadata?: Record<string, string | number | boolean | null>
}): AuthUser {
  const email = user.email ?? ''
  const metadata = user.user_metadata ?? {}

  const fullName = typeof metadata.full_name === 'string' ? metadata.full_name.trim() : ''
  const givenName = typeof metadata.given_name === 'string' ? metadata.given_name.trim() : ''
  const familyName = typeof metadata.family_name === 'string' ? metadata.family_name.trim() : ''

  let firstName = givenName
  let lastName = familyName

  if (!firstName && !lastName && fullName) {
    const parts = fullName.split(' ')
    firstName = parts[0] ?? ''
    lastName = parts.slice(1).join(' ')
  }

  const avatarUrl =
    typeof metadata.avatar_url === 'string'
      ? metadata.avatar_url
      : typeof metadata.picture === 'string'
        ? metadata.picture
        : undefined

  return {
    id: user.id,
    email,
    firstName: firstName || 'Usuario',
    lastName: lastName || '',
    avatarUrl
  }
}

/** Resultado del flujo de inicio de sesion */
export interface SignInResult {
  success: boolean
  canceled?: boolean
  error?: string
  user?: AuthUser
  session?: Session
}

/**
 * Retorna la URL de redireccion de autenticacion segun el entorno
 * (esquema exp:// en Expo Go o cashy:// en APK standalone).
 */
export function getAuthRedirectUrl(): string {
  try {
    const url = Linking.createURL('auth/callback')
    if (url) return url
  } catch {
    // Fallback retrocompatible
  }
  return SUPABASE_REDIRECT_URL
}

/**
 * Inicia el flujo de autenticacion nativo con Google Play Services.
 * No abre navegador ni expone URLs en pantalla.
 * @returns Resultado con la sesion y usuario si fue exitoso
 */
export async function signInWithGoogleNative(): Promise<SignInResult> {
  const gSignin = getGoogleSigninModule()
  if (!gSignin) {
    return {
      success: false,
      error: 'Inicio de sesión nativo de Google no disponible en este entorno'
    }
  }

  ensureGoogleSigninConfigured()

  try {
    await gSignin.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
    const signinResult = await gSignin.GoogleSignin.signIn()

    if (signinResult.type === 'cancelled') {
      return { success: false, canceled: true }
    }

    const idToken = signinResult.data?.idToken

    if (!idToken) {
      return { success: false, error: 'No se obtuvo el token de identidad de Google' }
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken
    })

    if (sessionError || !sessionData.user || !sessionData.session) {
      return {
        success: false,
        error:
          sessionError?.message ?? 'No se pudo iniciar sesión en Supabase con el token de Google'
      }
    }

    return {
      success: true,
      user: extractGoogleIdentity(sessionData.user),
      session: sessionData.session
    }
  } catch (err) {
    const errorObj = typeof err === 'object' && err !== null ? (err as { code?: string }) : null
    if (errorObj?.code === gSignin.statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, canceled: true }
    }

    return { success: false, error: getErrorMessage(err) }
  }
}

/**
 * Inicia el flujo de autenticacion web via WebBrowser y OAuth.
 * Utilizado como fallback en Expo Go.
 * @returns Resultado con la sesion y usuario si fue exitoso
 */
export async function signInWithGoogleWeb(): Promise<SignInResult> {
  try {
    const redirectUrl = getAuthRedirectUrl()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true
      }
    })

    if (error || !data.url) {
      return {
        success: false,
        error: error?.message ?? 'No se pudo generar la URL de autenticación'
      }
    }

    const authResponse = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)

    if (authResponse.type === 'cancel' || authResponse.type === 'dismiss') {
      return { success: false, canceled: true }
    }

    if (authResponse.type !== 'success' || !authResponse.url) {
      return { success: false, error: 'No se completó la autenticación con Google' }
    }

    const params = extractParamsFromUrl(authResponse.url)

    if (params.access_token && params.refresh_token) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token
      })

      if (sessionError || !sessionData.user || !sessionData.session) {
        return { success: false, error: sessionError?.message ?? 'No se pudo guardar la sesión' }
      }

      return {
        success: true,
        user: extractGoogleIdentity(sessionData.user),
        session: sessionData.session
      }
    }

    if (params.code) {
      const { data: exchangeData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(params.code)

      if (exchangeError || !exchangeData.user || !exchangeData.session) {
        return { success: false, error: exchangeError?.message ?? 'No se pudo canjear el código' }
      }

      return {
        success: true,
        user: extractGoogleIdentity(exchangeData.user),
        session: exchangeData.session
      }
    }

    return { success: false, error: 'No se recibieron credenciales en la respuesta' }
  } catch (err) {
    return { success: false, error: getErrorMessage(err) }
  }
}

/**
 * Inicia el flujo de autenticacion con Google.
 * Intenta primero el flujo nativo con Google Play Services;
 * si corre en Expo Go o el modulo no esta disponible, recurre a Web OAuth.
 * @returns Resultado con la sesion y usuario si fue exitoso
 */
export async function signInWithGoogle(): Promise<SignInResult> {
  const gSignin = getGoogleSigninModule()
  if (gSignin) {
    return signInWithGoogleNative()
  }

  return signInWithGoogleWeb()
}

/**
 * Cierra la sesion activa de Supabase y de Google nativo si aplica.
 */
export async function signOut(): Promise<void> {
  const gSignin = getGoogleSigninModule()
  if (gSignin) {
    try {
      await gSignin.GoogleSignin.signOut()
    } catch {
      // Ignora si no habia sesion nativa
    }
  }
  await supabase.auth.signOut()
}

/**
 * Obtiene la sesion activa actualmente si existe.
 */
export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * Obtiene el usuario autenticado actualmente si existe.
 */
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  return extractGoogleIdentity(data.user)
}
