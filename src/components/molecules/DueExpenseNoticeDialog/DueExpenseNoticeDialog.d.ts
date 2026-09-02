/**
 * Contrato de tipos para la molecula DueExpenseNoticeDialog.
 */

import type { Expense } from '@src/types/domain'

export interface DueExpenseNoticeDialogProps {
  /** Visibilidad del dialogo modal */
  visible: boolean
  /** Gasto fijo pendiente de pago */
  expense: Expense | null
  /** Accion al confirmar que el gasto fue pagado */
  onConfirm: () => void
  /** Accion al posponer o descartar la alerta */
  onDismiss: () => void
  /** true mientras persiste la confirmacion */
  loading?: boolean
}
