/**
 * Hook useNotificationDeepLink: navega al detalle del gasto cuando
 * el usuario toca una notificacion de recordatorio. Resuelve el
 * modulo expo-notificaciones con require diferido para no romper
 * Expo Go, donde toda la funcionalidad queda desactivada.
 */

import type { NotificationResponse } from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect } from 'react'

import { notificationsAvailable } from '@src/lib/notifications'

/** Forma del modulo expo-notificaciones usada por este hook */
type ModuloNotifications = typeof import('expo-notifications')

/**
 * Extrae el identificador del gasto de los datos de la respuesta y
 * navega a su pantalla de detalle cuando existe.
 * @param respuesta Respuesta de interaccion con la notificacion
 */
function navegarAlGasto(respuesta: NotificationResponse): void {
  const expenseId = respuesta.notification.request.content.data?.expenseId

  if (typeof expenseId !== 'string') return

  router.push({ pathname: '/expense/[id]', params: { id: expenseId } })
}

/**
 * Observa respuestas a notificaciones y abre el gasto correspondiente.
 * Cubre tanto el arranque desde una notificacion (respuesta inicial)
 * como las interacciones con la app ya en ejecucion.
 */
export function useNotificationDeepLink(): void {
  useEffect(() => {
    if (!notificationsAvailable()) return

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications') as ModuloNotifications

    const respuestaInicial = Notifications.getLastNotificationResponse()

    if (respuestaInicial) navegarAlGasto(respuestaInicial)

    const suscripcion = Notifications.addNotificationResponseReceivedListener(navegarAlGasto)

    return () => {
      suscripcion.remove()
    }
  }, [])
}
