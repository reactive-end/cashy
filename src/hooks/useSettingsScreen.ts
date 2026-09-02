/**
 * Hook useSettingsScreen: centraliza la identidad de usuario, estado de perfil,
 * resumenes de configuracion y navegacion para la pantalla de Ajustes (/settings).
 */

import { useRouter, type Href } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { getProfile } from '@src/db/profile'
import { useAuth } from '@src/hooks/useAuth'
import { useSettings } from '@src/hooks/useSettings'
import { useSubscription } from '@src/hooks/useSubscription'
import { subscribe } from '@src/lib/events'
import { formatTime12 } from '@src/lib/format'
import { installedVersion } from '@src/services/appUpdate'

export interface UseSettingsScreenResult {
  displayName: string
  emailOrMode: string
  planLabel: string
  avatarUrl: string | null
  isPro: boolean
  baseCurrency: string
  reminderTime: string
  remindersEnabled: boolean
  biometricsEnabled: boolean
  versionLabel: string
  navigateTo: (route: string) => void
}

/**
 * Hook para la pantalla principal de Ajustes.
 * @returns Datos consolidados de cuenta, perfil y navegacion
 */
export function useSettingsScreen(): UseSettingsScreenResult {
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

  const displayName =
    isAuthenticated && user
      ? `${user.firstName} ${user.lastName}`
      : profileName || 'Usuario de Cashy'

  const emailOrMode =
    isAuthenticated && user?.email ? user.email : 'Modo local · Toca para vincular Google'

  const planLabel = isPro ? 'Cashy PRO' : isAuthenticated ? 'Plan Gratuito' : 'Modo local'

  const avatarUrl = isAuthenticated && user?.avatarUrl ? user.avatarUrl : null

  const navigateTo = useCallback(
    (route: string) => {
      router.push(route as Href)
    },
    [router]
  )

  return {
    displayName,
    emailOrMode,
    planLabel,
    avatarUrl,
    isPro,
    baseCurrency: settings?.baseCurrency ?? 'USD',
    reminderTime,
    remindersEnabled: settings?.remindersEnabled ?? false,
    biometricsEnabled: settings?.biometricsEnabled ?? false,
    versionLabel: `v${installedVersion() || '1.2.0'}`,
    navigateTo
  }
}
