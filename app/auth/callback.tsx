/**
 * Pantalla de captura y resolucion de callbacks de autenticacion OAuth.
 * Procesa access_token o code devueltos por Google/Supabase y redirige al usuario.
 */

import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Linking, View } from 'react-native'

import logoGreen from '@assets/logo-green.png'
import { Button } from '@src/components/atoms/Button'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'
import { isProfileComplete } from '@src/db/profile'
import { emit } from '@src/lib/events'
import { extractParamsFromUrl, supabase } from '@src/services/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const localParams = useLocalSearchParams<Record<string, string>>()
  const globalParams = useGlobalSearchParams<Record<string, string>>()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function processCredentials(url: string | null): Promise<void> {
      try {
        const urlParams = url ? extractParamsFromUrl(url) : {}
        const mergedParams: Record<string, string> = {
          ...globalParams,
          ...localParams,
          ...urlParams
        }

        const accessToken = mergedParams.access_token
        const refreshToken = mergedParams.refresh_token
        const code = mergedParams.code

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) throw error

          emit('auth-changed')

          const complete = await isProfileComplete().catch(() => false)
          if (!active) return

          if (complete) {
            router.replace('/(tabs)')
          } else {
            router.replace('/onboarding')
          }
          return
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error

          emit('auth-changed')

          const complete = await isProfileComplete().catch(() => false)
          if (!active) return

          if (complete) {
            router.replace('/(tabs)')
          } else {
            router.replace('/onboarding')
          }
          return
        }

        // Si ya hay sesion activa en Supabase
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          emit('auth-changed')
          const complete = await isProfileComplete().catch(() => false)
          if (!active) return

          if (complete) {
            router.replace('/(tabs)')
          } else {
            router.replace('/onboarding')
          }
          return
        }

        if (mergedParams.error_description || mergedParams.error) {
          throw new Error(mergedParams.error_description || mergedParams.error)
        }

        if (active) setErrorMsg('No se encontraron credenciales de acceso.')
      } catch (err) {
        if (active) {
          const message = err instanceof Error ? err.message : 'Error procesando autenticación'
          setErrorMsg(message)
        }
      }
    }

    void Linking.getInitialURL().then((url) => {
      void processCredentials(url)
    })

    const sub = Linking.addEventListener('url', (event) => {
      void processCredentials(event.url)
    })

    return () => {
      active = false
      sub.remove()
    }
  }, [globalParams, localParams, router])

  return (
    <Screen className="items-center justify-center">
      <View className="items-center justify-center gap-4 px-6">
        <Image
          source={logoGreen}
          style={{ width: 64, height: 64 }}
          resizeMode="contain"
          accessibilityLabel="Logotipo oficial de Cashy"
        />

        {errorMsg ? (
          <View className="items-center gap-3">
            <Typography variant="title" className="text-center text-danger">
              No se pudo iniciar sesión
            </Typography>
            <Typography variant="caption" className="text-center text-muted">
              {errorMsg}
            </Typography>
            <View className="pt-2">
              <Button
                label="Volver a intentar"
                variant="secondary"
                onPress={() => router.replace('/login')}
              />
            </View>
          </View>
        ) : (
          <View className="items-center gap-3">
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Typography variant="body" className="text-center text-muted">
              Comprobando credenciales y sincronizando cuenta...
            </Typography>
          </View>
        )}
      </View>
    </Screen>
  )
}
