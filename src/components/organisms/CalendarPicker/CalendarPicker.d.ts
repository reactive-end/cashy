/**
 * Tipos publicos del organismo CalendarPicker.
 * Selector de fechas propio del proyecto, reemplazo del
 * DateTimePicker nativo para mantener la estetica minimalista.
 */

/** Modo de seleccion del calendario: dia especifico o mes/ano completo */
export type CalendarPickerMode = 'day' | 'month'

/** Propiedades del calendario de seleccion */
export interface CalendarPickerProps {
  /** Fecha inicialmente marcada en formato ISO yyyy-mm-dd o yyyy-mm */
  value?: string
  /** Fecha minima seleccionable en formato ISO yyyy-mm-dd */
  minimumDate?: string
  /** Modo de seleccion del calendario (por defecto 'day') */
  mode?: CalendarPickerMode
  /** Callback al elegir un dia o mes; entrega la fecha como yyyy-mm-dd o yyyy-mm */
  onChange: (isoValue: string) => void
}
