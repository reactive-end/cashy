/**
 * Tipos publicos del organismo UpcomingPayments.
 * Lista de vencimientos fijos dentro del horizonte de siete dias.
 */

import type { UpcomingPayment } from '@src/types/domain'

/** Propiedades de la seccion de proximos pagos */
export interface UpcomingPaymentsProps {
  /** Pagos ordenados por cercania del vencimiento */
  payments: UpcomingPayment[]
  /** Accion al tocar un pago; recibe el id del gasto */
  onPaymentPress?: (expenseId: string) => void
}
