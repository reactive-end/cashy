/**
 * Subpantalla de Ajustes: Notificaciones y Recordatorios.
 * Configura recordatorios de gastos fijos, aviso diario de tasa BCV y permisos de sistema.
 */

import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { AppState, Platform, Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Switch } from '@src/components/atoms/Switch'
import { Typography } from '@src/components/atoms/Typography'
import { TimePicker } from '@src/components/organisms/TimePicker'
import { useSettings } from '@src/hooks/useSettings'
import { nextNoticeLabel } from '@src/lib/format'
import {
  getBcvNoticeStatus,
  isNotificationPermissionGranted,
  notificationsAvailable,
  openExactAlarmSettings,
  type BcvNoticeStatus
} from '@src/lib/notifications'

/** Version minima de Android que exige conceder alarmas exactas */
const ANDROID_EXACT_ALARM_VERSION = 31

function requiresExactAlarm(): boolean {
  return Platform.OS === 'android' && Number(Platform.Version) >= ANDROID_EXACT_ALARM_VERSION
}

export default function NotificationsSettings() {
  const router = useRouter()
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

  return (
    <Screen scrollable>
      <View className="gap-6 pt-6 pb-12">
        {/* Cabecera con boton volver y titulo */}
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a Ajustes"
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
          >
            <Icon name="back" size={20} color="#1C1C1A" />
          </Pressable>
          <Typography variant="display">Notificaciones</Typography>
        </View>

        {/* Estado de permisos */}
        {!notificationsAvailable() ? (
          <Card className="gap-2 border-warn bg-warn-soft">
            <Typography variant="caption" className="text-warn">
              Estás usando Expo Go: los recordatorios del sistema están desactivados en este
              cliente. Para recibir alarmas exactas compila una versión nativa (npx expo run:android
              o APK).
            </Typography>
          </Card>
        ) : (
          <Card className="gap-3">
            <Typography variant="label">Estado de permisos del sistema</Typography>
            <Typography variant="caption">
              {permissionGranted
                ? 'Permiso de notificaciones concedido en el sistema operativo.'
                : 'Permiso de notificaciones sin conceder: los avisos no podrán mostrarse en la barra superior.'}
            </Typography>
            {requiresExactAlarm() ? (
              <Button
                label="Permitir alarmas exactas"
                variant="secondary"
                icon="bell"
                fullWidth
                onPress={() => void openExactAlarmSettings()}
              />
            ) : null}
          </Card>
        )}

        {/* Recordatorios de pagos */}
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Typography variant="label">Recordatorios de pagos</Typography>
            <Switch
              value={remindersActive}
              onValueChange={(enabled) => void setRemindersEnabled(enabled)}
              accessibilityLabel="Activar recordatorios de pagos"
            />
          </View>
          <Typography variant="caption">
            Llegan un día antes de cada fecha límite de tus gastos fijos recurrentes.
          </Typography>
          <TimePicker
            hour={settings?.reminderHour ?? 9}
            minute={settings?.reminderMinute ?? 0}
            onChange={(hour, minute) => void changeReminderTime(hour, minute)}
            disabled={!remindersActive}
            accessibilityLabel="Hora de los recordatorios de pagos"
          />
        </Card>

        {/* Tasa BCV diaria */}
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Typography variant="label">Aviso de tasa BCV diaria</Typography>
            <Switch
              value={bcvActive}
              onValueChange={(enabled) => void setBcvEnabled(enabled)}
              accessibilityLabel="Activar la tasa BCV diaria"
            />
          </View>
          <Typography variant="caption">
            Aviso diario con las cotizaciones oficiales de dólar y euro consultadas en tiempo real.
          </Typography>
          <TimePicker
            hour={settings?.bcvHour ?? 9}
            minute={settings?.bcvMinute ?? 0}
            onChange={(hour, minute) => void changeBcvTime(hour, minute)}
            disabled={!bcvActive}
            accessibilityLabel="Hora del aviso de tasa BCV"
          />
          {bcvStatus?.scheduled ? (
            <Typography variant="caption" className="text-faint">
              {bcvStatus.nextTrigger
                ? `Próximo aviso programado: ${nextNoticeLabel(bcvStatus.nextTrigger)}`
                : 'El aviso se encuentra agendado en el sistema.'}
            </Typography>
          ) : bcvActive && bcvStatus !== null ? (
            <Typography variant="caption" className="text-warn">
              El aviso no quedó agendado. Concede los permisos de notificación y vuelve a abrir la
              app.
            </Typography>
          ) : null}
        </Card>
      </View>
    </Screen>
  )
}
