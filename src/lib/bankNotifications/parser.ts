/**
 * Parser de notificaciones de pago movil basado en patron.
 * Una notificacion califica cuando el texto contiene "Pago movil",
 * con o sin espacio y sin importar acentos ni mayusculas, de modo
 * que cubre avisos de Banesco, Banco de Venezuela, BNC, BBVA
 * Provincial y cualquier otro banco venezolano sin configuracion.
 */

import type { BankCode, ParsedBankNotification } from './types'

/** Patron de deteccion sobre texto normalizado: "pago movil" y "pagomovil" */
const PAGO_MOVIL_PATTERN = /pago\s*movil/

/** Patron del monto tras el literal Bs: Bs. 1900.0, Bs.10000,00, Bs. 30,206.00 */
const AMOUNT_PATTERN = /bs\.?\s*([0-9][0-9.,]*)/i

/**
 * Patron del remitente entre "de ... por Bs" (ej. "de JESUS PEREZ por Bs").
 * Exige palabras iniciadas en mayuscula para no confundir el remitente
 * con frases previas del mensaje (ej. "traves de Pago Movil de...") y
 * admite iniciales de una sola letra (ej. "MEJIA B").
 */
const SENDER_PATTERN =
  /\bde\s+([A-ZÑÁÉÍÓÚÜ][A-Za-zÑñÁÉÍÓÚÜáéíóúü.]*(?:\s+[A-ZÑÁÉÍÓÚÜ][A-Za-zÑñÁÉÍÓÚÜáéíóúü.]*)*)\s+por\s+Bs/

/** Patron del telefono de origen (ej. Telf.0414***69) */
const PHONE_PATTERN = /t[eé]lf\.?\s*([0-9*+\s]{7,20})/i

/** Patrones de referencia u operacion segun el banco emisor */
const REFERENCE_PATTERNS: readonly RegExp[] = [
  /ref\.?\s*:?\s*([0-9]{4,20})/i,
  /operaci[oó]n\s*(?:n[uú]mero\s*)?([0-9]{4,20})/i
]

/**
 * Normaliza un texto para deteccion: minusculas y sin acentos.
 * @param text Texto crudo de la notificacion
 * @returns Texto en minusculas sin diacriticos
 */
export function normalizeNotificationText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * Indica si el texto de una notificacion corresponde a un pago movil.
 * @param text Texto crudo combinado de titulo y cuerpo
 * @returns true cuando contiene el patron de pago movil
 */
export function containsPagoMovil(text: string): boolean {
  return PAGO_MOVIL_PATTERN.test(normalizeNotificationText(text))
}

/**
 * Normaliza un monto en bolivares escrito en cualquier formato de
 * banco venezolano a numero decimal. Resuelve el separador decimal
 * segun la posicion relativa de punto y coma:
 * - Ambos presentes: el mas a la derecha es el decimal (1.760,00 / 30,206.00).
 * - Solo coma: decimal, salvo grupos exactos de tres (30,206 -> miles).
 * - Solo punto: decimal, salvo grupos exactos de tres (1.760 -> miles).
 * @param raw Texto crudo del monto capturado (ej. "1.760,00")
 * @returns Numero decimal positivo o null si es invalido
 */
export function parseBolivarAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/[.,]+$/, '')
  if (!cleaned) return null

  const hasComma = cleaned.includes(',')
  const hasDot = cleaned.includes('.')

  let normalized: string

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      normalized = cleaned.replace(/,/g, '')
    }
  } else if (hasComma) {
    normalized = /^\d{1,3}(,\d{3})+$/.test(cleaned) ? cleaned.replace(/,/g, '') : cleaned.replace(/,/g, '.')
  } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, '')
  } else {
    normalized = cleaned
  }

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/**
 * Detecta el banco emisor a partir del texto normalizado.
 * @param normalized Texto combinado en minusculas sin acentos
 * @returns Codigo y nombre comercial del banco o generico
 */
function detectBank(normalized: string): { code: BankCode; name: string } {
  if (normalized.includes('banesco')) return { code: 'banesco', name: 'Banesco' }
  if (normalized.includes('bbva') || normalized.includes('provincial')) {
    return { code: 'bbva', name: 'BBVA Provincial' }
  }
  if (normalized.includes('bdv') || normalized.includes('banco de venezuela')) {
    return { code: 'bdv', name: 'Banco de Venezuela' }
  }
  if (normalized.includes('bnc')) return { code: 'bnc', name: 'BNC' }

  return { code: 'generic', name: 'Banco' }
}

/**
 * Extrae el numero de referencia u operacion del texto.
 * @param text Cuerpo o titulo de la notificacion
 * @returns Referencia encontrada o undefined
 */
function extractReference(text: string): string | undefined {
  for (const pattern of REFERENCE_PATTERNS) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1]
  }

  return undefined
}

/**
 * Parsea una notificacion entrante de pago movil.
 * @param title Titulo original de la notificacion
 * @param body Cuerpo original de la notificacion
 * @returns Datos estructurados de la transaccion o null si no califica
 */
export function parsePaymentNotification(
  title: string,
  body: string
): ParsedBankNotification | null {
  const combined = `${title} ${body}`.trim()
  if (!combined) return null

  const normalized = normalizeNotificationText(combined)
  if (!PAGO_MOVIL_PATTERN.test(normalized)) return null

  const amountMatch = body.match(AMOUNT_PATTERN) ?? title.match(AMOUNT_PATTERN)
  if (!amountMatch) return null

  const amount = parseBolivarAmount(amountMatch[1])
  if (amount === null) return null

  const bank = detectBank(normalized)
  const senderMatch = body.match(SENDER_PATTERN) ?? title.match(SENDER_PATTERN)
  const phoneMatch = body.match(PHONE_PATTERN) ?? title.match(PHONE_PATTERN)
  const sender = phoneMatch
    ? phoneMatch[1].trim()
    : senderMatch?.[1].trim().replace(/\s+/g, ' ')
  const reference = extractReference(body) ?? extractReference(title)

  return {
    bank: bank.code,
    bankName: bank.name,
    operationType: 'incoming_pago_movil',
    amount,
    amountCents: Math.round(amount * 100),
    currency: 'VES',
    sender: sender || undefined,
    reference,
    rawTitle: title,
    rawBody: body,
    detectedAt: new Date().toISOString()
  }
}
