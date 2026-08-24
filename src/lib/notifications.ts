/**
 * Local notification pure functions for Android.
 * Schedule, cancel and sync fixed expense reminders using
 * deterministic identifiers derived from the expense id.
 * Incluye recordatorios diarios de tasa BCV a las 9 a.m. y 1 p.m.
 *
 * En Expo Go el modulo expo-notificaciones lanza al importarse
 * (SDK 53+ retiro las notificaciones del cliente de desarrollo),
 * por lo que aqui se resuelve con require diferido y toda la
 * funcionalidad se degrada a no-op sin romper la aplicacion.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants'
import { Platform } from 'react-native'

import { REMINDERS_CHANNEL, COLORS } from '@src/constants/theme'
import { getExpenses, updateExpense } from '@src/db/expenses'
import { formatDate, formatAmount } from '@src/lib/format'
import { advanceDueDate, fromISODate, toISODate } from '@src/lib/recurrences'
import type { Expense } from '@src/types/domain'

/** Forma del modulo expo-notifications usada por esta libreria */
type ModuloNotifications = typeof import('expo-notifications')

/** Instancia resuelta una sola vez; null dentro de Expo Go */
let instancia: ModuloNotifications | null = null

/**
 * Detecta si la app corre dentro del cliente Expo Go.
 * @returns true cuando las notificaciones nativas no estan disponibles
 */
function enExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient
}

/**
 * Resuelve el modulo nativo de notificaciones bajo demanda.
 * @returns El modulo, o null en Expo Go (funcionalidad no disponible)
 */
function obtenerModulo(): ModuloNotifications | null {
  if (enExpoGo()) return null

  if (!instancia) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    instancia = require('expo-notifications') as ModuloNotifications
  }

  return instancia
}

/**
 * Indica si el entorno actual puede agendar recordatorios.
 * Util para mostrar avisos en Ajustes cuando corre en Expo Go.
 * @returns true solo fuera de Expo Go
 */
export function notificationsAvailable(): boolean {
  return !enExpoGo()
}

/** Prefijo de los identificadores de notificacion agendadas */
const REMINDER_PREFIX = 'reminder-'

/** Recordatorios diarios de tasa BCV: hora y sufijo identificador */
const RECORDATORIOS_BCV: readonly { hora: number; sufijo: string }[] = [
  { hora: 9, sufijo: '9am' },
  { hora: 13, sufijo: '1pm' }
]

/**
 * Construye el identificador estable de la notificacion de un gasto.
 * @param expenseId Identificador del gasto
 * @returns Identificador determinista reutilizable
 */
function reminderId(expenseId: string): string {
  return `${REMINDER_PREFIX}${expenseId}`
}

/**
 * Configura el manejador global de presentacion, el canal de Android
 * y los recordatorios diarios de tasa BCV (9 a.m. y 1 p.m.).
 * Debe ejecutarse una sola vez al iniciar la aplicacion.
 * No-op silencioso dentro de Expo Go.
 */
export async function setupNotifications(): Promise<void> {
  const Notifications = obtenerModulo()
  if (!Notifications) return

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false
    })
  })

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL, {
      name: 'Recordatorios de pagos',
      description: 'Avisos un dia antes del vencimiento de tus gastos fijos',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: COLORS.accent
    })
  }

  await programarRecordatoriosBcv()
}

/**
 * Agenda los recordatorios diarios de tasa BCV con disparadores de
 * calendario repetitivos. Cancela en lote los avisos previos antes
 * de reagendar para evitar duplicados.
 */
async function programarRecordatoriosBcv(): Promise<void> {
  const Notifications = obtenerModulo()
  if (!Notifications) return

  await Promise.all(
    RECORDATORIOS_BCV.map((recordatorio) =>
      Notifications.cancelScheduledNotificationAsync(`bcv-${recordatorio.sufijo}`)
    )
  )

  await Promise.all(
    RECORDATORIOS_BCV.map((recordatorio) =>
      Notifications.scheduleNotificationAsync({
        identifier: `bcv-${recordatorio.sufijo}`,
        content: {
          title: 'Tasas BCV del dia',
          body: 'Consulta el valor oficial del dolar y el euro en Cashy.'
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: recordatorio.hora,
          minute: 0,
          repeats: true,
          channelId: Platform.OS === 'android' ? REMINDERS_CHANNEL : undefined
        }
      })
    )
  )
}

