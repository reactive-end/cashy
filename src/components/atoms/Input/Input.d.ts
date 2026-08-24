/**
 * Tipos publicos del atomo Input.
 * Campo de texto etiquetado del sistema de formularios.
 */

/** Propiedades del atomo Input */
export interface InputProps {
  /** Etiqueta visible sobre el campo */
  label: string
  /** Valor controlado del campo */
  value: string
  /** Callback invocado con cada cambio de texto */
  onChangeText: (text: string) => void
  /** Texto guía cuando el campo esta vacio */
  placeholder?: string
  /** Muestra teclado numerico decimal (montos) */
  numeric?: boolean
  /** Texto fijo mostrado antes del contenido (ejemplo Bs.) */
  prefix?: string
  /** Mensaje de validacion; su presencia marca el campo con error */
  errorMessage?: string
  /** Permite varias lineas (notas) */
  multiline?: boolean
  /** Deshabilita edicion y atenua el campo */
  disabled?: boolean
  /** Identificador de prueba para automatizacion E2E */
  testID?: string
}
