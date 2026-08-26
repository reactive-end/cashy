/**
 * Tipos publicos del organismo IncomesTable.
 * Tabla de fuentes de ingreso con acciones de edicion y borrado.
 */

import type { Income } from '@src/types/domain'

/** Propiedades del organismo IncomesTable */
export interface IncomesTableProps {
  /** Listado vigente de ingresos del usuario */
  incomes: readonly Income[]
  /** Accion al pulsar editar sobre una fila */
  onEdit: (id: string) => void
  /** Accion al pulsar eliminar sobre una fila */
  onRemove: (id: string) => void
  /** testID base para las filas (sufijo numerico por posicion) */
  testIDBase?: string
}
