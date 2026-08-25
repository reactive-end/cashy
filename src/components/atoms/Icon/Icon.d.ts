/**
 * Public types of the Icon atom.
 * Centralizes the available icon names for the whole application.
 */

import type { ColorValue } from 'react-native'

/** Catalogo de iconos outlined disponibles (lucide-react-native) */
export type IconName =
  | 'home'
  | 'expenses'
  | 'settings'
  | 'add'
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
  | 'search'
  | 'chart'
  | 'filter'
  | 'calculator'
  | 'clock'

/** Propiedades del atomo Icon */
export interface IconProps {
  /** Identificador del icono dentro del catalogo */
  name: IconName
  /** Lado del icono en pixeles (por defecto 20) */
  size?: number
  /** Color del trazo; hereda el color del texto si se omite */
  color?: ColorValue
  /** Grosor del trazo outlined (por defecto 1.75, estilo fino) */
  strokeWidth?: number
}
