/**
 * Tipos publicos del organismo CategoryBreakdown.
 */

/** Elemento agregado por categoria para el desglose grafico */
export interface CategoriaGrafica {
  /** Nombre de la categoria o Sin categoria */
  nombre: string
  /** Monto total ya formateado en moneda base */
  montoFormateado: string
  /** Porcentaje respecto al total general (0 a 100) */
  pct: number
}

/** Propiedades del desglose de gastos por categoria */
export interface CategoryBreakdownProps {
  /** Categorias ordenadas por monto descendente */
  items: CategoriaGrafica[]
  /** true mientras las tasas aun no estan disponibles */
  loading?: boolean
}
