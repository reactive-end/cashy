/**
 * Tipos publicos de la molecula SegmentedControl.
 * Selector exclusivo de opciones cortas, generico sobre el tipo de valor.
 */

/** Opcion individual del control segmentado */
export interface SegmentOption<T extends string> {
  /** Valor interno asociado a la opcion */
  value: T
  /** Texto visible de la opcion */
  label: string
}

/** Propiedades del control segmentado */
export interface SegmentedControlProps<T extends string> {
  /** Opciones disponibles en orden de lectura */
  options: readonly SegmentOption<T>[]
  /** Valor seleccionado actualmente */
  value: T
  /** Callback al elegir una opcion distinta */
  onChange: (value: T) => void
}
