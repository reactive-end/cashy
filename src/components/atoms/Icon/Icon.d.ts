/**
 * Public types of the Icon atom.
 * Centralizes the available icon names for the whole application.
 */

import type { ColorValue } from 'react-native'

import type { ThemeColors } from '@src/constants/theme'

/** Catalogo de iconos outlined disponibles (lucide-react-native) */
export type IconName =
  | 'home'
  | 'expenses'
  | 'settings'
  | 'add'
  | 'minus'
  | 'calendar'
  | 'bell'
  | 'dollar'
  | 'euro'
  | 'usdt'
  | 'edit'
  | 'trash'
  | 'back'
  | 'close'
  | 'check'
  | 'alert'
  | 'refresh'
  | 'tag'
  | 'repeat'
  | 'savings'
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronDown'
  | 'search'
  | 'chart'
  | 'filter'
  | 'calculator'
  | 'clock'
  | 'wallet'
  | 'user'
  | 'copy'
  | 'eye'
  | 'eyeOff'
  | 'lock'
  | 'shield'
  | 'shoppingBag'
  | 'building'
  | 'info'
  | 'moon'
  | 'sun'
  | 'laptop'

/** Nombres de tokens semanticos de color disponibles para el icono */
export type IconSemanticColor = keyof ThemeColors

/** Propiedades del atomo Icon */
export interface IconProps {
  /** Identificador del icono dentro del catalogo */
  name: IconName
  /** Lado del icono en pixeles (por defecto 20) */
  size?: number
  /** Color del trazo: token semantico ('ink', 'muted', 'accent'...) o ColorValue nativo */
  color?: IconSemanticColor | ColorValue
  /** Grosor del trazo outlined (por defecto 1.75, estilo fino) */
  strokeWidth?: number
}
