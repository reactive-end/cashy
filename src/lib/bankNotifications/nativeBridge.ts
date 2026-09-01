/**
 * Puente entre el modulo nativo de escucha de notificaciones y la
 * logica de dominio de Cashy. Maneja permisos, drenado de la cola
 * persistida y suscripcion a eventos en tiempo real con repliegue
 * seguro en entornos sin modulo nativo.
 */

import {
  addBankNotificationListener,
  getNativePendingBankNotifications,
  isNotificationListenerAvailable,
  isNotificationListenerPermissionGranted,
  requestNotificationListenerPermission
} from '@modules/bank-notification-listener'

import { parsePaymentNotification } from './parser'
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
 * Abre los ajustes del sistema Android para que el usuario active
 * el acceso a notificaciones de Cashy.
 */
export function requestBankNotificationPermission(): void {
  requestNotificationListenerPermission()
}

/**
 * Drena las notificaciones acumuladas por el servicio nativo, las
 * parsea con el patron de pago movil y las encola en almacenamiento local.
 * @returns Arreglo de notificaciones parseadas y persistidas
 */
export async function drainNativeBankNotifications(): Promise<ParsedBankNotification[]> {
  const rawList = getNativePendingBankNotifications()
  const enqueued: ParsedBankNotification[] = []

  for (const raw of rawList) {
    const parsed = parsePaymentNotification(raw.title, raw.body)
    if (parsed) {
      const added = await enqueueBankNotification(parsed)
      if (added) enqueued.push(parsed)
    }
  }

  return enqueued
}

/**
 * Suscribe la aplicacion a notificaciones de pago movil interceptadas
 * en vivo mientras la app esta activa.
 * @param onDetected Callback ejecutado al detectar un pago movil valido
 * @returns Desuscriptor del evento
 */
export function subscribeToNativeBankNotifications(
  onDetected?: (notification: ParsedBankNotification) => void
): () => void {
  return addBankNotificationListener((raw) => {
    const parsed = parsePaymentNotification(raw.title, raw.body)
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
 * Simula la llegada de un pago movil para probar la deteccion
 * (por ejemplo desde la subpantalla de Ajustes).
 * @param title Titulo de la notificacion
 * @param body Cuerpo de la notificacion
 * @returns Notificacion parseada o null si no califica
 */
export async function simulateBankNotification(
  title: string,
  body: string
): Promise<ParsedBankNotification | null> {
  const parsed = parsePaymentNotification(title, body)
  if (parsed) {
    await enqueueBankNotification(parsed)
    return parsed
  }

  return null
}
