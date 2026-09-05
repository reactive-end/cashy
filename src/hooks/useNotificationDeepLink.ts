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
type NotificationsModule = typeof import('expo-notifications')

/**
 * Extrae el identificador del gasto de los datos de la respuesta y
 * navega a su pantalla de detalle cuando existe.
 * @param response Respuesta de interaccion con la notificacion
 */
function navigateToExpense(response: NotificationResponse): void {
  const expenseId = response.notification.request.content.data?.expenseId

  if (typeof expenseId !== 'string') return

  router.navigate({ pathname: '/expense/[id]', params: { id: expenseId } })
}

/**
 * Observa respuestas a notificaciones y abre el gasto correspondiente.
 * Cubre tanto el arranque desde una notificacion (respuesta inicial)
 * como las interacciones con la app ya en ejecucion.
 * @param enabled Cuando es false el hook no navega (gate del onboarding)
 */
export function useNotificationDeepLink(enabled = true): void {
  useEffect(() => {
    if (!enabled || !notificationsAvailable()) return

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications') as NotificationsModule

    const navigate = (response: NotificationResponse): void => navigateToExpense(response)

    const initialResponse = Notifications.getLastNotificationResponse()

    if (initialResponse) navigate(initialResponse)

    const subscription = Notifications.addNotificationResponseReceivedListener(navigate)

    return () => {
      subscription.remove()
    }
  }, [enabled])
}
