/**
 * Subpantalla de Ajustes: Pagos móviles (BNC).
 * Configura la deteccion automatica de transferencias bancarias condicionada a Cashy PRO.
 */

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
  requestBankNotificationPermission,
  simulateBankNotification
} from '@src/lib/bankNotifications'
import { emit } from '@src/lib/events'

export default function BankPaymentsSettings() {
  const router = useRouter()
  const { isPro, refresh: refreshSub } = useSubscription()
  const { isAuthenticated, signIn, loading: authLoading } = useAuth()

  const [bankAccessGranted, setBankAccessGranted] = useState(false)
  const [proModalVisible, setProModalVisible] = useState(false)
  const [notice, setNotice] = useState<{ tone: AlertDialogTone; message: string } | null>(null)

  useEffect(() => {
    let active = true

    async function check(): Promise<void> {
      const granted = await hasBankNotificationPermission()
      if (active) setBankAccessGranted(granted)
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
          <Typography variant="display">Pagos móviles (BNC)</Typography>
        </View>

        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Typography variant="label">Detección inteligente</Typography>
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
            Detecta notificaciones de pago móvil recibido del Banco Nacional de Crédito (BNC) para
            sugerirte registrarlas como ingreso al instante sin digitar montos ni referencias.
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
              <Typography variant="caption" className="text-faint">
                {bankAccessGranted
                  ? 'Acceso a notificaciones de Android concedido correctamente.'
                  : 'Requiere acceso a notificaciones para leer los mensajes entrantes del BNC.'}
              </Typography>

              {!bankAccessGranted ? (
                <Button
                  label="Permitir acceso a notificaciones"
                  variant="secondary"
                  icon="bell"
                  fullWidth
                  onPress={() => requestBankNotificationPermission()}
                />
              ) : null}

              <Button
                label="Probar detección con BNC"
                variant="ghost"
                fullWidth
                onPress={() => {
                  void simulateBankNotification(
                    'PAGO MOVIL RECIBIDO',
                    'BNC Pago Movil Recibido Bs. 10000,00 Telf. 0414***69..'
                  ).then(() => {
                    emit('bank-notification-detected')
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
