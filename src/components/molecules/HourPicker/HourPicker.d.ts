/**
 * Tipos publicos de la molecula HourPicker.
 * Selector de hora del dia (0-23) con modal propio del proyecto.
 */

/** Propiedades de la molecula HourPicker */
export interface HourPickerProps {
  /** Hora seleccionada en formato 24 horas (0-23) */
  value: number
  /** Accion al elegir una hora de la lista */
  onChange: (hour: number) => void
  /** Bloquea la apertura del selector y atenua el campo */
  disabled?: boolean
  /** Etiqueta de accesibilidad del campo presionable */
  accessibilityLabel: string
}
