/**
 * Tipos publicos del organismo BankPaymentNoticeDialog.
 * Dialogo modal interactivo para consultar al usuario si desea registrar
 * una notificacion de pago movil detectada como ingreso unico.
 */

import type { ParsedBankNotification } from '@src/lib/bankNotifications'
import type { BaseCurrency, ExchangeRates } from '@src/types/domain'

/** Propiedades del componente BankPaymentNoticeDialog */
export interface BankPaymentNoticeDialogProps {
  /** Notificacion bancaria activa a confirmar o null */
  notification: ParsedBankNotification | null
  /** Si el modal esta visible */
  visible: boolean
  /** Tasas de cambio vigentes para calcular conversion */
  rates: ExchangeRates | null
  /** Moneda base configurada (USD) */
  baseCurrency: BaseCurrency
  /** Callback al confirmar con el concepto editado o sugerido */
  onConfirm: (customName: string) => void
  /** Callback al descartar la notificacion */
  onDismiss: () => void
  /** Estado de carga mientras se persiste en base de datos */
  loading?: boolean
}
