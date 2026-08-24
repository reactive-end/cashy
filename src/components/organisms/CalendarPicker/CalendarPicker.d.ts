/**
 * Tipos publicos del organismo CalendarPicker.
 * Selector de fechas propio del proyecto, reemplazo del
 * DateTimePicker nativo para mantener la estetica minimalista.
 */

/** Propiedades del calendario de seleccion */
export interface CalendarPickerProps {
  /** Fecha inicialmente marcada en formato ISO yyyy-mm-dd */
  value?: string
  /** Fecha minima seleccionable en formato ISO yyyy-mm-dd */
  minimumDate?: string
  /** Callback al elegir un dia; entrega la fecha como yyyy-mm-dd */
  onChange: (isoDate: string) => void
}
