/**
 * Local notification pure functions for Android.
 * Schedule, cancel and sync fixed expense reminders using
 * deterministic identifiers derived from the expense id.
 * Incluye un aviso diario de tasa BCV con hora configurable
 * (identificador bcv-diario) cuyo cuerpo refleja la ultima
 * consulta de tasas disponible.
 *
 * En Expo Go el modulo expo-notificaciones lanza al importarse
 * (SDK 53+ retiro las notificaciones del cliente de desarrollo),
 * por lo que aqui se resuelve con require diferido y toda la
 * funcionalidad se degrada a no-op sin romper la aplicacion.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants'
import * as IntentLauncher from 'expo-intent-launcher'
import { Platform } from 'react-native'

import { REMINDERS_CHANNEL, COLORS } from '@src/constants/theme'
import { getExpenses, updateExpense } from '@src/db/expenses'
import { loadSettings } from '@src/db/settings'
import { formatAmount, formatDate, formatNumber } from '@src/lib/format'
import { advanceDueDate, fromISODate, toISODate } from '@src/lib/recurrences'
import type { AppSettings, ExchangeRates, Expense } from '@src/types/domain'

/** Forma del modulo expo-notifications usada por esta libreria */
type NotificationsModule = typeof import('expo-notifications')

/** Instancia resuelta una sola vez; null dentro de Expo Go */
let moduleInstance: NotificationsModule | null = null

/**
 * Detecta si la app corre dentro del cliente Expo Go.
 * @returns true cuando las notificaciones nativas no estan disponibles
 */
function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient
}

/**
 * Resuelve el modulo nativo de notificaciones bajo demanda.
 * @returns El modulo, o null en Expo Go (funcionalidad no disponible)
 */
function getNotificationsModule(): NotificationsModule | null {
  if (isExpoGo()) return null

  if (!moduleInstance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    moduleInstance = require('expo-notifications') as NotificationsModule
  }

  return moduleInstance
}

/**
 * Indica si el entorno actual puede agendar recordatorios.
 * Util para mostrar avisos en Ajustes cuando corre en Expo Go.
 * @returns true solo fuera de Expo Go
 */
export function notificationsAvailable(): boolean {
  return !isExpoGo()
}

/**
 * Consulta en silencio si el permiso de notificaciones esta concedido.
 * No muestra dialogos; para solicitarlo existe requestNotificationPermission.
 * @returns true solo con permiso concedido fuera de Expo Go
 */
export async function isNotificationPermissionGranted(): Promise<boolean> {
  return hasPermissionGranted()
}

/**
 * Abre la pantalla de sistema "Alarmas y recordatorios" donde el
 * usuario concede el permiso de alarmas exactas, requerido desde
 * Android 12 para que los avisos lleguen a la hora programada.
 * No-op dentro de Expo Go.
 */
export async function openExactAlarmSettings(): Promise<void> {
  if (!notificationsAvailable()) return

  const androidPackage = Constants.expoConfig?.android?.package

  await IntentLauncher.startActivityAsync(
    IntentLauncher.ActivityAction.REQUEST_SCHEDULE_EXACT_ALARM,
    androidPackage ? { data: `package:${androidPackage}` } : undefined
  )
}

/**
 * Consulta en silencio si el permiso de notificaciones esta concedido.
 * No muestra dialogos; para solicitarlo existe requestNotificationPermission.
 * @returns true solo con permiso concedido fuera de Expo Go
 */
async function hasPermissionGranted(): Promise<boolean> {
  const Notifications = getNotificationsModule()
  if (!Notifications) return false

  const currentPermissions = await Notifications.getPermissionsAsync()

  return currentPermissions.granted
}

/** Prefijo de los identificadores de notificacion agendadas */
const REMINDER_PREFIX = 'reminder-'

/** Identificador estable del aviso diario de tasa BCV */
const DAILY_BCV_NOTICE_ID = 'bcv-diario'

/** Identificadores legados de los avisos BCV fijos de 9 a.m. y 1 p.m. */
const LEGACY_BCV_NOTICE_IDS: readonly string[] = ['bcv-9am', 'bcv-1pm']

/**
 * Construye el identificador estable de la notificacion de un gasto.
 * @param expenseId Identificador del gasto
 * @returns Identificador determinista reutilizable
 */
function reminderId(expenseId: string): string {
  return `${REMINDER_PREFIX}${expenseId}`
}

/**
 * Limita un valor entero al rango permitido.
 * @param value Valor de entrada sin validar
 * @param max Tope superior (minuto 59 u hora 23)
 * @returns Entero dentro del rango 0..max
 */
function clamp(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.floor(value)))
}

