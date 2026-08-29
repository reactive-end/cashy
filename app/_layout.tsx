/**
 * Root layout of Cashy: loads fonts and global styles,
 * sets up the notification channel and syncs fixed expense
 * reminders on every application start.
 */

import '@src/styles/global.css'
import { Fraunces_500Medium, Fraunces_600SemiBold, useFonts } from '@expo-google-fonts/fraunces'
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts as useManropeFonts
} from '@expo-google-fonts/manrope'
import { Stack, usePathname, router } from 'expo-router'
import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog'
import { AppLockGate } from '@src/components/organisms/AppLockGate'
import { COLORS } from '@src/constants/theme'
import { isProfileComplete } from '@src/db/profile'
import { loadSettings } from '@src/db/settings'
import { useAppUpdate } from '@src/hooks/useAppUpdate'
import { useNotificationDeepLink } from '@src/hooks/useNotificationDeepLink'
import { registerBackgroundTask } from '@src/lib/backgroundTask'
import { subscribe } from '@src/lib/events'
import { setupNotifications, syncBcvNotice, syncReminders } from '@src/lib/notifications'
import { getExchangeRates } from '@src/services/rates'

/** Mantiene el splash visible mientras se cargan recursos criticos */
void preventAutoHideAsync()

/**
 * Layout raiz del arbol de navegacion.
 * Envuelve toda la aplicacion con area segura y pila de pantallas,
 * registra la tarea en background, observa deep links de
 * notificaciones y bloquea la navegacion en el onboarding mientras
 * el perfil del usuario este incompleto.
 *
 * El gate usa registro estatico de TODAS las rutas mas redireccion
 * centralizada: nunca se montan hijos condicionales ni fragments
 * dentro de Stack porque expo-router no los tolera.
 * @returns Arbol de navegacion raiz o null mientras cargan las fuentes
 */
export default function RootLayout() {
  const pathname = usePathname()

  const [frauncesLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold
  })

  const [manropeLoaded] = useManropeFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold
  })

  const [synced, setSynced] = useState(false)
  const [profileReady, setProfileReady] = useState<boolean | null>(null)

  const fontsLoaded = frauncesLoaded && manropeLoaded

  useEffect(() => {
    if (!fontsLoaded) return

    void hideAsync()
  }, [fontsLoaded])

  useEffect(() => {
    let active = true

    async function setupReminders(): Promise<void> {
      try {
        await setupNotifications()
        const settings = await loadSettings()
        const rates = await getExchangeRates().catch(() => undefined)

        await syncBcvNotice(settings, rates)
        await syncReminders(settings)
        await registerBackgroundTask()
      } finally {
        if (active) setSynced(true)
      }
    }

    void setupReminders().catch(() => {
      // Fallo silencioso: los avisos se reintentan en la proxima apertura.
    })

    return () => {
      active = false
    }
  }, [])

  // Gate del onboarding: sin perfil completo la app abre siempre en
  // el wizard; al guardar, el evento habilita el arbol principal.
  useEffect(() => {
    let active = true

    isProfileComplete()
      .then((complete) => {
        if (active) setProfileReady(complete)
      })
      .catch(() => {
        // Base ilegible: se trata como sin perfil y el wizard reintenta.
        if (active) setProfileReady(false)
      })

    const unsubscribe = subscribe('profile-changed', () => setProfileReady(true))

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const needsOnboarding = profileReady === false

  // Redireccion centralizada del gate: mantiene el navegador sobre la
  // ruta correcta sin alterar la topologia del Stack ni usar key dinamico.
  useEffect(() => {
    if (!fontsLoaded || !synced || profileReady === null) return

    if (
      needsOnboarding &&
      pathname !== '/onboarding' &&
      pathname !== '/new-income' &&
      !pathname.startsWith('/edit-income')
    ) {
      router.replace('/onboarding')

      return
    }

    if (!needsOnboarding && pathname === '/onboarding') {
      router.replace('/(tabs)')
    }
  }, [fontsLoaded, synced, profileReady, needsOnboarding, pathname])

  const isReady = useCallback(
    () => fontsLoaded && synced && profileReady !== null,
    [fontsLoaded, synced, profileReady]
  )

  const deepLinkEnabled = profileReady === true

  useNotificationDeepLink(deepLinkEnabled)

  const appUpdate = useAppUpdate()

  if (!isReady()) {
    return null
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppLockGate>
        <Stack
          initialRouteName={needsOnboarding ? 'onboarding' : '(tabs)'}
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.paper } }}
        >
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="expenses" />
          <Stack.Screen name="incomes" />
          <Stack.Screen name="new-expense" options={{ presentation: 'modal' }} />
          <Stack.Screen name="new-income" options={{ presentation: 'modal' }} />
          <Stack.Screen name="edit-income/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
          <Stack.Screen name="market" options={{ presentation: 'modal' }} />
          <Stack.Screen name="expense/[id]" />
          <Stack.Screen name="edit-expense/[id]" />
          <Stack.Screen name="income/[id]" />
        </Stack>

        <ConfirmDialog
          visible={appUpdate.available !== null}
          title="Nueva version"
          message={
            appUpdate.downloading
              ? `Descargando version ${appUpdate.available?.version ?? ''}... ${Math.round(
                  appUpdate.progress * 100
                )}%`
              : `La version ${appUpdate.available?.version ?? ''} esta disponible. Se descargara la nueva version de Cashy.`
          }
          confirmLabel={appUpdate.downloading ? 'Descargando...' : 'Actualizar'}
          cancelLabel="Cancelar"
          confirmDisabled={appUpdate.downloading}
          cancelDisabled={appUpdate.downloading}
          onConfirm={() => void appUpdate.confirm()}
          onCancel={() => {
            if (!appUpdate.downloading) void appUpdate.dismiss()
          }}
        />
      </AppLockGate>
    </SafeAreaProvider>
  )
}
