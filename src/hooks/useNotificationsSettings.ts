/**
 * Hook useNotificationsSettings: coordina permisos de notificaciones del sistema operativo,
 * estado de avisos de tasa BCV y ajustes de hora y encendido de recordatorios.
 */

import { useCallback, useEffect, useState } from 'react'
import { AppState, Platform } from 'react-native'

import { useSettings } from '@src/hooks/useSettings'
import {
  getBcvNoticeStatus,
  isNotificationPermissionGranted,
  notificationsAvailable,
  openExactAlarmSettings,
  type BcvNoticeStatus
} from '@src/lib/notifications'

/** Version minima de Android que exige conceder alarmas exactas */
const ANDROID_EXACT_ALARM_VERSION = 31

export interface UseNotificationsSettingsResult {
  permissionGranted: boolean
  bcvStatus: BcvNoticeStatus | null
  remindersActive: boolean
  bcvActive: boolean
  reminderHour: number
  reminderMinute: number
  bcvHour: number
  bcvMinute: number
  isExpoGo: boolean
  requiresExactAlarm: boolean
  handleToggleReminders: (enabled: boolean) => Promise<void>
  handleToggleBcv: (enabled: boolean) => Promise<void>
  handleChangeReminderTime: (hour: number, minute: number) => Promise<void>
  handleChangeBcvTime: (hour: number, minute: number) => Promise<void>
  openAlarmSettings: () => Promise<void>
}

/**
 * Hook para la subpantalla de Notificaciones y Recordatorios.
 * @returns Estado de permisos, estado de triggers y mutadores de configuracion
 */
export function useNotificationsSettings(): UseNotificationsSettingsResult {
  const { settings, changeReminderTime, changeBcvTime, setRemindersEnabled, setBcvEnabled } =
    useSettings()

  const [permissionGranted, setPermissionGranted] = useState(false)
  const [bcvStatus, setBcvStatus] = useState<BcvNoticeStatus | null>(null)

  const remindersActive = settings?.remindersEnabled ?? false
  const bcvActive = settings?.bcvEnabled ?? false

  useEffect(() => {
    let active = true

    async function check(): Promise<void> {
      const granted = await isNotificationPermissionGranted()
      const status = await getBcvNoticeStatus()
      if (active) {
        setPermissionGranted(granted)
        setBcvStatus(status)
      }
    }

    void check()
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void check()
    })

    return () => {
      active = false
      sub.remove()
    }
  }, [])

  const handleToggleReminders = useCallback(
    async (enabled: boolean) => {
      await setRemindersEnabled(enabled)
    },
    [setRemindersEnabled]
  )

  const handleToggleBcv = useCallback(
    async (enabled: boolean) => {
      await setBcvEnabled(enabled)
    },
    [setBcvEnabled]
  )

  const handleChangeReminderTime = useCallback(
    async (hour: number, minute: number) => {
      await changeReminderTime(hour, minute)
    },
    [changeReminderTime]
  )

  const handleChangeBcvTime = useCallback(
    async (hour: number, minute: number) => {
      await changeBcvTime(hour, minute)
    },
    [changeBcvTime]
  )

  const isExpoGo = !notificationsAvailable()
  const requiresAlarm =
    Platform.OS === 'android' && Number(Platform.Version) >= ANDROID_EXACT_ALARM_VERSION

  return {
    permissionGranted,
    bcvStatus,
    remindersActive,
    bcvActive,
    reminderHour: settings?.reminderHour ?? 9,
    reminderMinute: settings?.reminderMinute ?? 0,
    bcvHour: settings?.bcvHour ?? 9,
    bcvMinute: settings?.bcvMinute ?? 0,
    isExpoGo,
    requiresExactAlarm: requiresAlarm,
    handleToggleReminders,
    handleToggleBcv,
    handleChangeReminderTime,
    handleChangeBcvTime,
    openAlarmSettings: openExactAlarmSettings
  }
}
