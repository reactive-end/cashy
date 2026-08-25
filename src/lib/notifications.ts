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

/**
 * Consulta en silencio si el permiso de notificaciones esta concedido.
 * No muestra dialogos; para solicitarlo existe requestNotificationPermission.
 * @returns true solo con permiso concedido fuera de Expo Go
 */
export async function permisoNotificacionesConcedido(): Promise<boolean> {
  return permisoActual()
}

/**
 * Abre la pantalla de sistema "Alarmas y recordatorios" donde el
 * usuario concede el permiso de alarmas exactas, requerido desde
 * Android 12 para que los avisos lleguen a la hora programada.
 * No-op dentro de Expo Go.
 */
export async function abrirAjustesAlarmaExacta(): Promise<void> {
  if (!notificationsAvailable()) return

  const paquete = Constants.expoConfig?.android?.package

  await IntentLauncher.startActivityAsync(
    IntentLauncher.ActivityAction.REQUEST_SCHEDULE_EXACT_ALARM,
    paquete ? { data: `package:${paquete}` } : undefined
  )
}

/**
 * Consulta en silencio si el permiso de notificaciones esta concedido.
 * No muestra dialogos; para solicitarlo existe requestNotificationPermission.
 * @returns true solo con permiso concedido fuera de Expo Go
 */
async function permisoActual(): Promise<boolean> {
  const Notifications = obtenerModulo()
  if (!Notifications) return false

  const actuales = await Notifications.getPermissionsAsync()

  return actuales.granted
}

/** Prefijo de los identificadores de notificacion agendadas */
const REMINDER_PREFIX = 'reminder-'

/** Identificador estable del aviso diario de tasa BCV */
const IDENTIFICADOR_BCV_DIARIO = 'bcv-diario'

/** Identificadores legados de los avisos BCV fijos de 9 a.m. y 1 p.m. */
const IDENTIFICADORES_BCV_LEGADO: readonly string[] = ['bcv-9am', 'bcv-1pm']

/**
 * Construye el identificador estable de la notificacion de un gasto.
 * @param expenseId Identificador del gasto
 * @returns Identificador determinista reutilizable
 */
function reminderId(expenseId: string): string {
  return `${REMINDER_PREFIX}${expenseId}`
}

/**
 * Configura el manejador global de presentacion y el canal de
 * Android, y solicita el permiso de notificaciones en el primer
 * arranque (dialogo del sistema en Android 13+). El agendado de
 * avisos concretos lo resuelven syncReminders y sincronizarAvisosBcv
 * con los ajustes vigentes. Debe ejecutarse una sola vez al iniciar
 * la aplicacion. No-op silencioso dentro de Expo Go.
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

  await requestNotificationPermission()
}

/**
 * Sincroniza el aviso diario de tasa BCV segun los ajustes vigentes.
 * Cancela siempre los identificadores legados de los avisos fijos de
 * 9 a.m. y 1 p.m. y cualquier programacion previa del aviso unico.
 * Si el aviso esta activo y el permiso concedido, agenda el disparo
 * de calendario repetitivo a la hora configurada; el cuerpo muestra
 * los valores oficiales consultados o un texto de respaldo cuando no
 * hay tasas disponibles.
 * @param ajustes Preferencias del usuario con hora y estado del aviso
 * @param tasas Snapshot de tasas para el cuerpo del aviso (opcional)
 */
export async function sincronizarAvisosBcv(
  ajustes: AppSettings,
  tasas?: ExchangeRates
): Promise<void> {
  const Notifications = obtenerModulo()
  if (!Notifications) return

  await Promise.all([
    ...IDENTIFICADORES_BCV_LEGADO.map((identificador) =>
      Notifications.cancelScheduledNotificationAsync(identificador)
    ),
    Notifications.cancelScheduledNotificationAsync(IDENTIFICADOR_BCV_DIARIO)
  ])

  if (!ajustes.bcvEnabled) return
  if (!(await permisoActual())) return

  const cuerpo = tasas
    ? `USD ${formatNumber(tasas.bcvUsd)} · EUR ${formatNumber(tasas.bcvEur)}`
    : 'Consulta el valor oficial del dolar y el euro en Cashy.'

  await Notifications.scheduleNotificationAsync({
    identifier: IDENTIFICADOR_BCV_DIARIO,
    content: {
      title: 'Tasa BCV del dia',
      body: cuerpo
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: ajustes.bcvHour,
      minute: 0,
      repeats: true,
      channelId: Platform.OS === 'android' ? REMINDERS_CHANNEL : undefined
    }
  })
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
 * No-op dentro de Expo Go, sin recordatorios habilitados en ajustes o
 * cuando el gasto no califica.
 * @param expense Gasto fijo activo con proximo vencimiento definido
 * @param hour Hora del dia (0-23) en que debe llegar el aviso
 */
export async function scheduleReminder(expense: Expense, hour: number): Promise<void> {
  const Notifications = obtenerModulo()
  if (!Notifications) return
  if (expense.type !== 'fixed' || !expense.active || !expense.nextDueDate) return
  if (!(await loadSettings()).remindersEnabled) return

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
      )}`,
      data: { expenseId: expense.id }
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
 * Retira todos los recordatorios de gastos agendados.
 * Invocada al apagar los recordatorios desde Ajustes para que
 * no queden disparos pendientes. No-op dentro de Expo Go.
 */
export async function cancelarTodosRecordatorios(): Promise<void> {
  const Notifications = obtenerModulo()
  if (!Notifications) return

  const agendadas = await Notifications.getAllScheduledNotificationsAsync()

  await Promise.all(
    agendadas
      .map((notificacion) => notificacion.identifier)
      .filter((identificador) => identificador.startsWith(REMINDER_PREFIX))
      .map((identificador) => Notifications.cancelScheduledNotificationAsync(identificador))
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
 * @param ajustes Preferencias del usuario con hora y estado del aviso
 */
export async function syncReminders(ajustes: AppSettings): Promise<void> {
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

  if (!ajustes.remindersEnabled) return
  if (!(await permisoActual())) return

  const pendientes: Promise<void>[] = []

  for (const expense of expenses) {
    if (!(expense.type === 'fixed' && expense.active && expense.nextDueDate)) continue

    const vencimiento = vencimientosNuevos.get(expense.id) ?? expense.nextDueDate ?? ''

    pendientes.push(
      scheduleReminder({ ...expense, nextDueDate: vencimiento }, ajustes.reminderHour)
    )
  }

  await Promise.all(pendientes)
}