/**
 * Calcula la siguiente ocurrencia de una hora del dia a partir de ahora.
 * Si la hora ya paso hoy, el disparo cae manana a la misma hora.
 * @param hour Hora del dia (0-23); se acota al rango valido
 * @param minute Minuto de la hora (0-59); se acota al rango valido
 * @param now Instante de referencia para el calculo
 * @returns Fecha concreta del proximo disparo, siempre futura
 */
export function nextTriggerDate(hour: number, minute: number, now = new Date()): Date {
  const fireDate = new Date(now)
  fireDate.setHours(clamp(hour, 23), clamp(minute, 59), 0, 0)

  if (fireDate.getTime() <= now.getTime()) {
    fireDate.setDate(fireDate.getDate() + 1)
  }

  return fireDate
}

/**
 * Configura el manejador global de presentacion y el canal de
 * Android, y solicita el permiso de notificaciones en el primer
 * arranque (dialogo del sistema en Android 13+). El agendado de
 * avisos concretos lo resuelven syncReminders y syncBcvNotice
 * con los ajustes vigentes. Debe ejecutarse una sola vez al iniciar
 * la aplicacion. No-op silencioso dentro de Expo Go.
 */
export async function setupNotifications(): Promise<void> {
  const Notifications = getNotificationsModule()
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

  await requestNotificationPermission()
}

/**
 * Sincroniza el aviso diario de tasa BCV segun los ajustes vigentes.
 * Cancela siempre los identificadores legados de los avisos fijos de
 * 9 a.m. y 1 p.m. y cualquier programacion previa del aviso unico.
 * Si el aviso esta activo y el permiso concedido, agenda un disparo
 * de fecha concreta hacia la proxima ocurrencia de la hora configurada
 * (mecanismo identico al de los recordatorios, fiable en Android);
 * el reagendado periodico corre en cada apertura y en la tarea en
 * background. El cuerpo muestra los valores oficiales consultados o
 * un texto de respaldo cuando no hay tasas disponibles.
 * @param settings Preferencias del usuario con hora y estado del aviso
 * @param rates Snapshot de tasas para el cuerpo del aviso (opcional)
 */
export async function syncBcvNotice(settings: AppSettings, rates?: ExchangeRates): Promise<void> {
  const Notifications = getNotificationsModule()
  if (!Notifications) return

  await Promise.all([
    ...LEGACY_BCV_NOTICE_IDS.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
    Notifications.cancelScheduledNotificationAsync(DAILY_BCV_NOTICE_ID)
  ])

  if (!settings.bcvEnabled) return
  if (!(await hasPermissionGranted())) return

  const body = rates
    ? `USD ${formatNumber(rates.bcvUsd)} · EUR ${formatNumber(rates.bcvEur)}`
    : 'Consulta el valor oficial del dolar y el euro en Cashy.'

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_BCV_NOTICE_ID,
    content: {
      title: 'Tasa BCV del dia',
      body
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextTriggerDate(settings.bcvHour, settings.bcvMinute),
      channelId: Platform.OS === 'android' ? REMINDERS_CHANNEL : undefined
    }
  })
}

/** Estado del aviso diario BCV consultable desde Ajustes */
export interface BcvNoticeStatus {
  /** true cuando existe una programacion vigente en el sistema */
  scheduled: boolean
  /** Instante del proximo disparo; null si no se pudo leer */
  nextTrigger: Date | null
}

/** Forma parcial del trigger devuelto para disparos de fecha concreta */
interface DateTrigger {
  date?: string | number | Date
}

/**
 * Extrae la fecha de un trigger de notificacion sin confiar en su tipo.
 * @param trigger Objeto crudo recibido del sistema
 * @returns Fecha valida o null cuando no puede interpretarse
 */
