/**
 * Tipos publicos del organismo PaymentComparator.
 */

import type { BaseCurrency, ExchangeRates } from '@src/types/domain'

export interface PaymentComparatorProps {
  /** Snapshot de tasas de cambio del dia (null mientras carga) */
  rates: ExchangeRates | null
  /** Moneda base configurada para unificar los calculos */
  baseCurrency: BaseCurrency
  /** Identificador para pruebas */
  testID?: string
}
