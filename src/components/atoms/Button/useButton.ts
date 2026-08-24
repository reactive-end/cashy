/**
 * Logica del atomo Button: derivacion de clases visuales.
 * Centraliza la combinacion variante + tamano + estado para
 * mantener la vista declarativa y facil de leer.
 */

import { useCallback } from 'react'
import type { GestureResponderEvent } from 'react-native'

import { COLORS } from '@src/constants/theme'

import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.d'

/** Clases base compartidas por todas las variantes */
const BASE_CLASSES = 'flex-row items-center justify-center rounded-xl border active:opacity-80'

/** Clases de color por variante (contenedor y contenido) */
const CLASSES_BY_VARIANT: Readonly<Record<ButtonVariant, string>> = {
  primary: 'bg-accent border-accent',
  secondary: 'bg-card border-line',
  ghost: 'bg-transparent border-transparent',
  danger: 'bg-danger-soft border-danger-soft'
}

/** Color hex del icono por variante (lucide no hereda clases) */
const ICON_HEX_COLOR: Readonly<Record<ButtonVariant, string>> = {
  primary: COLORS.paper,
  secondary: COLORS.ink,
  ghost: COLORS.muted,
  danger: COLORS.danger
}

/** Color de texto por variante */
const TEXT_COLOR: Readonly<Record<ButtonVariant, string>> = {
  primary: 'text-paper',
  secondary: 'text-ink',
  ghost: 'text-muted',
  danger: 'text-danger'
}

/** Padding horizontal y vertical por tamano */
const CLASSES_BY_SIZE: Readonly<Record<ButtonSize, string>> = {
  medium: 'px-4 py-2.5 gap-1.5',
  large: 'px-5 py-3.5 gap-2'
}

/** Subconjunto de ButtonProps que consume el hook */
type OpcionesUseButton = Pick<
  ButtonProps,
  'variant' | 'size' | 'disabled' | 'loading' | 'fullWidth' | 'onPress'
>

/**
 * Calcula las clases finales del boton segun sus propiedades.
 * @param props Subconjunto visual del boton (sin etiqueta ni icono)
 * @returns Clases contenedor, clases texto, color de icono y manejador seguro
 */
export function useButton({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  onPress
}: OpcionesUseButton): {
  containerClasses: string
  textClasses: string
  iconColor: string
  handlePress: (event: GestureResponderEvent) => void
} {
  const inactivo = disabled || loading

  const containerClasses = [
    BASE_CLASSES,
    CLASSES_BY_VARIANT[variant],
    CLASSES_BY_SIZE[size],
    TEXT_COLOR[variant],
    fullWidth ? 'w-full' : 'self-start',
    inactivo ? 'opacity-50' : ''
  ]
    .filter(Boolean)
    .join(' ')

  const textClasses = `font-sans-semibold text-[15px] ${TEXT_COLOR[variant]}`

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (!inactivo) onPress?.(event)
    },
    [inactivo, onPress]
  )

  return { containerClasses, textClasses, iconColor: ICON_HEX_COLOR[variant], handlePress }
}
