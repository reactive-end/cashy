/**
 * Hook useAuth: estado reactivo de la sesion del usuario con Google OAuth y Supabase.
 * Permite iniciar sesion, cerrar sesion y consultar la identidad sincronizada.
 */

import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'

import { emit, subscribe } from '@src/lib/events'
import {
  extractGoogleIdentity,
  getCurrentAuthUser,
  getCurrentSession,
  signInWithGoogle,
  signOut as supabaseSignOut,
  supabase,
  type SignInResult
} from '@src/services/supabase'
import type { AuthUser } from '@src/types/domain'

export interface UseAuthResult {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signIn: () => Promise<SignInResult>
  signOut: () => Promise<void>
}

let cachedUser: AuthUser | null = null
let cachedSession: Session | null = null
let initialized = false

/** Reinicia el cache de modulo para pruebas */
export function __resetAuthCacheForTests(): void {
  cachedUser = null
  cachedSession = null
  initialized = false
}

/**
 * Hook reactivo para autenticacion con Google y Supabase.
 * @returns Estado de autenticacion y acciones de login/logout
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(cachedUser)
  const [session, setSession] = useState<Session | null>(cachedSession)
  const [loading, setLoading] = useState(!initialized)

  const reload = useCallback(async () => {
    try {
      const sess = await getCurrentSession()
      const u = await getCurrentAuthUser()
      cachedSession = sess
      cachedUser = u
      setSession(sess)
      setUser(u)
    } finally {
      initialized = true
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialized) {
      void reload()
    }

    const unsubscribeEvent = subscribe('auth-changed', () => {
      void reload()
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      cachedSession = newSession
      if (newSession?.user) {
        const u = extractGoogleIdentity(newSession.user)
        cachedUser = u
        setUser(u)
      } else {
        cachedUser = null
        setUser(null)
      }
      setSession(newSession)
      emit('auth-changed')
    })

    return () => {
      unsubscribeEvent()
      authListener.subscription.unsubscribe()
    }
  }, [reload])

  const signIn = useCallback(async (): Promise<SignInResult> => {
    setLoading(true)
    try {
      const res = await signInWithGoogle()
      if (res.success && res.user && res.session) {
        cachedUser = res.user
        cachedSession = res.session
        setUser(res.user)
        setSession(res.session)
        emit('auth-changed')
      }
      return res
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      await supabaseSignOut()
      cachedUser = null
      cachedSession = null
      setUser(null)
      setSession(null)
      emit('auth-changed')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    user,
    session,
    loading,
    isAuthenticated: session !== null && user !== null,
    signIn,
    signOut
  }
}
