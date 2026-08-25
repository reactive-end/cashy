/**
 * Tipos publicos del atomo Switch.
 * Interruptor binario propio sobre el Switch de React Native.
 */

/** Propiedades del atomo Switch */
export interface SwitchProps {
  /** Estado actual del interruptor */
  value: boolean
  /** Accion al alternar; recibe el nuevo estado */
  onValueChange: (newValue: boolean) => void
  /** Bloquea la interaccion y atenua el control */
  disabled?: boolean
  /** Etiqueta de accesibilidad que describe su funcion */
  accessibilityLabel: string
}
