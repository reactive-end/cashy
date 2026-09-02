/**
 * Subpantalla de Ajustes: Tus datos y Cuenta.
 * Centraliza la identidad de Google, foto de perfil, estado PRO,
 * datos locales y fuentes de ingreso.
 * La logica de enlace, perfil e ingresos reside en useAccountSettings.
 */

import { useRouter } from 'expo-router'
import { Image, Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog } from '@src/components/molecules/AlertDialog'
import { COLORS } from '@src/constants/theme'
import { useAccountSettings } from '@src/hooks/useAccountSettings'
import { formatAmount } from '@src/lib/format'
import { RECURRENCE_LABELS } from '@src/types/domain'

export default function AccountSettings() {
  const router = useRouter()
  const {
    user,
    isAuthenticated,
    authLoading,
    isPro,
    subscriptionText,
    profileName,
    profileEmail,
    incomes,
    notice,
    setNotice,
    handleLinkGoogle,
    handleSignOut,
    openProPayment,
    openEditProfile
  } = useAccountSettings()

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

              <Typography variant="caption">{subscriptionText}</Typography>

              {!isPro ? (
                <Button
                  label="Adquirir Cashy PRO"
                  variant="primary"
                  icon="savings"
                  fullWidth
                  onPress={openProPayment}
                />
              ) : null}

              <Button
                label="Cerrar sesión de Google"
                variant="ghost"
                fullWidth
                onPress={() => void handleSignOut()}
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
            onPress={openEditProfile}
          />
        </Card>

        {/* Tarjeta de Fuentes de Ingreso */}
        <Card className="gap-3">
          <Typography variant="label">Fuentes de ingreso registradas</Typography>
          {incomes.length === 0 ? (
            <Typography variant="caption" className="text-faint">
              No tienes fuentes de ingreso registradas.
            </Typography>
          ) : (
            <View className="gap-2 divide-y divide-line">
              {incomes.map((inc) => (
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
        visible={notice !== null}
        title="Cuenta"
        message={notice?.message ?? ''}
        tone={notice?.tone ?? 'success'}
        onClose={() => setNotice(null)}
      />
    </Screen>
  )
}
