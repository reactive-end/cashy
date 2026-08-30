/**
 * Tipos de dominio para la deteccion y parseo de notificaciones bancarias.
 * Modela las operaciones entrantes (como pago movil) detectadas en el dispositivo.
 */

import type { Currency } from '@src/types/domain'

/** Identificadores de bancos soportados */
export type BankCode = 'bnc' | 'generic'

/** Tipos de operaciones bancarias reconocibles */
export type BankOperationType = 'incoming_pago_movil'

/** Estructura de una notificacion bancaria parseada */
export interface ParsedBankNotification {
  /** Codigo del banco emisor */
  bank: BankCode
  /** Nombre comercial amigable del banco */
  bankName: string
  /** Tipo de operacion detectada */
  operationType: BankOperationType
  /** Monto extraido en decimales (ej. 10000.00) */
  amount: number
  /** Monto en centavos para operaciones precisas (ej. 1000000) */
  amountCents: number
  /** Moneda de la transaccion (por defecto VES) */
  currency: Currency
  /** Identificador o telefono del remitente si esta disponible */
  sender?: string
  /** Numero de referencia si esta disponible */
  reference?: string
  /** Titulo original de la notificacion */
  rawTitle: string
  /** Cuerpo original de la notificacion */
  rawBody: string
  /** Marca de tiempo de deteccion */
  detectedAt: string
}
