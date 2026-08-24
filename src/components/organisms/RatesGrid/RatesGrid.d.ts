/**
 * Tipos publicos del organismo RatesGrid.
 * Cuadricula de tasas del dia con refresco manual y estado de error.
 */

import type { UseRatesResult } from '@src/hooks/useRates'

/** Propiedades de la cuadricula de tasas */
export interface RatesGridProps {
  /** Estado completo del hook de tasas (datos, carga, error, refresco) */
  ratesState: UseRatesResult
}
