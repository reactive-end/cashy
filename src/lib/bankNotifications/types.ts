/**
 * Tipos de dominio para la deteccion y parseo de notificaciones de pago movil.
 * Modela las transacciones entrantes detectadas en las notificaciones del
 * dispositivo, sin importar el banco emisor.
 */

import type { Currency } from '@src/types/domain'

/** Bancos reconocibles en el texto de la notificacion */
export type BankCode = 'banesco' | 'bdv' | 'bnc' | 'bbva' | 'generic'

/** Tipos de operaciones bancarias reconocibles */
export type BankOperationType = 'incoming_pago_movil'

/** Estructura de una notificacion de pago movil parseada */
export interface ParsedBankNotification {
  /** Codigo del banco emisor detectado en el texto */
  bank: BankCode
  /** Nombre comercial amigable del banco */
  bankName: string
  /** Tipo de operacion detectada */
  operationType: BankOperationType
  /** Monto extraido en decimales (ej. 10000.0) */
  amount: number
  /** Monto en centavos para operaciones precisas (ej. 1000000) */
  amountCents: number
  /** Moneda de la transaccion (por defecto VES) */
  currency: Currency
  /** Remitente o telefono de origen si esta disponible */
  sender?: string
  /** Numero de referencia u operacion si esta disponible */
  reference?: string
  /** Titulo original de la notificacion */
  rawTitle: string
  /** Cuerpo original de la notificacion */
  rawBody: string
  /** Marca de tiempo de deteccion en formato ISO */
  detectedAt: string
}
