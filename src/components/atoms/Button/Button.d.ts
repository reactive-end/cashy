/**
 * Tipos publicos del atomo Button.
 * Boton principal del sistema con variantes y estados.
 */

import type { GestureResponderEvent } from 'react-native'

import type { IconName } from '@src/components/atoms/Icon/Icon.d'

/** Variantes visuales del boton */
export type ButtonVariant =
  /** Relleno verde acento: accion primaria de la pantalla */
  | 'primary'
  /** Borde fino sobre blanco: accion secundaria */
  | 'secondary'
  /** Solo texto: acciones terciarias o de cancelacion */
  | 'ghost'
  /** Rojo suave: acciones destructivas como eliminar */
  | 'danger'

/** Tamanos disponibles del boton */
export type ButtonSize = 'medium' | 'large'

/** Propiedades del atomo Button */
export interface ButtonProps {
  /** Texto visible dentro del boton */
  label: string
  /** Accion al pulsar; recibe el evento nativo y no se invoca si esta inactivo */
  onPress?: (event: GestureResponderEvent) => void
  /** Variante visual; por defecto primario */
  variant?: ButtonVariant
  /** Tamano del boton; por defecto mediano */
  size?: ButtonSize
  /** Icono outlined mostrado antes de la etiqueta */
  icon?: IconName
  /** Bloquea interaccion y atenue el boton */
  disabled?: boolean
  /** Reemplaza la etiqueta por un estado ocupado */
  loading?: boolean
  /** Estira el boton a todo el ancho disponible */
  fullWidth?: boolean
}
