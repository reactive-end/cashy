/**
 * Almacenamiento local de notificaciones de pago movil pendientes de
 * confirmacion. Persiste las transacciones capturadas para que el
 * usuario pueda revisarlas al abrir la aplicacion o en primer plano.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

import type { ParsedBankNotification } from './types'

/** Clave de persistencia en AsyncStorage */
const STORAGE_KEY = 'cashy.pending-bank-notifications'

/** Maximo de notificaciones pendientes conservadas en cola */
const MAX_QUEUE_SIZE = 10

/**
 * Obtiene la lista de notificaciones de pago movil pendientes de revision.
 * @returns Arreglo de notificaciones parseadas no resueltas
 */
export async function getPendingBankNotifications(): Promise<ParsedBankNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ParsedBankNotification[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Agrega una notificacion a la cola de pendientes, deduplicando por contenido.
 * @param notification Notificacion estructurada a registrar
 * @returns true si fue agregada, false si ya existia en cola
 */
export async function enqueueBankNotification(
  notification: ParsedBankNotification
): Promise<boolean> {
  try {
    const current = await getPendingBankNotifications()

    // Evitar duplicados recientes por banco, monto y remitente
    const isDuplicate = current.some(
      (item) =>
        item.bank === notification.bank &&
        item.amountCents === notification.amountCents &&
        item.sender === notification.sender &&
        item.rawBody === notification.rawBody
    )

    if (isDuplicate) return false

    const updated = [notification, ...current].slice(0, MAX_QUEUE_SIZE)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return true
  } catch {
    return false
  }
}

/**
 * Remueve una notificacion procesada o descartada de la cola.
 * @param detectedAt Marca de tiempo identificadora de la notificacion
 */
export async function dequeueBankNotification(detectedAt: string): Promise<void> {
  try {
    const current = await getPendingBankNotifications()
    const updated = current.filter((item) => item.detectedAt !== detectedAt)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Falla silenciosa en almacenamiento
  }
}

/**
 * Limpia todas las notificaciones pendientes de confirmacion.
 */
export async function clearBankNotifications(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY)
  } catch {
    // Falla silenciosa en almacenamiento
  }
}
