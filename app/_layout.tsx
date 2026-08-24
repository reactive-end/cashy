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
  useFonts as usarFuentesManrope
} from '@expo-google-fonts/manrope'
import { Stack } from 'expo-router'
import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { COLORS } from '@src/constants/theme'
import { loadSettings } from '@src/db/settings'
import { setupNotifications, syncReminders } from '@src/lib/notifications'

/** Mantiene el splash visible mientras se cargan recursos criticos */
void preventAutoHideAsync()

/**
 * Layout raiz del arbol de navegacion.
 * Envuelve toda la aplicacion con area segura y pila de pantallas.
 * @returns Arbol de navegacion raiz o null mientras cargan las fuentes
 */
export default function RootLayout() {
  const [listasFuentesFraunces] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold
  })

  const [listasFuentesManrope] = usarFuentesManrope({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold
  })

  const [synced, setSynced] = useState(false)

  const fuentesListas = listasFuentesFraunces && listasFuentesManrope

  useEffect(() => {
    if (!fuentesListas) return

    void hideAsync()
  }, [fuentesListas])

  useEffect(() => {
    let activo = true

    async function prepararRecordatorios(): Promise<void> {
      try {
        await setupNotifications()
        const ajustes = await loadSettings()
        await syncReminders(ajustes.reminderHour)
      } finally {
        if (activo) setSynced(true)
      }
    }

    void prepararRecordatorios()

    return () => {
      activo = false
    }
  }, [])

  const alEstarListo = useCallback(() => fuentesListas && synced, [fuentesListas, synced])

  if (!alEstarListo()) {
    return null
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.paper } }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="new-expense" options={{ presentation: 'modal' }} />
        <Stack.Screen name="expense/[id]" />
        <Stack.Screen name="edit-expense/[id]" />
      </Stack>
    </SafeAreaProvider>
  )
}
