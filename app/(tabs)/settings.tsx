/**
 * Settings screen: user preferences.
 * Base currency for summaries plus per-notification controls:
 * payment reminders and daily BCV rate notice, each with its own
 * switch and hour picker, and a diagnostics card for permissions.
 */

import * as Updates from 'expo-updates'
import { useEffect, useState } from 'react'
import { AppState, Platform, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Screen } from '@src/components/atoms/Screen'
import { Switch } from '@src/components/atoms/Switch'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog, type AlertDialogTone } from '@src/components/molecules/AlertDialog'
import { HourPicker } from '@src/components/molecules/HourPicker'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { useSettings } from '@src/hooks/useSettings'
import {
  abrirAjustesAlarmaExacta,
  notificationsAvailable,
  permisoNotificacionesConcedido
} from '@src/lib/notifications'
import { versionInstalada } from '@src/services/appUpdate'
import { BASE_CURRENCIES, type BaseCurrency } from '@src/types/domain'

/** Opciones de moneda base para el control segmentado */
const OPCIONES_MONEDA = BASE_CURRENCIES.map((moneda) => ({ value: moneda, label: moneda }))

/** Version minima de Android que exige conceder alarmas exactas */
const ANDROID_ALARMA_EXACTA = 31

/**
 * Determina si el dispositivo requiere la concesion manual de
 * alarmas exactas (Android 12 o superior).
 * @returns true cuando aplica mostrar el acceso directo de sistema
 */
function requiereAlarmaExacta(): boolean {
  return Platform.OS === 'android' && Number(Platform.Version) >= ANDROID_ALARMA_EXACTA
}

/**
 * Pestaña de configuracion con moneda base, avisos por tipo de
 * notificacion, estado de permisos y actualizaciones.
 * @returns Pantalla de ajustes minimalista
 */
export default function Settings() {
  const {
    settings,
    changeBaseCurrency,
    changeReminderHour,
    changeBcvHour,
    setRemindersEnabled,
    setBcvEnabled
  } = useSettings()

  const [permisoConcedido, setPermisoConcedido] = useState(false)
  const [verificando, setVerificando] = useState(false)
  const [aviso, setAviso] = useState<{ tono: AlertDialogTone; mensaje: string } | null>(null)

  /** Busca una actualizacion de JS via EAS Update y la deja lista */
  async function buscarActualizaciones(): Promise<void> {
    if (!Updates.isEnabled) {
      setAviso({
        tono: 'danger',
        mensaje: 'Las actualizaciones no estan disponibles en este entorno.'
      })
      return
    }

    setVerificando(true)

    try {
      const chequeo = await Updates.checkForUpdateAsync()

      if (!chequeo.isAvailable) {
        setAviso({ tono: 'success', mensaje: 'Ya tienes la ultima version instalada.' })
        return
      }

      await Updates.fetchUpdateAsync()
      setAviso({
        tono: 'success',
        mensaje: 'Actualizacion descargada. Se aplicara al reiniciar la aplicacion.'
      })
    } catch {
      setAviso({
        tono: 'danger',
        mensaje: 'No se pudo verificar actualizaciones. Revisa tu conexion.'
      })
    } finally {
      setVerificando(false)
    }
  }

  useEffect(() => {
    if (!notificationsAvailable()) return

    const refrescar = (): void => {
      void permisoNotificacionesConcedido().then(setPermisoConcedido)
    }

    refrescar()

    const suscripcion = AppState.addEventListener('change', refrescar)

    return () => suscripcion.remove()
  }, [])

  const recordatoriosActivos = settings?.remindersEnabled ?? true
  const bcvActivo = settings?.bcvEnabled ?? true

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
            options={OPCIONES_MONEDA}
            value={(settings?.baseCurrency ?? 'USD') as BaseCurrency}
            onChange={(valor) => void changeBaseCurrency(valor)}
          />
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
              {permisoConcedido
                ? 'Permiso de notificaciones concedido.'
                : 'Permiso de notificaciones sin conceder: los avisos no podran mostrarse.'}
            </Typography>
            {requiereAlarmaExacta() ? (
              <Button
                label="Permitir alarmas exactas"
                variant="secondary"
                icon="bell"
                onPress={() => void abrirAjustesAlarmaExacta()}
              />
            ) : null}
            <Typography variant="caption" className="text-faint">
              En telefonos Xiaomi, Huawei o Samsung revisa ademas que Cashy no tenga el ahorro de
              bateria restringido.
            </Typography>
          </Card>
        )}

        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Typography variant="label">Recordatorios de pagos</Typography>
            <Switch
              value={recordatoriosActivos}
              onValueChange={(valor) => void setRemindersEnabled(valor)}
              accessibilityLabel="Activar recordatorios de pagos"
            />
          </View>
          <Typography variant="caption">
            Llegan un dia antes de cada vencimiento de tus gastos fijos.
          </Typography>
          <HourPicker
            value={settings?.reminderHour ?? 9}
            onChange={(hora) => void changeReminderHour(hora)}
            disabled={!recordatoriosActivos}
            accessibilityLabel="Hora de los recordatorios de pagos"
          />
        </Card>

        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Typography variant="label">Tasa BCV diaria</Typography>
            <Switch
              value={bcvActivo}
              onValueChange={(valor) => void setBcvEnabled(valor)}
              accessibilityLabel="Activar la tasa BCV diaria"
            />
          </View>
          <Typography variant="caption">
            Aviso diario con el dolar y el euro oficiales consultados antes de mostrarse.
          </Typography>
          <HourPicker
            value={settings?.bcvHour ?? 9}
            onChange={(hora) => void changeBcvHour(hora)}
            disabled={!bcvActivo}
            accessibilityLabel="Hora del aviso de tasa BCV"
          />
        </Card>

        <Card className="gap-3">
          <Typography variant="label">Actualizaciones</Typography>
          <Typography variant="caption">
            Version instalada: {versionInstalada() || 'desconocida'}. Las correcciones de la
            aplicacion se descargan automaticamente; las versiones nuevas se anuncian al abrir.
          </Typography>
          <Button
            label="Buscar actualizaciones"
            variant="secondary"
            loading={verificando}
            onPress={() => void buscarActualizaciones()}
          />
        </Card>

        <Typography variant="caption" className="text-center">
          Tasas referenciales consultadas una vez al dia. Tus datos viven solo en este dispositivo.
        </Typography>
      </View>

      <AlertDialog
        visible={aviso !== null}
        title={aviso?.tono === 'success' ? 'Actualizaciones' : 'Error'}
        message={aviso?.mensaje ?? ''}
        tone={aviso?.tono ?? 'success'}
        onClose={() => setAviso(null)}
      />
    </Screen>
  )
}
