/**
 * Settings screen: user preferences.
 * Base currency for summaries plus per-notification controls:
 * payment reminders and daily BCV rate notice, each with its own
 * switch and hour picker, and a diagnostics card for permissions.
 */

import { useRouter } from 'expo-router'
import * as Updates from 'expo-updates'
import { useEffect, useState } from 'react'
import { AppState, Platform, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Screen } from '@src/components/atoms/Screen'
import { Switch } from '@src/components/atoms/Switch'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog, type AlertDialogTone } from '@src/components/molecules/AlertDialog'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { TimePicker } from '@src/components/organisms/TimePicker'
import { getProfile } from '@src/db/profile'
import { useSettings } from '@src/hooks/useSettings'
import { authenticateWithBiometrics, isBiometricsAvailable } from '@src/lib/biometrics'
import { subscribe } from '@src/lib/events'
import { nextNoticeLabel } from '@src/lib/format'
import {
  openExactAlarmSettings,
  getBcvNoticeStatus,
  notificationsAvailable,
  isNotificationPermissionGranted,
  type BcvNoticeStatus
} from '@src/lib/notifications'
import { installedVersion } from '@src/services/appUpdate'
import { BASE_CURRENCIES, type BaseCurrency } from '@src/types/domain'

/** Opciones de moneda base para el control segmentado */
const CURRENCY_OPTIONS = BASE_CURRENCIES.map((currency) => ({ value: currency, label: currency }))

/** Version minima de Android que exige conceder alarmas exactas */
const ANDROID_EXACT_ALARM_VERSION = 31

/**
 * Determina si el dispositivo requiere la concesion manual de
 * alarmas exactas (Android 12 o superior).
 * @returns true cuando aplica mostrar el acceso directo de sistema
 */
function requiresExactAlarm(): boolean {
  return Platform.OS === 'android' && Number(Platform.Version) >= ANDROID_EXACT_ALARM_VERSION
}

/**
 * Pestaña de configuracion con moneda base, avisos por tipo de
 * notificacion, estado de permisos y actualizaciones.
 * @returns Pantalla de ajustes minimalista
 */
