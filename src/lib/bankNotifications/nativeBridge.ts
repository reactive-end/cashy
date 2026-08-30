/**
 * Puente entre el modulo nativo Android de escucha de notificaciones
 * y la logica de dominio de Cashy. Maneja permisos, drenado de cola
 * y suscripcion a eventos en tiempo real con repliegue seguro.
 */

import {
  addBankNotificationListener,
  getNativePendingBankNotifications,
  isNotificationListenerAvailable,
  isNotificationListenerPermissionGranted,
  requestNotificationListenerPermission
} from '@modules/bank-notification-listener'

import { parseBankNotification } from './parser'
import { enqueueBankNotification } from './storage'
import type { ParsedBankNotification } from './types'

/**
 * Consulta si el dispositivo y entorno admiten la escucha nativa de notificaciones.
 * @returns true en standalone Android con el modulo vinculado
 */
export function isBankNotificationListenerSupported(): boolean {
  return isNotificationListenerAvailable()
}

/**
 * Consulta si el usuario ya otorgo el permiso de Acceso a Notificaciones en Android.
 * @returns true si el servicio esta autorizado
 */
export function hasBankNotificationPermission(): boolean {
  return isNotificationListenerPermissionGranted()
}

/**
 * Abre los ajustes del sistema Android para que el usuario active Cashy.
 */
export function requestBankNotificationPermission(): void {
  requestNotificationListenerPermission()
}

/**
 * Drena las notificaciones bancarias acumuladas por el servicio nativo,
 * las parsea con los extractores disponibles y las encola en almacenamiento local.
 * @returns Arreglo de notificaciones parseadas y persistidas
 */
export async function drainNativeBankNotifications(): Promise<ParsedBankNotification[]> {
  const rawList = getNativePendingBankNotifications()
  const enqueued: ParsedBankNotification[] = []

  for (const raw of rawList) {
    const parsed = parseBankNotification(raw.title, raw.body, raw.packageName)
    if (parsed) {
      const added = await enqueueBankNotification(parsed)
      if (added) enqueued.push(parsed)
    }
  }

  return enqueued
}

/**
 * Suscribe la aplicacion a nuevas notificaciones bancarias interceptadas en vivo.
 * @param onDetected Callback ejecutado al detectar un pago movil valido
 * @returns Desuscriptor del evento
 */
export function subscribeToNativeBankNotifications(
  onDetected?: (notification: ParsedBankNotification) => void
): () => void {
  return addBankNotificationListener((raw) => {
    const parsed = parseBankNotification(raw.title, raw.body, raw.packageName)
    if (parsed) {
      void enqueueBankNotification(parsed).then((added) => {
        if (added && onDetected) {
          onDetected(parsed)
        }
      })
    }
  })
}

/**
 * Utilidad de prueba para simular la llegada de un pago movil (ej. desde Ajustes).
 * @param title Titulo de la notificacion
 * @param body Cuerpo de la notificacion
 * @param packageName Paquete del banco emisor
 * @returns Notificacion parseada o null si no califica
 */
export async function simulateBankNotification(
  title: string,
  body: string,
  packageName?: string
): Promise<ParsedBankNotification | null> {
  const parsed = parseBankNotification(title, body, packageName)
  if (parsed) {
    await enqueueBankNotification(parsed)
    return parsed
  }
  return null
}
