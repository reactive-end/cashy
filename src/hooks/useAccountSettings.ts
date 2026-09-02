/**
 * Hook useAccountSettings: administra la identidad de Google, estado de suscripcion,
 * datos de perfil y fuentes de ingreso registradas para /settings/account.
 */

import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import type { AlertDialogTone } from '@src/components/molecules/AlertDialog'
import { getProfile } from '@src/db/profile'
import { useAuth } from '@src/hooks/useAuth'
import { useIncomes } from '@src/hooks/useIncomes'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { useSubscription } from '@src/hooks/useSubscription'
import { subscribe } from '@src/lib/events'
import type { AuthUser, Income } from '@src/types/domain'

export interface UseAccountSettingsResult {
  user: AuthUser | null
  isAuthenticated: boolean
  authLoading: boolean
  isPro: boolean
  subscriptionText: string
  profileName: string | null
  profileEmail: string | null
  incomes: Income[]
  notice: { tone: AlertDialogTone; message: string } | null
  setNotice: (notice: { tone: AlertDialogTone; message: string } | null) => void
  handleLinkGoogle: () => Promise<void>
  handleSignOut: () => Promise<void>
  openProPayment: () => void
  openEditProfile: () => void
}

/**
 * Hook para la pantalla de Cuenta y Datos Personales.
 * @returns Datos de sesion, perfil, ingresos y acciones de enlace
 */
export function useAccountSettings(): UseAccountSettingsResult {
  const router = useRouter()
  const { user, isAuthenticated, signIn, signOut, loading: authLoading } = useAuth()
  const { isPro, subscription, refresh: refreshSub } = useSubscription()
  const { settings } = useSettings()
  const ratesState = useRates()
  const incomesState = useIncomes(ratesState.rates, settings?.baseCurrency ?? 'USD')

  const [profileName, setProfileName] = useState<string | null>(null)
  const [profileEmail, setProfileEmail] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: AlertDialogTone; message: string } | null>(null)

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

  const handleLinkGoogle = useCallback(async (): Promise<void> => {
    const res = await signIn()
    if (res.success) {
      await refreshSub()
      setNotice({ tone: 'success', message: 'Cuenta de Google vinculada exitosamente.' })
    } else if (res.error && !res.canceled) {
      setNotice({ tone: 'danger', message: res.error })
    }
  }, [signIn, refreshSub])

  const handleSignOut = useCallback(async (): Promise<void> => {
    await signOut()
  }, [signOut])

  const openProPayment = useCallback(() => {
    router.push('/settings/pro-payment' as never)
  }, [router])

  const openEditProfile = useCallback(() => {
    router.push('/edit-profile')
  }, [router])

  const subscriptionText = isPro
    ? subscription?.expiresAt
      ? `Suscripción Cashy PRO activa hasta el ${new Date(subscription.expiresAt).toLocaleDateString('es-ES')}.`
      : 'Suscripción Cashy PRO vitalicia activa.'
    : 'Actualiza a Cashy PRO para disfrutar de las funciones exclusivas.'

  return {
    user,
    isAuthenticated,
    authLoading,
    isPro,
    subscriptionText,
    profileName,
    profileEmail,
    incomes: incomesState.incomes,
    notice,
    setNotice,
    handleLinkGoogle,
    handleSignOut,
    openProPayment,
    openEditProfile
  }
}
