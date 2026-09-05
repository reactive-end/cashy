/**
 * Subpantalla de Ajustes: Tema y Apariencia.
 * Permite alternar entre deteccion de sistema, modo claro y modo oscuro estilo OpenCode.
 */

import { useRouter } from 'expo-router'
import { Pressable, View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { useTheme } from '@src/hooks/useTheme'
import type { ThemePreference } from '@src/types/domain'

/** Opciones de control segmentado para la preferencia de tema */
const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' }
]

/**
 * Pantalla de configuracion de tema visual.
 * @returns Vista para seleccionar tema de la app
 */
export default function ThemeSettings() {
  const router = useRouter()
  const { preference, setPreference, mode, colors } = useTheme()

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
            <Icon name="back" size={20} color={colors.ink} />
          </Pressable>
          <Typography variant="display">Tema y Apariencia</Typography>
        </View>

        {/* Selector de preferencia de tema */}
        <Card className="gap-3">
          <Typography variant="label">Preferencia visual</Typography>
          <Typography variant="caption">
            Elige si prefieres que la aplicación siga automáticamente el tema de tu dispositivo o
            forzar un modo permanente.
          </Typography>

          <SegmentedControl
            options={THEME_OPTIONS}
            value={preference}
            onChange={(selected) => void setPreference(selected as ThemePreference)}
          />

          <View className="rounded-xl border border-line bg-paper p-3 mt-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Icon
                name={preference === 'system' ? 'laptop' : preference === 'dark' ? 'moon' : 'sun'}
                size={16}
                color={colors.accent}
              />
              <Typography variant="caption" className="font-semibold text-ink">
                {preference === 'system'
                  ? `Automático (${mode === 'dark' ? 'Oscuro activo' : 'Claro activo'})`
                  : preference === 'dark'
                    ? 'Modo Oscuro (Estilo OpenCode)'
                    : 'Modo Claro'}
              </Typography>
            </View>
            <Typography variant="caption" className="text-muted">
              {preference === 'system'
                ? 'Se adapta automáticamente según el tema configurado en el sistema operativo de tu teléfono.'
                : preference === 'dark'
                  ? 'Fondo negro profundo con bordes finos, tarjetas oscuras elevadas y acento verde esmeralda de alto contraste.'
                  : 'Fondo de papel marfil con tarjetas claras, contrastes suaves y tonos equilibrados.'}
            </Typography>
          </View>
        </Card>
      </View>
    </Screen>
  )
}
