/**
 * Atomo Screen: envoltorio comun de pantallas.
 * Aplica area segura, fondo papel, padding uniforme y soporta
 * pull-to-refresh con RefreshControl y overlay para avisos.
 */

import { RefreshControl, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { COLORS } from '@src/constants/theme'

import type { ScreenProps } from './Screen.d'

/**
 * Renderiza el contenedor base de una pantalla con insets seguros.
 * @param props children, modo scroll, refresco y overlay flotante
 * @returns Layout raiz consistente en todas las pestañas
 */
export function Screen({
  children,
  scrollable = false,
  noPadding = false,
  className,
  onRefresh,
  refreshing = false,
  overlay
}: ScreenProps) {
  const insets = useSafeAreaInsets()
  const clasesContenido = `${noPadding ? '' : 'px-5'} ${className ?? ''}`
  const estiloInferior = { paddingBottom: Math.max(insets.bottom, 16) }

  const controlRefresco = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={COLORS.accent}
      colors={[COLORS.accent]}
      progressBackgroundColor={COLORS.card}
    />
  ) : undefined

  if (scrollable) {
    return (
      <View className="flex-1 bg-paper">
        <ScrollView
          className="flex-1"
          contentContainerClassName={`grow ${clasesContenido}`}
          contentContainerStyle={estiloInferior}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={controlRefresco}
        >
          {children}
        </ScrollView>

        {overlay}
      </View>
    )
  }

  return (
    <View className="flex-1 bg-paper">
      <View className={`flex-1 ${clasesContenido}`} style={estiloInferior}>
        {children}
      </View>

      {overlay}
    </View>
  )
}
