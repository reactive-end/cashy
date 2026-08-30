/**
 * Pantalla dedicada de inicio de sesion con Google.
 * Ofrece acceso directo a la cuenta con diseno limpio, sin recuadros y boton oficial de Google.
 */

import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Image, Pressable, View } from 'react-native'

import logoGreen from '@assets/logo-green.png'
import { GoogleIcon } from '@src/components/atoms/GoogleIcon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog } from '@src/components/molecules/AlertDialog'
import { COLORS } from '@src/constants/theme'
import { isProfileComplete } from '@src/db/profile'
import { useAuth } from '@src/hooks/useAuth'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn, loading: authLoading } = useAuth()
  const [errorNotice, setErrorNotice] = useState<string | null>(null)

  async function handleGoogleLogin(): Promise<void> {
    const res = await signIn()
    if (res.success) {
      const complete = await isProfileComplete().catch(() => false)
      if (complete) {
        router.replace('/(tabs)')
      } else {
        router.replace('/onboarding')
      }
    } else if (res.error && !res.canceled) {
      setErrorNotice(res.error)
    }
  }

  return (
    <Screen className="justify-between px-6 py-6">
      {/* Zona central con logo, marca Cashy, cabecera y boton de acceso */}
      <View className="flex-1 items-center justify-center gap-6">
        {/* Identidad de marca: Logotipo y nombre Cashy con tipografia display */}
        <View className="items-center gap-2">
          <Image
            source={logoGreen}
            style={{ width: 64, height: 64 }}
            resizeMode="contain"
            accessibilityLabel="Logotipo oficial de Cashy"
          />
          <Typography variant="display" className="text-3xl text-ink">
            Cashy
          </Typography>
        </View>

        {/* Titulo y subtitulo de inicio de sesion */}
        <View className="items-center gap-1.5 px-4">
          <Typography variant="title" className="text-center">
            Inicia sesión
          </Typography>
          <Typography variant="caption" className="text-center text-muted">
            Accede para sincronizar tu estado de suscripción y proteger tus finanzas.
          </Typography>
        </View>

        {/* Boton oficial de inicio de sesion con Google acorde a los botones del sistema */}
        <View className="w-full max-w-xs pt-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continuar con Google"
            disabled={authLoading}
            onPress={() => void handleGoogleLogin()}
            className="w-full flex-row items-center justify-center gap-2.5 rounded-xl border border-line bg-card py-3.5 px-5 shadow-sm active:opacity-80"
          >
            {authLoading ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Typography variant="body" className="font-semibold text-ink">
                  Continuar con Google
                </Typography>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Pie de pantalla: garantia de privacidad y almacenamiento local */}
      <View className="pt-4 pb-2 px-2">
        <Typography variant="caption" className="text-center text-faint leading-[18px]">
          Tus datos financieros viven 100% en este dispositivo. Tu cuenta de Google solo se
          utiliza para verificar tu identidad y beneficios.
        </Typography>
      </View>

      <AlertDialog
        visible={errorNotice !== null}
        title="Inicio de sesión"
        message={errorNotice ?? ''}
        tone="danger"
        onClose={() => setErrorNotice(null)}
      />
    </Screen>
  )
}
