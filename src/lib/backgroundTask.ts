/**
 * Background synchronization task that keeps notifications reliable
 * without opening the app. Runs on Android via WorkManager and
 * re-fetches rates, re-schedules the daily BCV notice and refreshes
 * fixed expense reminders after reboots, force stops or OEM kills.
 */

import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'

import { loadSettings } from '@src/db/settings'
import { notificationsAvailable, sincronizarAvisosBcv, syncReminders } from '@src/lib/notifications'
import { getExchangeRates } from '@src/services/rates'
import { loadRates } from '@src/services/rates-cache'
import type { ExchangeRates } from '@src/types/domain'

/** Nombre con el que WorkManager identifica la tarea de sincronizacion */
export const NOMBRE_TAREA_SINCRONIZACION = 'cashy-background-sync'

/** Intervalo minimo deseado entre ejecuciones, en minutos (4 horas) */
const INTERVALO_MINIMO_MINUTOS = 240

/**
 * Orquesta una pasada completa de sincronizacion en background:
 * lee los ajustes, consulta tasas frescas a la red con repliegue al
 * cache local y reagenda ambos tipos de aviso segun su estado.
 * Exportada para poder probarse sin depender del disparo del sistema.
 */
export async function ejecutarSincronizacion(): Promise<void> {
  const ajustes = await loadSettings()

  let tasas: ExchangeRates | null = null
  try {
    tasas = await getExchangeRates(true)
  } catch {
    try {
      tasas = (await loadRates()) ?? null
    } catch {
      tasas = null
    }
  }

  await sincronizarAvisosBcv(ajustes, tasas ?? undefined)
  await syncReminders(ajustes)
}

TaskManager.defineTask(NOMBRE_TAREA_SINCRONIZACION, async () => {
  try {
    await ejecutarSincronizacion()
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
export async function registrarTareaBackground(): Promise<void> {
  if (!notificationsAvailable()) return

  const yaRegistrada = await TaskManager.isTaskRegisteredAsync(NOMBRE_TAREA_SINCRONIZACION)
  if (yaRegistrada) return

  await BackgroundTask.registerTaskAsync(NOMBRE_TAREA_SINCRONIZACION, {
    minimumInterval: INTERVALO_MINIMO_MINUTOS
  })
}
