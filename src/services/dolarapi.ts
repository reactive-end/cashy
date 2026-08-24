/**
 * Client for the dolarapi.com service (Venezuela endpoint).
 * Returns official Banco Central de Venezuela (BCV) rates
 * for dollar and euro. No API key required.
 */

import { fetchJson } from './http'

/** URL del endpoint del dolar oficial (BCV) */
const OFFICIAL_DOLLAR_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'

/** URL del endpoint del euro oficial (BCV) */
const OFFICIAL_EURO_URL = 'https://ve.dolarapi.com/v1/euros/oficial'

/** Forma esperada de una tasa individual devuelta por dolarapi */
interface OfficialRate {
  promedio: number
}

/**
 * Comprueba que un objeto responde a la forma de una tasa oficial.
 * @param value Objeto sin tipo recibido de la API
 * @returns true si el objeto es una OfficialRate valida
 */
function isOfficialRate(value: object): value is OfficialRate {
  return 'promedio' in value && typeof value.promedio === 'number' && value.promedio > 0
}

/** Tasas oficiales del BCV expresadas en bolivares */
export interface BCVRates {
  bcvUsd: number
  bcvEur: number
}

/**
 * Obtiene las tasas oficiales del BCV para dolar y euro en paralelo.
 * @returns Tasas en bolivares por unidad de cada divisa
 * @throws Error si alguno de los dos endpoints falla o responde mal
 */
export async function fetchBCVRates(): Promise<BCVRates> {
  const [usd, eur] = await Promise.all([
    fetchJson(OFFICIAL_DOLLAR_URL, isOfficialRate),
    fetchJson(OFFICIAL_EURO_URL, isOfficialRate)
  ])

  return { bcvUsd: usd.promedio, bcvEur: eur.promedio }
}
