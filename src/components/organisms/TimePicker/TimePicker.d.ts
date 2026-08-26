/**
 * Tipos publicos del organismo TimePicker.
 * Selector de hora y minuto en forma de reloj analogico propio
 * del proyecto, reemplazando listas y pickers nativos del sistema.
 */

/** Propiedades del organismo TimePicker */
export interface TimePickerProps {
  /** Hora seleccionada en formato 24 horas (0-23) */
  hour: number
  /** Minuto seleccionado de la hora (0-59) */
  minute: number
  /** Accion al confirmar hora y minuto elegidos en el reloj */
  onChange: (hour: number, minute: number) => void
  /** Bloquea la apertura del selector y atenua el campo */
  disabled?: boolean
  /** Etiqueta de accesibilidad del campo presionable */
  accessibilityLabel: string
}
