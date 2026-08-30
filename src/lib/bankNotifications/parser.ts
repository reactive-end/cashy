/**
 * Orquestador principal de parsing de notificaciones bancarias.
 * Itera sobre los parsers registrados para extraer datos de operaciones entrantes.
 */

import { parseBncNotification } from './parsers/bnc'
import type { ParsedBankNotification } from './types'

/** Coleccion de parsers bancarios activos */
const BANK_PARSERS = [parseBncNotification]

/**
 * Intenta parsear una notificacion bancaria entrante.
 * @param title Titulo de la notificacion
 * @param body Cuerpo de la notificacion
 * @param packageName Paquete Android origen opcional
 * @returns Datos estructurados de la transaccion o null si ninguna regla coincide
 */
export function parseBankNotification(
  title: string,
  body: string,
  packageName?: string
): ParsedBankNotification | null {
  if (!title && !body) return null

  for (const parser of BANK_PARSERS) {
    const parsed = parser(title, body, packageName)
    if (parsed) return parsed
  }

  return null
}