/**
 * Consulta y solicita el permiso de notificaciones si hace falta.
 * Dentro de Expo Go devuelve false sin tocar APIs nativas.
 * @returns true solo si el permiso queda concedido
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = obtenerModulo()
  if (!Notifications) return false

  const actuales = await Notifications.getPermissionsAsync()

  if (actuales.granted) return true
  if (!actuales.canAskAgain) return false

  const pedidas = await Notifications.requestPermissionsAsync()
  return pedidas.granted
}

/**
 * Agenda el recordatorio un dia antes del vencimiento del gasto fijo.
 * Cancela cualquier recordatorio previo del mismo gasto para no duplicar.
 * No-op dentro de Expo Go.
 * @param expense Gasto fijo activo con proximo vencimiento definido
 * @param hour Hora del dia (0-23) en que debe llegar el aviso
 */
export async function scheduleReminder(expense: Expense, hour: number): Promise<void> {
  const Notifications = obtenerModulo()
  if (!Notifications) return
  if (expense.type !== 'fixed' || !expense.active || !expense.nextDueDate) return

  const disparo = fromISODate(expense.nextDueDate)
  disparo.setDate(disparo.getDate() - 1)
  disparo.setHours(Math.min(23, Math.max(0, hour)), 0, 0, 0)

  if (disparo.getTime() <= Date.now()) return

  await cancelReminder(expense.id)

  await Notifications.scheduleNotificationAsync({
    identifier: reminderId(expense.id),
    content: {
      title: `Recordatorio: ${expense.name}`,
      body: `Vence mañana ${formatDate(expense.nextDueDate)} · ${formatAmount(
        expense.amount,
        expense.currency
      )}`
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: disparo,
      channelId: Platform.OS === 'android' ? REMINDERS_CHANNEL : undefined
    }
  })
}

/**
 * Cancela la notificacion agendada de un gasto concreto.
 * No-op dentro de Expo Go.
 * @param expenseId Identificador del gasto cuyo aviso se retira
 */
export async function cancelReminder(expenseId: string): Promise<void> {
  const Notifications = obtenerModulo()
  if (!Notifications) return

  await Notifications.cancelScheduledNotificationAsync(reminderId(expenseId))
}

/**
 * Sincroniza vencimientos y recordatorios de todos los gastos fijos.
 * Fase 1: avanza y persiste en lote los vencimientos vencidos.
 * Fase 2: reagenda en paralelo cada aviso vigente.
 * Ejecutar al abrir la aplicacion. La actualizacion de vencimientos
 * tambien corre en Expo Go; solo el aviso nativo queda omitido.
 * @param reminderHour Hora configurada para los avisos
 */
export async function syncReminders(reminderHour: number): Promise<void> {
  const expenses = await getExpenses()
  const hoyISO = toISODate(new Date())

  const vencimientosNuevos = new Map<string, string>()

  for (const expense of expenses) {
    if (expense.type !== 'fixed' || !expense.active || !expense.recurrence) continue

    let vencimiento = expense.nextDueDate
    if (!vencimiento) continue

    let cambio = false
    while (vencimiento < hoyISO) {
      vencimiento = toISODate(advanceDueDate(fromISODate(vencimiento), expense.recurrence))
      cambio = true
    }

    if (cambio) vencimientosNuevos.set(expense.id, vencimiento)
  }

  await Promise.all(
    [...vencimientosNuevos].map(([id, vencimiento]) =>
      updateExpense(id, { nextDueDate: vencimiento })
    )
  )

  await Promise.all(
    expenses
      .filter((expense) => expense.type === 'fixed' && expense.active && expense.nextDueDate)
      .map((expense) => {
        const vencimiento = vencimientosNuevos.get(expense.id) ?? expense.nextDueDate ?? ''
        return scheduleReminder({ ...expense, nextDueDate: vencimiento }, reminderHour)
      })
  )
}
