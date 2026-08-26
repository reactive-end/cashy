/**
 * Tipos publicos de la molecula MoneyInput.
 */

/** Propiedades del campo de monto cents-first */
export interface MoneyInputProps {
  /** Simbolo de la moneda mostrado como prefijo */
  symbol: string
  /** Notifica los centavos normalizados tras cada cambio del campo */
  onCents: (cents: number) => void
  /** testID para pruebas automatizadas */
  testID?: string
}
