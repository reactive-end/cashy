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

import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog'
import { COLORS } from '@src/constants/theme'
import { loadSettings } from '@src/db/settings'
import { useAppUpdate } from '@src/hooks/useAppUpdate'
import { useNotificationDeepLink } from '@src/hooks/useNotificationDeepLink'
import { registrarTareaBackground } from '@src/lib/backgroundTask'
import { setupNotifications, sincronizarAvisosBcv, syncReminders } from '@src/lib/notifications'
import { getExchangeRates } from '@src/services/rates'

/** Mantiene el splash visible mientras se cargan recursos criticos */
void preventAutoHideAsync()

/**
 * Layout raiz del arbol de navegacion.
 * Envuelve toda la aplicacion con area segura y pila de pantallas,
 * registra la tarea en background y observa deep links de notificaciones.
 * @returns Arbol de navegacion raiz o null mientras cargan las fuentes
 */
export default function RootLayout() {
  useNotificationDeepLink()

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
        const tasas = await getExchangeRates().catch(() => undefined)

        await sincronizarAvisosBcv(ajustes, tasas)
        await syncReminders(ajustes)
        await registrarTareaBackground()
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

  const actualizacion = useAppUpdate()

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

      <ConfirmDialog
        visible={actualizacion.disponible !== null}
        title="Nueva version"
        message={
          actualizacion.descargando
            ? `Descargando version ${actualizacion.disponible?.version ?? ''}... ${Math.round(
                actualizacion.progreso * 100
              )}%`
            : `La version ${actualizacion.disponible?.version ?? ''} esta disponible. Se descargara la nueva version de Cashy.`
        }
        confirmLabel="Actualizar"
        cancelLabel="Cancelar"
        onConfirm={() => void actualizacion.confirmar()}
        onCancel={() => {
          if (!actualizacion.descargando) void actualizacion.descartar()
        }}
      />
    </SafeAreaProvider>
  )
}
