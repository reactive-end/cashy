/**
 * Contrato de tipos para la molecula PaydayNoticeDialog.
 */

import type { Income } from '@src/types/domain'

export interface PaydayNoticeDialogProps {
  /** Visibilidad del dialogo modal */
  visible: boolean
  /** Ingreso pendiente de confirmacion */
  income: Income | null
  /** Accion al confirmar que el ingreso fue recibido */
  onConfirm: () => void
  /** Accion al posponer o descartar la alerta */
  onDismiss: () => void
  /** true mientras persiste la confirmacion */
  loading?: boolean
}
