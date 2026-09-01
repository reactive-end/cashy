/**
 * Subpantalla de Ajustes: Pagos moviles.
 * Activa la deteccion automatica de pagos moviles recibidos por patron
 * de texto, condicionada a Cashy PRO y al acceso a notificaciones.
 */

import Constants from 'expo-constants'
import * as IntentLauncher from 'expo-intent-launcher'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { AppState, Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog, type AlertDialogTone } from '@src/components/molecules/AlertDialog'
import { PRO_PAYMENT_MESSAGE } from '@src/constants/supabase'
import { useAuth } from '@src/hooks/useAuth'
import { useSubscription } from '@src/hooks/useSubscription'
import {
  hasBankNotificationPermission,
  isBankNotificationListenerSupported,
  requestBankNotificationPermission,
  simulateBankNotification
} from '@src/lib/bankNotifications'
import { emit } from '@src/lib/events'

/** Texto de ejemplo real para probar la deteccion por patron */
const SAMPLE_TITLE = 'PagomóvilBDV recibido'
const SAMPLE_BODY =
  '"Recibiste un PagomovilBDV de JESUS DARIO AZUAJE MANZANILLA por Bs.1.760,00 bajo el numero de operacion 007186969576"'

export default function BankPaymentsSettings() {
  const router = useRouter()
  const { isPro, refresh: refreshSub } = useSubscription()
  const { isAuthenticated, signIn, loading: authLoading } = useAuth()

  const [listenerAvailable] = useState(() => isBankNotificationListenerSupported())
  const [notificationAccessGranted, setNotificationAccessGranted] = useState(false)
  const [proModalVisible, setProModalVisible] = useState(false)
  const [notice, setNotice] = useState<{ tone: AlertDialogTone; message: string } | null>(null)

  useEffect(() => {
    let active = true

    async function check(): Promise<void> {
      const granted = hasBankNotificationPermission()
      if (active) setNotificationAccessGranted(granted)
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

  async function handleLinkGoogle(): Promise<void> {
    const res = await signIn()
    if (res.success) {
      await refreshSub()
      setNotice({ tone: 'success', message: 'Cuenta vinculada exitosamente.' })
    } else if (res.error && !res.canceled) {
      setNotice({ tone: 'danger', message: res.error })
    }
  }

  /** Abre la ficha de la app para conceder accesos especiales restringidos */
  function openAppInfo(): void {
    const androidPackage = Constants.expoConfig?.android?.package

    void IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
      androidPackage ? { data: `package:${androidPackage}` } : undefined
    )
  }

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
          <Typography variant="display">Pagos móviles</Typography>
        </View>

        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Typography variant="label">Detección automática</Typography>
            <View className={`rounded-full px-2.5 py-0.5 ${isPro ? 'bg-accent-soft' : 'bg-line'}`}>
              <Typography
                variant="caption"
                className={isPro ? 'font-semibold text-accent' : 'text-faint'}
              >
                {isPro ? 'PRO Activo' : 'PRO Requerido'}
              </Typography>
            </View>
          </View>

          <Typography variant="caption">
            Detecta notificaciones de pago móvil recibido de cualquier banco para sugerirte
            registrarlas como ingreso al instante, sin digitar montos ni referencias.
          </Typography>

          {!isPro ? (
            <View className="gap-3 pt-1">
              <Typography variant="caption" className="text-warn">
                Esta función requiere Cashy PRO. Vincula tu cuenta de Google o adquiere una
                suscripción para desbloquearla.
              </Typography>
              {!isAuthenticated ? (
                <Button
                  label="Vincular con Google para verificar"
                  variant="secondary"
                  icon="user"
                  fullWidth
                  loading={authLoading}
                  onPress={() => void handleLinkGoogle()}
                />
              ) : (
                <Button
                  label="Adquirir Cashy PRO"
                  variant="primary"
                  icon="savings"
                  fullWidth
                  onPress={() => setProModalVisible(true)}
                />
              )}
            </View>
          ) : (
            <View className="gap-3 pt-1">
              {/* Disclosure prominente exigida antes de conceder el acceso */}
              <Typography variant="caption" className="leading-[18px]">
                Cashy leerá el contenido de las notificaciones de tu dispositivo únicamente para
                detectar avisos de pago móvil y sugerirte registrarlos. Esta información se
                procesa en tu teléfono y nunca sale de él.
              </Typography>

              {listenerAvailable ? (
                notificationAccessGranted ? (
                  <Typography variant="caption" className="text-accent">
                    Acceso a notificaciones de Android concedido correctamente.
                  </Typography>
                ) : (
                  <View className="gap-2">
                    <Button
                      label="Permitir acceso a notificaciones"
                      variant="secondary"
                      icon="bell"
                      fullWidth
                      onPress={() => requestBankNotificationPermission()}
                    />
                    <Typography variant="caption" className="text-faint text-[11px]">
                      Si Android bloquea la activación (instalación fuera de Play Store), abre la
                      ficha de la app y activa «Permitir ajustes restringidos».
                    </Typography>
                    <Button
                      label="Abrir información de la app"
                      variant="ghost"
                      icon="settings"
                      fullWidth
                      onPress={openAppInfo}
                    />
                  </View>
                )
              ) : (
                <Typography variant="caption" className="text-warn">
                  La detección solo está disponible en la aplicación instalada, no en Expo Go.
                </Typography>
              )}

              <Button
                label="Probar detección con un ejemplo"
                variant="ghost"
                fullWidth
                onPress={() => {
                  void simulateBankNotification(SAMPLE_TITLE, SAMPLE_BODY).then((parsed) => {
                    if (parsed) emit('bank-notification-detected')
                  })
                }}
              />
            </View>
          )}
        </Card>
      </View>

      <AlertDialog
        visible={proModalVisible}
        title="Adquirir Cashy PRO"
        message={PRO_PAYMENT_MESSAGE}
        onClose={() => setProModalVisible(false)}
      />

      <AlertDialog
        visible={notice !== null}
        title="Pagos móviles"
        message={notice?.message ?? ''}
        tone={notice?.tone ?? 'success'}
        onClose={() => setNotice(null)}
      />
    </Screen>
  )
}
