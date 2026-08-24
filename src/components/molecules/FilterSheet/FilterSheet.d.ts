/**
 * Tipos publicos de la molecula FilterSheet.
 */

import type { Currency } from '@src/types/domain'

/** Criterios de filtro aplicables al listado de gastos */
export interface FiltrosGastos {
  /** Categorias seleccionadas; vacio significa todas */
  categorias: string[]
  /** Monedas seleccionadas; vacio significa todas */
  monedas: Currency[]
}

/** Criterios de ordenacion del listado */
export type OrdenGastos = 'recientes' | 'montoDesc' | 'montoAsc' | 'nombre'

/** Propiedades del panel de filtros de gastos */
export interface FilterSheetProps {
  /** Controla la visibilidad del panel */
  visible: boolean
  /** Catalogo de categorias existentes para los chips */
  categorias: string[]
  /** Catalogo de monedas existentes para los chips */
  monedas: Currency[]
  /** Filtros aplicados actualmente; sirven de valor inicial */
  filtros: FiltrosGastos
  /** Orden aplicado actualmente */
  orden: OrdenGastos
  /** Confirma la seleccion de filtros y orden */
  onAplicar: (filtros: FiltrosGastos, orden: OrdenGastos) => void
  /** Cierra el panel sin aplicar cambios */
  onClose: () => void
}
