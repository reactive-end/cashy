/**
 * Tipos publicos de la molecula FilterSheet.
 * Panel modal de filtros para el listado de gastos.
 */

import type { Currency } from '@src/types/domain'

/** Criterios de ordenacion disponibles para el listado */
export type ExpenseSortOrder = 'recent' | 'amountDesc' | 'amountAsc' | 'name'

/** Filtros activos del listado de gastos */
export interface ExpenseFilters {
  categories: string[]
  currencies: Currency[]
}

/** Propiedades de la molecula FilterSheet */
export interface FilterSheetProps {
  /** Controla la visibilidad del panel */
  visible: boolean
  /** Catalogo de categorias presentes en los datos */
  categories: string[]
  /** Catalogo de monedas presentes en los datos */
  currencies: Currency[]
  /** Filtros actualmente aplicados */
  filters: ExpenseFilters
  /** Orden actualmente aplicado */
  sortOrder: ExpenseSortOrder
  /** Aplica el nuevo conjunto de filtros y orden */
  onApply: (filters: ExpenseFilters, sortOrder: ExpenseSortOrder) => void
  /** Cierra el panel sin aplicar cambios */
  onClose: () => void
}
