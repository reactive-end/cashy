/**
 * Servicio de suscripciones y verificacion de estado Cashy PRO.
 * Consulta la tabla 'subscriptions' en Supabase y mantiene cache
 * en AsyncStorage para permitir operacion 100% offline.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

import { SUBSCRIPTION_CACHE_KEY } from '@src/constants/supabase'
import { supabase } from '@src/services/supabase'
import type { SubscriptionPlan, SubscriptionStatus, UserSubscription } from '@src/types/domain'

/** Forma de la fila en la tabla de Supabase en snake_case */
interface SubscriptionRow {
  id: string
  user_id: string
  email: string | null
  plan: string
  status: string
  expires_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Type guard para validar que un objeto plano corresponde a una fila de suscripcion.
 */
function isSubscriptionRow(value: object): value is SubscriptionRow {
  const row = value as Partial<SubscriptionRow>
  return (
    typeof row.id === 'string' &&
    typeof row.user_id === 'string' &&
    typeof row.plan === 'string' &&
    typeof row.status === 'string'
  )
}

/**
 * Type guard para validar que un objeto corresponde a un UserSubscription valido.
 */
function isUserSubscription(value: object): value is UserSubscription {
  const sub = value as Partial<UserSubscription>
  return (
    typeof sub.id === 'string' &&
    typeof sub.userId === 'string' &&
    (sub.plan === 'free' || sub.plan === 'pro') &&
    (sub.status === 'active' || sub.status === 'expired' || sub.status === 'canceled')
  )
}

/**
 * Mapea una fila de PostgreSQL a la interfaz del dominio UserSubscription.
 */
function mapRowToSubscription(row: SubscriptionRow): UserSubscription {
  const plan: SubscriptionPlan = row.plan === 'pro' ? 'pro' : 'free'
  let status: SubscriptionStatus = 'active'
  if (row.status === 'expired' || row.status === 'canceled') {
    status = row.status
  }

  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    plan,
    status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * Determina si una suscripcion otorga beneficios PRO activos.
 * @param sub Suscripcion a evaluar
 * @returns true si el plan es pro, el estado es activo y no ha expirado
 */
export function isSubscriptionActive(sub: UserSubscription | null): boolean {
  if (!sub) return false
  if (sub.plan !== 'pro') return false
  if (sub.status !== 'active') return false

  if (sub.expiresAt) {
    const expiryTime = new Date(sub.expiresAt).getTime()
    if (isNaN(expiryTime) || expiryTime <= Date.now()) {
      return false
    }
  }

  return true
}

/**
 * Guarda el snapshot de la suscripcion en el almacenamiento local.
 */
export async function saveSubscriptionCache(sub: UserSubscription | null): Promise<void> {
  if (!sub) {
    await AsyncStorage.removeItem(SUBSCRIPTION_CACHE_KEY)
    return
  }
  await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(sub))
}

/**
 * Carga el snapshot de la suscripcion desde el cache local.
 */
export async function loadSubscriptionCache(): Promise<UserSubscription | null> {
  try {
    const raw = await AsyncStorage.getItem(SUBSCRIPTION_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as object
    if (typeof parsed === 'object' && parsed !== null && isUserSubscription(parsed)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

/**
 * Consulta el estado de suscripcion del usuario en Supabase.
 * En caso de error o sin conexion, recurre al cache local para asegurar
 * continuidad de funciones al usuario.
 * @param userId Identificador UUID del usuario en Supabase auth
 * @returns Suscripcion actualizada o cacheada
 */
export async function fetchUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) {
      return await loadSubscriptionCache()
    }

    if (typeof data === 'object' && isSubscriptionRow(data)) {
      const mapped = mapRowToSubscription(data)
      await saveSubscriptionCache(mapped)
      return mapped
    }

    return await loadSubscriptionCache()
  } catch {
    return await loadSubscriptionCache()
  }
}
