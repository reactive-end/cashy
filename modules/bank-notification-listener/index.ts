/**
 * Capa TypeScript para el modulo nativo bank-notification-listener.
 * En Expo Go o plataformas sin soporte nativo degrada de forma segura a no-op.
 */

import { requireOptionalNativeModule } from 'expo-modules-core'
import { Platform } from 'react-native'

/** Notificacion sin procesar recibida del modulo nativo */
export interface RawNativeBankNotification {
  title: string
  body: string
  packageName: string
  timestamp: number
}

/** Contrato de la suscripcion de evento */
export interface NativeEventSubscription {
  remove: () => void
}

/** Interfaz del modulo nativo implementado en Android Kotlin */
export interface BankNotificationListenerNativeModule {
  isPermissionGranted: () => boolean
  requestPermission: () => void
  getPendingNotifications: () => RawNativeBankNotification[]
  addListener?: (
    eventName: string,
    listener: (event: RawNativeBankNotification) => void
  ) => NativeEventSubscription
}

const NativeModuleInstance =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<BankNotificationListenerNativeModule>('BankNotificationListener')
    : null

/**
 * Consulta si el modulo nativo esta disponible en el entorno actual.
 * @returns true solo en compilaciones standalone Android con el servicio nativo
 */
export function isNotificationListenerAvailable(): boolean {
  return NativeModuleInstance !== null
}

/**
 * Consulta si el usuario ya concedio el acceso a notificaciones en Android.
 * @returns true si el paquete de Cashy esta autorizado
 */
export function isNotificationListenerPermissionGranted(): boolean {
  if (!NativeModuleInstance) return false
  try {
    return NativeModuleInstance.isPermissionGranted()
  } catch {
    return false
  }
}

/**
 * Abre la pantalla de configuracion de Android para conceder Acceso a Notificaciones.
 */
export function requestNotificationListenerPermission(): void {
  if (!NativeModuleInstance) return
  try {
    NativeModuleInstance.requestPermission()
  } catch {
    // Falla silenciosa
  }
}

/**
 * Recupera y vacia las notificaciones acumuladas en segundo plano por el servicio nativo.
 * @returns Lista de notificaciones sin procesar
 */
export function getNativePendingBankNotifications(): RawNativeBankNotification[] {
  if (!NativeModuleInstance) return []
  try {
    return NativeModuleInstance.getPendingNotifications() ?? []
  } catch {
    return []
  }
}

/**
 * Suscribe un callback a las notificaciones recibidas en tiempo real mientras la app esta activa.
 * @param callback Funcion a ejecutar con la notificacion recibida
 * @returns Desuscriptor del evento
 */
export function addBankNotificationListener(
  callback: (notification: RawNativeBankNotification) => void
): () => void {
  if (!NativeModuleInstance?.addListener) return () => {}

  const subscription = NativeModuleInstance.addListener('onBankNotificationReceived', callback)
  return () => {
    subscription.remove()
  }
}
