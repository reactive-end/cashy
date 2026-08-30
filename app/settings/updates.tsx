/**
 * Subpantalla de Ajustes: Actualizaciones.
 * Informa sobre la version instalada y comprueba nuevas versiones via EAS Update o GitHub.
 */

import { useRouter } from 'expo-router'
import * as Updates from 'expo-updates'
import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog, type AlertDialogTone } from '@src/components/molecules/AlertDialog'
import { installedVersion } from '@src/services/appUpdate'

export default function UpdatesSettings() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState<{ tone: AlertDialogTone; message: string } | null>(null)

  async function handleCheckUpdates(): Promise<void> {
    if (!Updates.isEnabled) {
      setNotice({
        tone: 'danger',
        message:
          'Las actualizaciones OTA no están disponibles en este entorno (Expo Go o desarrollo local).'
      })
      return
    }

    setChecking(true)
    try {
      const check = await Updates.checkForUpdateAsync()
      if (!check.isAvailable) {
        setNotice({ tone: 'success', message: 'Ya tienes la última versión instalada.' })
        return
      }

      await Updates.fetchUpdateAsync()
      setNotice({
        tone: 'success',
        message: 'Actualización descargada con éxito. Se aplicará la próxima vez que abras Cashy.'
      })
    } catch {
      setNotice({
        tone: 'danger',
        message: 'No se pudo verificar actualizaciones. Comprueba tu conexión a internet.'
      })
    } finally {
      setChecking(false)
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
          <Typography variant="display">Actualizaciones</Typography>
        </View>

        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Typography variant="label">Versión instalada</Typography>
            <View className="rounded-full bg-accent-soft px-2.5 py-0.5">
              <Typography variant="caption" className="font-semibold text-accent">
                v{installedVersion() || '1.1.0'}
              </Typography>
            </View>
          </View>

          <Typography variant="caption">
            Las correcciones críticas de la aplicación se descargan automáticamente en segundo
            plano; las nuevas versiones con cambios nativos se publican a través de GitHub Releases.
          </Typography>

          <Button
            label="Buscar actualizaciones ahora"
            variant="secondary"
            icon="refresh"
            loading={checking}
            fullWidth
            onPress={() => void handleCheckUpdates()}
          />
        </Card>
      </View>

      <AlertDialog
        visible={notice !== null}
        title="Actualizaciones"
        message={notice?.message ?? ''}
        tone={notice?.tone ?? 'success'}
        onClose={() => setNotice(null)}
      />
    </Screen>
  )
}
