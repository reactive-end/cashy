/**
 * Background synchronization task that keeps notifications reliable
 * without opening the app. Runs on Android via WorkManager and
 * re-fetches rates, re-schedules the daily BCV notice and refreshes
 * fixed expense reminders after reboots, force stops or OEM kills.
 */

import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'

import { loadSettings } from '@src/db/settings'
import { notificationsAvailable, syncBcvNotice, syncReminders } from '@src/lib/notifications'
import { getExchangeRates } from '@src/services/rates'
import { loadRates } from '@src/services/rates-cache'
import type { ExchangeRates } from '@src/types/domain'

/** Nombre con el que WorkManager identifica la tarea de sincronizacion */
export const SYNC_TASK_NAME = 'cashy-background-sync'

/** Intervalo minimo deseado entre ejecuciones, en minutos (4 horas) */
const MINIMUM_INTERVAL_MINUTES = 240

/**
 * Orquesta una pasada completa de sincronizacion en background:
 * lee los ajustes, consulta tasas frescas a la red con repliegue al
 * cache local y reagenda ambos tipos de aviso segun su estado.
 * Exportada para poder probarse sin depender del disparo del sistema.
 */
export async function runSynchronization(): Promise<void> {
  const settings = await loadSettings()

  let rates: ExchangeRates | null = null
  try {
    rates = await getExchangeRates(true)
  } catch {
    try {
      rates = (await loadRates()) ?? null
    } catch {
      rates = null
    }
  }

  await syncBcvNotice(settings, rates ?? undefined)
  await syncReminders(settings)
}

TaskManager.defineTask(SYNC_TASK_NAME, async () => {
  try {
    await runSynchronization()

    return BackgroundTask.BackgroundTaskResult.Success
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed
  }
})

/**
 * Registra la tarea periodica en WorkManager si aun no lo esta.
 * No-op dentro de Expo Go, donde las notificaciones nativas no
 * estan disponibles. El registro persiste tras reiniciar el
 * dispositivo; WorkManager decide el momento exacto de ejecucion.
 */
export async function registerBackgroundTask(): Promise<void> {
  if (!notificationsAvailable()) return

  const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(SYNC_TASK_NAME)
  if (alreadyRegistered) return

  await BackgroundTask.registerTaskAsync(SYNC_TASK_NAME, {
    minimumInterval: MINIMUM_INTERVAL_MINUTES
  })
}
