/**
 * Tipos publicos del organismo IncomesPanel.
 * Panel de ingresos con resumen mensual, tabla de fuentes y
 * estados de carga/vacio para la pestana de finanzas.
 */

import type { BaseCurrency, Income } from '@src/types/domain'

/** Propiedades del organismo IncomesPanel */
export interface IncomesPanelProps {
  /** Listado vigente de ingresos del usuario */
  incomes: readonly Income[]
  /** Total mensual estimado convertido a moneda base; null sin tasas */
  monthlyTotal: number | null
  /** Total efectivamente cobrado en el mes en moneda base; null sin tasas */
  confirmedTotal?: number | null
  /** Ingresos pendientes de confirmacion de cobro */
  pendingConfirmations?: readonly Income[]
  /** Moneda base en que se expresa el resumen */
  baseCurrency: BaseCurrency
  /** true durante la primera lectura de datos */
  loading: boolean
  /** Accion al pulsar el boton principal de agregar */
  onAdd: () => void
  /** Accion al pulsar editar sobre una fila */
  onEdit: (income: Income) => void
  /** Accion al pulsar eliminar sobre una fila */
  onRemove: (id: string) => void
  /** Accion para confirmar el cobro de un ingreso pendiente */
  onConfirmReceipt?: (income: Income) => void
}
