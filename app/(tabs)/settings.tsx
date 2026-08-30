/**
 * Pantalla principal de Ajustes.
 * Centro de navegacion modular con acceso a 6 subpantallas especializadas,
 * visualizacion de perfil de Google con avatar y estado de Cashy PRO.
 */

import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Image, Pressable, View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import type { IconName } from '@src/components/atoms/Icon/Icon.d'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'
import { getProfile } from '@src/db/profile'
import { useAuth } from '@src/hooks/useAuth'
import { useSettings } from '@src/hooks/useSettings'
import { useSubscription } from '@src/hooks/useSubscription'
import { subscribe } from '@src/lib/events'
import { formatTime12 } from '@src/lib/format'
import { installedVersion } from '@src/services/appUpdate'

/** Elemento de navegacion de la lista de ajustes */
interface SettingsNavItemProps {
  icon: IconName
  title: string
  subtitle: string
  valueBadge?: string
  badgeTone?: 'accent' | 'neutral' | 'warn'
  onPress: () => void
  accessibilityLabel: string
}

function SettingsNavItem({
  icon,
  title,
  subtitle,
  valueBadge,
  badgeTone = 'neutral',
  onPress,
  accessibilityLabel
}: SettingsNavItemProps) {
  const badgeClasses =
    badgeTone === 'accent'
      ? 'bg-accent-soft text-accent'
      : badgeTone === 'warn'
        ? 'bg-warn-soft text-warn'
        : 'bg-line text-muted'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="flex-row items-center justify-between py-3 active:opacity-60"
    >
      <View className="flex-1 flex-row items-center gap-3 pr-2">
        <View
          className="h-10 w-10 items-center justify-center rounded-xl border border-line"
          style={{ backgroundColor: COLORS.paper }}
        >
          <Icon name={icon} size={20} color={COLORS.ink} />
        </View>
        <View className="flex-1">
          <Typography variant="body" className="font-semibold text-ink">
            {title}
          </Typography>
          <Typography variant="caption" className="text-faint" numberOfLines={1}>
            {subtitle}
          </Typography>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        {valueBadge ? (
          <View className={`rounded-full px-2.5 py-0.5 ${badgeClasses.split(' ')[0]}`}>
            <Typography variant="caption" className={`font-semibold ${badgeClasses.split(' ')[1]}`}>
              {valueBadge}
            </Typography>
          </View>
        ) : null}
        <Icon name="chevronRight" size={18} color="#757570" />
      </View>
    </Pressable>
  )
}

export default function Settings() {
  const router = useRouter()
  const { settings } = useSettings()
  const { user, isAuthenticated } = useAuth()
  const { isPro } = useSubscription()
  const [profileName, setProfileName] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load(): Promise<void> {
      const p = await getProfile().catch(() => null)
      if (active && p) {
        setProfileName(`${p.firstName} ${p.lastName}`.trim())
      }
    }

    void load()
    const unsubscribe = subscribe('profile-changed', () => void load())
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const reminderTime = formatTime12(settings?.reminderHour ?? 9, settings?.reminderMinute ?? 0)

  return (
    <Screen scrollable>
      <View className="gap-5 pt-6 pb-12">
        <Typography variant="display">Ajustes</Typography>

        {/* Tarjeta de Identidad y Perfil superior */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir gestion de cuenta y datos"
          onPress={() => router.push('/settings/account')}
          className="active:opacity-80"
        >
          <Card className="flex-row items-center justify-between p-4">
            <View className="flex-1 flex-row items-center gap-3 pr-2">
              {isAuthenticated && user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
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
                  {isAuthenticated && user
                    ? `${user.firstName} ${user.lastName}`
                    : profileName || 'Usuario de Cashy'}
                </Typography>
                <Typography variant="caption" className="text-faint" numberOfLines={1}>
                  {isAuthenticated && user?.email
                    ? user.email
                    : 'Modo local · Toca para vincular Google'}
                </Typography>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <View
                className={`rounded-full px-2.5 py-0.5 ${isPro ? 'bg-accent-soft' : 'bg-line'}`}
              >
                <Typography
                  variant="caption"
                  className={isPro ? 'font-semibold text-accent' : 'text-faint'}
                >
                  {isPro ? 'Cashy PRO' : isAuthenticated ? 'Plan Gratuito' : 'Modo local'}
                </Typography>
              </View>
              <Icon name="chevronRight" size={18} color="#757570" />
            </View>
          </Card>
        </Pressable>

        {/* Categoria: Cuenta y Datos */}
        <View className="gap-2">
          <Typography variant="label" className="px-1 text-muted">
            Cuenta y perfil
          </Typography>
          <Card className="py-1">
            <SettingsNavItem
              icon="user"
              title="Tus datos y Cuenta"
              subtitle="Perfil, fuentes de ingreso y Google Auth"
              onPress={() => router.push('/settings/account')}
              accessibilityLabel="Ir a tus datos y cuenta"
            />
          </Card>
        </View>

        {/* Categoria: Preferencias */}
        <View className="gap-2">
          <Typography variant="label" className="px-1 text-muted">
            Preferencias
          </Typography>
          <Card className="py-1 divide-y divide-line">
            <SettingsNavItem
              icon="dollar"
              title="Moneda base"
              subtitle="Divisa de consolidación y reportes"
              valueBadge={settings?.baseCurrency ?? 'USD'}
              badgeTone="accent"
              onPress={() => router.push('/settings/currency')}
              accessibilityLabel="Ir a selector de moneda base"
            />

            <SettingsNavItem
              icon="bell"
              title="Notificaciones y Recordatorios"
              subtitle={`Avisos (${reminderTime}) y tasa BCV diaria`}
              onPress={() => router.push('/settings/notifications')}
              accessibilityLabel="Ir a notificaciones y recordatorios"
            />

            <SettingsNavItem
              icon="shield"
              title="Seguridad y Privacidad"
              subtitle={
                settings?.biometricsEnabled
                  ? 'Bloqueo biométrico activo'
                  : 'Bloqueo biométrico inactivo'
              }
              valueBadge={settings?.biometricsEnabled ? 'Activo' : undefined}
              badgeTone="accent"
              onPress={() => router.push('/settings/security')}
              accessibilityLabel="Ir a seguridad y privacidad"
            />
          </Card>
        </View>

        {/* Categoria: Informacion y Acerca de */}
        <View className="gap-2">
          <Typography variant="label" className="px-1 text-muted">
            Información
          </Typography>
          <Card className="py-1 divide-y divide-line">
            <SettingsNavItem
              icon="refresh"
              title="Actualizaciones"
              subtitle="Búsqueda y descarga de versiones"
              valueBadge={`v${installedVersion() || '1.1.1'}`}
              onPress={() => router.push('/settings/updates')}
              accessibilityLabel="Ir a actualizaciones"
            />

            <SettingsNavItem
              icon="info"
              title="Acerca de Cashy"
              subtitle="Desarrollado por Rafael Pisani"
              onPress={() => router.push('/settings/about')}
              accessibilityLabel="Ir a acerca de Cashy"
            />
          </Card>
        </View>

        <Typography variant="caption" className="text-center pt-2">
          Tasas referenciales. Tus datos viven solo en este dispositivo.
        </Typography>
      </View>
    </Screen>
  )
}
