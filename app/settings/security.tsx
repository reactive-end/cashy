/**
 * Subpantalla de Ajustes: Seguridad y Privacidad.
 * Gestiona el bloqueo biometrico y detalla el modelo de privacidad local de Cashy.
 */

import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Switch } from '@src/components/atoms/Switch'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog } from '@src/components/molecules/AlertDialog'
import { useSettings } from '@src/hooks/useSettings'
import { authenticateWithBiometrics, isBiometricsAvailable } from '@src/lib/biometrics'

export default function SecuritySettings() {
  const router = useRouter()
  const { settings, setBiometricsEnabled } = useSettings()

  const [biometricsSupported, setBiometricsSupported] = useState(false)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)

  const biometricsActive = settings?.biometricsEnabled ?? false

  useEffect(() => {
    void isBiometricsAvailable().then(setBiometricsSupported)
  }, [])

  async function handleToggleBiometrics(enabled: boolean): Promise<void> {
    const prompt = enabled
      ? 'Confirma tu identidad para activar el bloqueo biométrico'
      : 'Confirma tu identidad para desactivar el bloqueo biométrico'

    const ok = await authenticateWithBiometrics(prompt)
    if (ok) {
      await setBiometricsEnabled(enabled)
    } else {
      setErrorNotice('No se pudo verificar la identidad biométrica.')
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
          <Typography variant="display">Seguridad</Typography>
        </View>

        {/* Bloqueo biometrico */}
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Typography variant="label">Bloqueo biométrico</Typography>
            <Switch
              value={biometricsActive}
              disabled={!biometricsSupported}
              onValueChange={(enabled) => void handleToggleBiometrics(enabled)}
              accessibilityLabel="Activar bloqueo biométrico"
            />
          </View>
          <Typography variant="caption">
            {biometricsSupported
              ? 'Exige tu huella dactilar o reconocimiento facial al abrir la aplicación o tras 60 segundos de inactividad.'
              : 'Tu dispositivo no cuenta con hardware biométrico configurado en los ajustes del sistema.'}
          </Typography>
        </Card>

        {/* Politica de privacidad y datos */}
        <Card className="gap-3">
          <Typography variant="label">Privacidad garantizada</Typography>
          <Typography variant="caption">
            Tus presupuestos, cuentas, registros de gastos e ingresos viven exclusivamente en la
            base de datos local de tu teléfono.
          </Typography>
          <Typography variant="caption">
            No existen servidores recopilando tus hábitos financieros ni vendiendo tu información a
            terceros. La sincronización con Google se limita a la verificación segura de tu cuenta y
            licencia.
          </Typography>
        </Card>
      </View>

      <AlertDialog
        visible={errorNotice !== null}
        title="Biometría"
        message={errorNotice ?? ''}
        tone="danger"
        onClose={() => setErrorNotice(null)}
      />
    </Screen>
  )
}
