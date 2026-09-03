/**
 * Hook useSubscription: gestiona el estado de suscripcion y beneficios Cashy PRO.
 * Consulta Supabase cuando hay sesion activa y recurre al cache local en
 * caso de estar offline para asegurar disponibilidad continua.
 */

import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@src/hooks/useAuth'
import { subscribe } from '@src/lib/events'
import {
  fetchUserSubscription,
  isSubscriptionActive,
  loadSubscriptionCache
} from '@src/services/subscriptions'
import type { SubscriptionPlan, UserSubscription } from '@src/types/domain'

export interface UseSubscriptionResult {
  subscription: UserSubscription | null
  isPro: boolean
  plan: SubscriptionPlan
  loading: boolean
  refresh: () => Promise<void>
}

let cachedSub: UserSubscription | null = null
let initializedSub = false

/** Suscripcion simulada para entornos de desarrollo y testing local */
const DEV_SUBSCRIPTION: UserSubscription = {
  id: 'dev-subscription',
  userId: 'dev-tester-user',
  email: 'developer@cashy.local',
  plan: 'pro',
  status: 'active',
  expiresAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
}

/** Reinicia el cache de modulo para pruebas */
export function __resetSubscriptionCacheForTests(): void {
  cachedSub = null
  initializedSub = false
}

/**
 * Hook reactivo para consultar y refrescar el plan Cashy PRO.
 * @returns Estado de suscripcion, flag isPro y accion de refresco
 */
export function useSubscription(): UseSubscriptionResult {
  const { user, isAuthenticated } = useAuth()
  const [subscription, setSubscription] = useState<UserSubscription | null>(cachedSub)
  const [loading, setLoading] = useState(!initializedSub)

  const reload = useCallback(async () => {
    try {
      if (isAuthenticated && user?.id) {
        const sub = await fetchUserSubscription(user.id)
        cachedSub = sub
        setSubscription(sub)
      } else {
        const cached = await loadSubscriptionCache()
        cachedSub = cached
        setSubscription(cached)
      }
    } finally {
      initializedSub = true
      setLoading(false)
    }
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    void reload()

    const unsubscribeEvent = subscribe('subscription-changed', () => {
      void reload()
    })

    const unsubscribeAuth = subscribe('auth-changed', () => {
      void reload()
    })

    return () => {
      unsubscribeEvent()
      unsubscribeAuth()
    }
  }, [reload])

  const isDevMode =
    user?.id === 'dev-tester-user' ||
    (typeof __DEV__ !== 'undefined' && __DEV__ && process.env.NODE_ENV !== 'test')

  const isPro = isDevMode || isSubscriptionActive(subscription)
  const plan: SubscriptionPlan = isDevMode ? 'pro' : (subscription?.plan ?? 'free')
  const activeSubscription = subscription ?? (isDevMode ? DEV_SUBSCRIPTION : null)

  return {
    subscription: activeSubscription,
    isPro,
    plan,
    loading,
    refresh: reload
  }
}