function extractTriggerDate(trigger: object): Date | null {
  if (!('date' in trigger)) return null

  const dateValue = (trigger as DateTrigger).date
  if (dateValue instanceof Date) return Number.isNaN(dateValue.getTime()) ? null : dateValue

  const parsed = new Date(dateValue as string | number)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Consulta si el aviso diario BCV queda realmente agendado en el
 * sistema y cuando ocurrira su proximo disparo. Util para la tarjeta
 * de diagnostico de Ajustes sin esperar a que la notificacion llegue.
 * No-op dentro de Expo Go.
 * @returns Estado con bandera de agendado e instante del disparo
 */
export async function getBcvNoticeStatus(): Promise<BcvNoticeStatus> {
  const Notifications = getNotificationsModule()
  if (!Notifications) return { scheduled: false, nextTrigger: null }

  const scheduledNotices = await Notifications.getAllScheduledNotificationsAsync()
  const notice = scheduledNotices.find(
    (notification) => notification.identifier === DAILY_BCV_NOTICE_ID
  )

  if (!notice) return { scheduled: false, nextTrigger: null }

  const trigger = notice.trigger

  return {
    scheduled: true,
    nextTrigger: trigger && typeof trigger === 'object' ? extractTriggerDate(trigger) : null
  }
}

/**
 * Consulta y solicita el permiso de notificaciones si hace falta.
 * Dentro de Expo Go devuelve false sin tocar APIs nativas.
 * @returns true solo si el permiso queda concedido
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = getNotificationsModule()
  if (!Notifications) return false

  const currentPermissions = await Notifications.getPermissionsAsync()

  if (currentPermissions.granted) return true
  if (!currentPermissions.canAskAgain) return false

  const requested = await Notifications.requestPermissionsAsync()

  return requested.granted
}

/**
 * Agenda el recordatorio un dia antes del vencimiento del gasto fijo.
 * Cancela cualquier recordatorio previo del mismo gasto para no duplicar.
 * No-op dentro de Expo Go, sin recordatorios habilitados en ajustes o
 * cuando el gasto no califica.
 * @param expense Gasto fijo activo con proximo vencimiento definido
 * @param hour Hora del dia (0-23) en que debe llegar el aviso
 * @param minute Minuto de la hora (0-59) en que debe llegar el aviso
 */
export async function scheduleReminder(expense: Expense, hour: number, minute = 0): Promise<void> {
  const Notifications = getNotificationsModule()
  if (!Notifications) return
  if (expense.type !== 'fixed' || !expense.active || !expense.nextDueDate) return
  if (!(await loadSettings()).remindersEnabled) return

  const fireDate = fromISODate(expense.nextDueDate)
  fireDate.setDate(fireDate.getDate() - 1)
  fireDate.setHours(clamp(hour, 23), clamp(minute, 59), 0, 0)

  if (fireDate.getTime() <= Date.now()) return

  await cancelReminder(expense.id)

  await Notifications.scheduleNotificationAsync({
    identifier: reminderId(expense.id),
    content: {
      title: `Recordatorio: ${expense.name}`,
      body: `Vence mañana ${formatDate(expense.nextDueDate)} · ${formatAmount(
        expense.amount,
        expense.currency
      )}`,
      data: { expenseId: expense.id }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
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
  const Notifications = getNotificationsModule()
  if (!Notifications) return

  await Notifications.cancelScheduledNotificationAsync(reminderId(expenseId))
}

/**
 * Retira todos los recordatorios de gastos agendados.
 * Invocada al apagar los recordatorios desde Ajustes para que
 * no queden disparos pendientes. No-op dentro de Expo Go.
 */
export async function cancelAllReminders(): Promise<void> {
  const Notifications = getNotificationsModule()
  if (!Notifications) return

  const scheduledNotices = await Notifications.getAllScheduledNotificationsAsync()

  await Promise.all(
    scheduledNotices
      .map((notification) => notification.identifier)
      .filter((id) => id.startsWith(REMINDER_PREFIX))
      .map((id) => Notifications.cancelScheduledNotificationAsync(id))
  )
}

/**
 * Sincroniza vencimientos y recordatorios de todos los gastos fijos.
 * Fase 1: avanza y persiste en lote los vencimientos vencidos.
 * Fase 2: reagenda en paralelo cada aviso vigente cuando los
 * recordatorios estan habilitados.
 * Ejecutar al abrir la aplicacion y desde la tarea en background.
 * La actualizacion de vencimientos tambien corre en Expo Go; solo
 * el aviso nativo queda omitido.
 * @param settings Preferencias del usuario con hora y estado del aviso
 */
export async function syncReminders(settings: AppSettings): Promise<void> {
  const expenses = await getExpenses()
  const todayISO = toISODate(new Date())

  const newDueDates = new Map<string, string>()

  for (const expense of expenses) {
    if (expense.type !== 'fixed' || !expense.active || !expense.recurrence) continue

    let dueDate = expense.nextDueDate
    if (!dueDate) continue

    let changed = false
    while (dueDate < todayISO) {
      dueDate = toISODate(advanceDueDate(fromISODate(dueDate), expense.recurrence))
      changed = true
    }

    if (changed) newDueDates.set(expense.id, dueDate)
  }

  await Promise.all(
    [...newDueDates].map(([id, dueDate]) => updateExpense(id, { nextDueDate: dueDate }))
  )

  if (!settings.remindersEnabled) return
  if (!(await hasPermissionGranted())) return

  const pendingSchedules: Promise<void>[] = []

  for (const expense of expenses) {
    if (!(expense.type === 'fixed' && expense.active && expense.nextDueDate)) continue

    const dueDate = newDueDates.get(expense.id) ?? expense.nextDueDate ?? ''

    pendingSchedules.push(
      scheduleReminder(
        { ...expense, nextDueDate: dueDate },
        settings.reminderHour,
        settings.reminderMinute
      )
    )
  }

  await Promise.all(pendingSchedules)
}
