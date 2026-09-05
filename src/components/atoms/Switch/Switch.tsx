/**
 * Atomo Switch: interruptor binario del sistema de diseno.
 * Envuelve el Switch de React Native con la paleta del proyecto
 * y etiqueta de accesibilidad obligatoria.
 */

import { Switch as ReactSwitch } from 'react-native'

import { useTheme } from '@src/hooks/useTheme'

import type { SwitchProps } from './Switch.d'

/**
 * Renderiza el interruptor con colores de marca.
 * @param value Estado actual del interruptor
 * @param onValueChange Accion al alternar
 * @param disabled Bloquea la interaccion y atenua el control
 * @param accessibilityLabel Etiqueta que describe su funcion
 * @returns Interruptor para tarjetas de ajustes y formularios
 */
export function Switch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel
}: SwitchProps) {
  const { colors } = useTheme()

  return (
    <ReactSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.line, true: colors.accent }}
      thumbColor={colors.card}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
    />
  )
}
