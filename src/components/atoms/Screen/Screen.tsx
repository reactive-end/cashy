/**
 * Atomo Screen: envoltorio comun de pantallas.
 * Aplica area segura, fondo papel, padding uniforme y soporta
 * pull-to-refresh con RefreshControl y overlay para avisos.
 */

import { RefreshControl, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@src/hooks/useTheme'

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
  const { colors } = useTheme()
  const contentClasses = `${noPadding ? '' : 'px-5'} ${className ?? ''}`
  const bottomInsetStyle = {
    paddingTop: insets.top,
    paddingBottom: Math.max(insets.bottom, 16)
  }

  const refreshControlNode = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.accent}
      colors={[colors.accent]}
      progressBackgroundColor={colors.card}
    />
  ) : undefined

  if (scrollable) {
    return (
      <View className="flex-1 bg-paper">
        <ScrollView
          className="flex-1"
          contentContainerClassName={`grow ${contentClasses}`}
          contentContainerStyle={bottomInsetStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControlNode}
        >
          {children}
        </ScrollView>

        {overlay}
      </View>
    )
  }

  return (
    <View className="flex-1 bg-paper">
      <View className={`flex-1 ${contentClasses}`} style={bottomInsetStyle}>
        {children}
      </View>

      {overlay}
    </View>
  )
}
