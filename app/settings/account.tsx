/**
 * Subpantalla de Ajustes: Tus datos y Cuenta.
 * Centraliza la identidad de Google, foto de perfil, estado PRO,
 * datos locales y fuentes de ingreso.
 */

import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Image, Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog, type AlertDialogTone } from '@src/components/molecules/AlertDialog'
import { PRO_PAYMENT_MESSAGE } from '@src/constants/supabase'
import { COLORS } from '@src/constants/theme'
import { getProfile } from '@src/db/profile'
import { useAuth } from '@src/hooks/useAuth'
import { useIncomes } from '@src/hooks/useIncomes'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { useSubscription } from '@src/hooks/useSubscription'
import { subscribe } from '@src/lib/events'
import { formatAmount } from '@src/lib/format'
import { RECURRENCE_LABELS } from '@src/types/domain'

export default function AccountSettings() {
  const router = useRouter()
  const { user, isAuthenticated, signIn, signOut, loading: authLoading } = useAuth()
  const { isPro, refresh: refreshSub } = useSubscription()
  const { settings } = useSettings()
  const ratesState = useRates()
  const incomesState = useIncomes(ratesState.rates, settings?.baseCurrency ?? 'USD')

  const [profileName, setProfileName] = useState<string | null>(null)
  const [profileEmail, setProfileEmail] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: AlertDialogTone; message: string } | null>(null)
  const [proModalVisible, setProModalVisible] = useState(false)

  useEffect(() => {
    let active = true

    async function load(): Promise<void> {
      const p = await getProfile().catch(() => null)
      if (active && p) {
        setProfileName(`${p.firstName} ${p.lastName}`.trim())
        setProfileEmail(p.email)
      }
    }

    void load()
    const unsubscribe = subscribe('profile-changed', () => void load())
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  async function handleLinkGoogle(): Promise<void> {
    const res = await signIn()
    if (res.success) {
      await refreshSub()
      setNotice({ tone: 'success', message: 'Cuenta de Google vinculada exitosamente.' })
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
          <Typography variant="display">Tus datos y Cuenta</Typography>
        </View>

        {/* Tarjeta de Cuenta de Google */}
        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Typography variant="label">Cuenta de Google</Typography>
            <View className={`rounded-full px-2.5 py-0.5 ${isPro ? 'bg-accent-soft' : 'bg-line'}`}>
              <Typography
                variant="caption"
                className={isPro ? 'font-semibold text-accent' : 'text-faint'}
              >
                {isPro ? 'Cashy PRO' : isAuthenticated ? 'Plan Gratuito' : 'Modo local'}
              </Typography>
            </View>
          </View>

          {isAuthenticated && user ? (
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                {user.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                    accessibilityLabel="Foto de perfil de Google"
                  />
                ) : (
                  <View
                    className="h-12 w-12 items-center justify-center rounded-full border border-line"
                    style={{ backgroundColor: COLORS.accentSoft }}
                  >
                    <Icon name="user" size={24} color={COLORS.accent} />
                  </View>
                )}
                <View className="flex-1">
                  <Typography variant="body" className="font-semibold text-ink">
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="caption" className="text-faint">
                    {user.email}
                  </Typography>
                </View>
              </View>

              <Typography variant="caption">
                {isPro
                  ? 'Tienes acceso activo a la detección de pagos móviles y funciones exclusivas.'
                  : 'Actualiza a Cashy PRO para disfrutar de la detección automática de comprobantes bancarios.'}
              </Typography>

              {!isPro ? (
                <Button
                  label="Adquirir Cashy PRO"
                  variant="primary"
                  icon="savings"
                  fullWidth
                  onPress={() => setProModalVisible(true)}
                />
              ) : null}

              <Button
                label="Cerrar sesión de Google"
                variant="ghost"
                fullWidth
                onPress={() => void signOut()}
              />
            </View>
          ) : (
            <View className="gap-3">
              <Typography variant="caption">
                Tus datos viven en este dispositivo. Vincula tu cuenta de Google para verificar tu
                suscripción o activar Cashy PRO con total seguridad.
              </Typography>
              <Button
                label="Vincular cuenta de Google"
                variant="secondary"
                icon="user"
                fullWidth
                loading={authLoading}
                onPress={() => void handleLinkGoogle()}
              />
            </View>
          )}
        </Card>

        {/* Tarjeta de Datos Personales Locales */}
        <Card className="gap-3">
          <Typography variant="label">Datos personales</Typography>
          <View className="gap-1">
            <Typography variant="caption" className="text-faint">
              Nombre registrado:
            </Typography>
            <Typography variant="body" className="font-semibold text-ink">
              {profileName || 'No configurado'}
            </Typography>
            {profileEmail ? (
              <Typography variant="caption" className="text-muted">
                {profileEmail}
              </Typography>
            ) : null}
          </View>
          <Button
            label="Editar datos e ingresos"
            variant="secondary"
            icon="edit"
            fullWidth
            onPress={() => router.push('/edit-profile')}
          />
        </Card>

        {/* Tarjeta de Fuentes de Ingreso */}
        <Card className="gap-3">
          <Typography variant="label">Fuentes de ingreso registradas</Typography>
          {incomesState.incomes.length === 0 ? (
            <Typography variant="caption" className="text-faint">
              No tienes fuentes de ingreso registradas.
            </Typography>
          ) : (
            <View className="gap-2 divide-y divide-line">
              {incomesState.incomes.map((inc) => (
                <View key={inc.id} className="flex-row items-center justify-between pt-2">
                  <View className="flex-1 pr-2">
                    <Typography variant="body" className="font-medium text-ink">
                      {inc.name}
                    </Typography>
                    <Typography variant="caption" className="text-faint">
                      {inc.recurrence ? RECURRENCE_LABELS[inc.recurrence] : 'Puntual'}
                    </Typography>
                  </View>
                  <Typography variant="body" className="font-semibold text-accent">
                    {formatAmount(inc.amount, inc.currency)}
                  </Typography>
                </View>
              ))}
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
        title="Cuenta"
        message={notice?.message ?? ''}
        tone={notice?.tone ?? 'success'}
        onClose={() => setNotice(null)}
      />
    </Screen>
  )
}
