/**
 * Parser de notificaciones para Banco Nacional de Credito (BNC).
 * Reconoce notificaciones de pago movil entrante y extrae monto,
 * moneda y telefono de origen.
 */

import type { ParsedBankNotification } from '../types'

/** Expresion para identificar si la notificacion corresponde a pago movil BNC */
const BNC_PAGO_MOVIL_REGEX = /pago\s+m[oó]vil\s+recibido/i

/** Expresion para capturar montos en bolivares (ej. Bs. 10000,00 o Bs. 10.000,00) */
const AMOUNT_REGEX = /Bs\.?\s*([0-9]{1,3}(?:\.[0-9]{3})+,[0-9]{1,2}|[0-9]+(?:,[0-9]{1,2})?)/i

/** Expresion para capturar telefono o identificador de origen */
const SENDER_REGEX = /(?:Telf|Tel|T[eé]lefono)\.?\s*([0-9*+\s]{7,15})/i

/** Expresion para capturar numero de referencia si existe */
const REFERENCE_REGEX = /(?:Ref|Referencia)\.?\s*([0-9A-Za-z]{4,20})/i

/**
 * Normaliza una cadena de monto venezolano a numero flotante.
 * Soporta formatos con coma decimal como "10000,00" o "10.000,00".
 * @param raw Texto crudo del monto
 * @returns Numero flotante o null si es invalido
 */
export function parseBolivarAmount(raw: string): number | null {
  const cleaned = raw.trim()
  if (!cleaned) return null

  // Si contiene coma, los puntos son miles y la coma es decimal
  let normalized = cleaned
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  }

  const parsed = parseFloat(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/**
 * Parsea una notificacion entrante del BNC.
 * @param title Titulo de la notificacion
 * @param body Contenido de la notificacion
 * @param packageName Nombre del paquete Android si esta disponible
 * @returns Notificacion parseada o null si no coincide con un pago movil del BNC
 */
export function parseBncNotification(
  title: string,
  body: string,
  packageName?: string
): ParsedBankNotification | null {
  const fullText = `${title} ${body}`

  // Verificar pertenencia al BNC
  const isBnc = packageName?.toLowerCase().includes('bnc') || fullText.toLowerCase().includes('bnc')

  if (!isBnc) return null

  // Verificar que sea un pago movil recibido
  const isPagoMovil = BNC_PAGO_MOVIL_REGEX.test(title) || BNC_PAGO_MOVIL_REGEX.test(body)

  if (!isPagoMovil) return null

  // Extraer monto
  const amountMatch = body.match(AMOUNT_REGEX) ?? title.match(AMOUNT_REGEX)
  if (!amountMatch) return null

  const amount = parseBolivarAmount(amountMatch[1])
  if (amount === null) return null

  // Extraer remitente
  const senderMatch = body.match(SENDER_REGEX) ?? title.match(SENDER_REGEX)
  const sender = senderMatch ? senderMatch[1].trim().replace(/\.+$/, '') : undefined

  // Extraer referencia
  const refMatch = body.match(REFERENCE_REGEX) ?? title.match(REFERENCE_REGEX)
  const reference = refMatch ? refMatch[1].trim() : undefined

  return {
    bank: 'bnc',
    bankName: 'BNC',
    operationType: 'incoming_pago_movil',
    amount,
    amountCents: Math.round(amount * 100),
    currency: 'VES',
    sender,
    reference,
    rawTitle: title,
    rawBody: body,
    detectedAt: new Date().toISOString()
  }
}
