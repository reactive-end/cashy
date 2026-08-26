/**
 * Tipos de la molecula IncomeItem.
 */

/**
 * Propiedades del componente IncomeItem.
 */
export interface IncomeItemProps {
  /** Identificador para pruebas automatizadas */
  testID?: string
  /** Concepto o nombre de la fuente de ingreso */
  name: string
  /** Dia de cobro en el mes (1-31) */
  paydayDay: number
  /** Monto formateado en la moneda base activa */
  formattedAmount: string
  /** Monto original formateado cuando la moneda difiere de la base */
  formattedOriginalAmount?: string
  /** Indica si el ingreso ya fue registrado como cobrado en el mes */
  isConfirmed?: boolean
  /** Accion al presionar la fila para ver su detalle */
  onPress?: () => void
}
