/**
 * Tipos publicos del organismo CategoryBreakdown.
 */

/** Elemento agregado por categoria para el desglose grafico */
export interface ChartCategory {
  /** Nombre de la categoria o Sin categoria */
  name: string
  /** Monto total ya formateado en moneda base */
  formattedAmount: string
  /** Porcentaje respecto al total general (0 a 100) */
  pct: number
}

/** Propiedades del desglose de gastos por categoria */
export interface CategoryBreakdownProps {
  /** Categorias ordenadas por monto descendente */
  items: ChartCategory[]
  /** true mientras las tasas aun no estan disponibles */
  loading?: boolean
}
