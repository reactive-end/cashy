/**
 * Tipos publicos del organismo MonthlySummary.
 */

import type { BaseCurrency, MonthlySummary } from '@src/types/domain'

/** Propiedades de la tarjeta resumen del mes */
export interface MonthlySummaryProps {
  /** Resumen agregado calculado por useExpenses; null mientras no haya tasas */
  summary: MonthlySummary | null
  /** Moneda en la que se expresan los totales */
  baseCurrency: BaseCurrency
  /** true mientras las tasas del dia aun no estan disponibles */
  loading?: boolean
}
