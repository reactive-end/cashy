/**
 * Local cache of the exchange rates snapshot over AsyncStorage.
 * Keeps the last valid snapshot and its fetch time, honoring the
 * daily query agreement without hammering the APIs.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

import type { ExchangeRates } from '@src/types/domain'

/** Clave bajo la que se persiste el snapshot */
const RATES_STORAGE_KEY = 'cashy.rates'

/**
 * Tiempo durante el cual el cache se considera fresco.
 * Las tasas BCV se publican una vez al dia; seis horas mantiene
 * los datos razonablemente recientes sin abusar de la red.
 */
export const CACHE_TTL_MS = 6 * 60 * 60 * 1000

/** Tiempo minimo entre consultas a la red aunque el usuario refresque manualmente */
export const MIN_NETWORK_INTERVAL_MS = 10 * 60 * 1000

/**
 * Comprueba que un objeto responde a la forma del snapshot de tasas.
 * @param value Objeto sin tipo leido desde almacenamiento
 * @returns true si el objeto es un ExchangeRates valido
 */
function isExchangeRates(value: object): value is ExchangeRates {
  return (
    'bcvUsd' in value &&
    typeof value.bcvUsd === 'number' &&
    'bcvEur' in value &&
    typeof value.bcvEur === 'number' &&
    'usdtSellP2p' in value &&
    typeof value.usdtSellP2p === 'number' &&
    'fetchedAt' in value &&
    typeof value.fetchedAt === 'string'
  )
}

/**
 * Guarda el snapshot de tasas en almacenamiento local.
 * @param rates Snapshot completo a persistir
 */
export async function saveRates(rates: ExchangeRates): Promise<void> {
  await AsyncStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(rates))
}

/**
 * Lee el ultimo snapshot guardado, si existe y es valido.
 * @returns El snapshot persistido o null si no hay datos utiles
 */
export async function loadRates(): Promise<ExchangeRates | null> {
  const bruto = await AsyncStorage.getItem(RATES_STORAGE_KEY)
  if (!bruto) return null

  try {
    const parsed: object = JSON.parse(bruto)
    return isExchangeRates(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Elimina el cache de tasas. Util en pruebas o si el usuario
 * quiere forzar una consulta completa.
 */
export async function clearRates(): Promise<void> {
  await AsyncStorage.removeItem(RATES_STORAGE_KEY)
}