export default function Settings() {
  const router = useRouter()
  const {
    settings,
    changeBaseCurrency,
    changeReminderTime,
    changeBcvTime,
    setRemindersEnabled,
    setBcvEnabled,
    setBiometricsEnabled
  } = useSettings()

  const [permissionGranted, setPermissionGranted] = useState(false)
  const [bcvStatus, setBcvStatus] = useState<BcvNoticeStatus | null>(null)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [biometricsSupported, setBiometricsSupported] = useState(false)
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState<{ tone: AlertDialogTone; message: string } | null>(null)

  useEffect(() => {
    void isBiometricsAvailable().then(setBiometricsSupported)
  }, [])

  /** Activa o desactiva la proteccion biometrica previa autenticacion */
  async function handleToggleBiometrics(enabled: boolean): Promise<void> {
    const ok = await authenticateWithBiometrics(
      enabled
        ? 'Confirma tu identidad para activar el bloqueo biometrico'
        : 'Confirma tu identidad para desactivar el bloqueo biometrico'
    )
    if (ok) {
      await setBiometricsEnabled(enabled)
    } else {
      setNotice({
        tone: 'danger',
        message: 'No se pudo verificar la identidad.'
      })
    }
  }

  /** Busca una actualizacion de JS via EAS Update y la deja lista */
  async function checkForUpdates(): Promise<void> {
    if (!Updates.isEnabled) {
      setNotice({
        tone: 'danger',
        message: 'Las actualizaciones no estan disponibles en este entorno.'
      })
      return
    }

    setChecking(true)

    try {
      const check = await Updates.checkForUpdateAsync()

      if (!check.isAvailable) {
        setNotice({ tone: 'success', message: 'Ya tienes la ultima version instalada.' })
        return
      }

      await Updates.fetchUpdateAsync()
      setNotice({
        tone: 'success',
        message: 'Actualizacion descargada. Se aplicara al reiniciar la aplicacion.'
      })
    } catch {
      setNotice({
        tone: 'danger',
        message: 'No se pudo verificar actualizaciones. Revisa tu conexion.'
      })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (!notificationsAvailable()) return

    const refreshPermissions = (): void => {
      void isNotificationPermissionGranted().then(setPermissionGranted)
      void getBcvNoticeStatus().then(setBcvStatus)
    }

    refreshPermissions()

    const subscription = AppState.addEventListener('change', refreshPermissions)

    return () => subscription.remove()
  }, [])

  // Resumen de identidad para la tarjeta "Tus datos".
  useEffect(() => {
    let active = true

    getProfile()
      .then((savedProfile) => {
        if (!active) return
        setProfileName(savedProfile ? `${savedProfile.firstName} ${savedProfile.lastName}` : null)
      })
      .catch(() => {
        if (active) setProfileName(null)
      })

    const unsubscribe = subscribe('profile-changed', () => {
      void getProfile().then((savedProfile) => {
        setProfileName(savedProfile ? `${savedProfile.firstName} ${savedProfile.lastName}` : null)
      })
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const remindersActive = settings?.remindersEnabled ?? true
  const bcvActive = settings?.bcvEnabled ?? true
  const biometricsActive = settings?.biometricsEnabled ?? false

  return (
    <Screen scrollable>
      <View className="gap-5 pt-6">
        <Typography variant="display">Ajustes</Typography>

        <Card className="gap-3">
          <Typography variant="label">Moneda base</Typography>
          <Typography variant="caption">
            Los resumenes convierten todos tus gastos a esta moneda usando las tasas del dia.
          </Typography>
          <SegmentedControl
            options={CURRENCY_OPTIONS}
            value={(settings?.baseCurrency ?? 'USD') as BaseCurrency}
            onChange={(currency) => void changeBaseCurrency(currency)}
          />
        </Card>

        <Card className="gap-2">
          <Typography variant="label">Tus datos</Typography>
          <Typography variant="caption">
            {profileName
              ? `Hola, ${profileName}. Actualiza tu identidad e ingresos cuando quieras.`
              : 'Completa tu perfil para personalizar Cashy.'}
          </Typography>
          <Button
            label="Editar mis datos"
            variant="secondary"
            icon="edit"
            fullWidth
            onPress={() => router.push('/edit-profile')}
          />
        </Card>

        <Card className="gap-3">
          <Typography variant="label">Seguridad y privacidad</Typography>
          <Typography variant="caption">
            Protege tus datos financieros requiriendo autenticacion biometrica.
          </Typography>

          <View className="flex-row items-center justify-between pt-1">
            <View className="flex-1 pr-3">
              <Typography variant="body">Bloqueo biometrico</Typography>
              <Typography variant="caption">
                {biometricsSupported
                  ? 'Exige autenticacion al abrir la app o tras 60 segundos de inactividad.'
                  : 'Tu dispositivo no cuenta con biometria configurada.'}
              </Typography>
            </View>
            <Switch
              value={biometricsActive}
              disabled={!biometricsSupported}
              onValueChange={(enabled) => void handleToggleBiometrics(enabled)}
              accessibilityLabel="Activar bloqueo biometrico"
            />
          </View>
        </Card>

        {!notificationsAvailable() ? (
          <Card className="gap-2 border-warn bg-warn-soft">
            <Typography variant="caption" className="text-warn">
              Estas usando Expo Go: los recordatorios nativos estan desactivados. Los vencimientos
              se siguen actualizando, pero para recibir avisos instala una development build (npx
              expo run:android).
            </Typography>
          </Card>
        ) : (
          <Card className="gap-2">
            <Typography variant="label">Estado de las notificaciones</Typography>
            <Typography variant="caption">
              {permissionGranted
                ? 'Permiso de notificaciones concedido.'
                : 'Permiso de notificaciones sin conceder: los avisos no podran mostrarse.'}
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
            Llegan un dia antes de cada vencimiento de tus gastos fijos.
          </Typography>
          <TimePicker
            hour={settings?.reminderHour ?? 9}
            minute={settings?.reminderMinute ?? 0}
            onChange={(hour, minute) => void changeReminderTime(hour, minute)}
            disabled={!remindersActive}
            accessibilityLabel="Hora de los recordatorios de pagos"
          />
        </Card>

        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Typography variant="label">Tasa BCV diaria</Typography>
            <Switch
              value={bcvActive}
              onValueChange={(enabled) => void setBcvEnabled(enabled)}
              accessibilityLabel="Activar la tasa BCV diaria"
            />
          </View>
          <Typography variant="caption">
            Aviso diario con el dolar y el euro oficiales consultados antes de mostrarse.
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
                ? `Proximo aviso agendado: ${nextNoticeLabel(bcvStatus.nextTrigger)}`
                : 'El aviso esta agendado en el sistema.'}
            </Typography>
          ) : bcvActive && bcvStatus !== null ? (
            <Typography variant="caption" className="text-warn">
              El aviso no quedo agendado. Concede el permiso de notificaciones y vuelve a abrir la
              aplicacion.
            </Typography>
          ) : null}
        </Card>

        <Card className="gap-3">
          <Typography variant="label">Actualizaciones</Typography>
          <Typography variant="caption">
            Version instalada: {installedVersion() || 'desconocida'}. Las correcciones de la
            aplicacion se descargan automaticamente; las versiones nuevas se anuncian al abrir.
          </Typography>
          <Button
            label="Buscar actualizaciones"
            variant="secondary"
            loading={checking}
            fullWidth
            onPress={() => void checkForUpdates()}
          />
        </Card>

        <Typography variant="caption" className="text-center">
          Tasas referenciales. Tus datos viven solo en este dispositivo.
        </Typography>
      </View>

      <AlertDialog
        visible={notice !== null}
        title={notice?.tone === 'success' ? 'Actualizaciones' : 'Error'}
        message={notice?.message ?? ''}
        tone={notice?.tone ?? 'success'}
        onClose={() => setNotice(null)}
      />
    </Screen>
  )
}
