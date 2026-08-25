/**
 * Atomo Switch: interruptor binario del sistema de diseno.
 * Envuelve el Switch de React Native con la paleta del proyecto
 * y etiqueta de accesibilidad obligatoria.
 */

import { Switch as ReactSwitch } from 'react-native'

import { COLORS } from '@src/constants/theme'

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
  return (
    <ReactSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: COLORS.line, true: COLORS.accent }}
      thumbColor={COLORS.card}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
    />
  )
}
