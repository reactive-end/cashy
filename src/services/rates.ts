/**
 * Exchange rates orchestrator.
 * Combines BCV (dolarapi.com) and USDT Binance P2P (criptoya.com)
 * into a single locally cached snapshot.
 */

import type { ExchangeRates } from '@src/types/domain'

import { fetchUsdtSellRate } from './criptoya'
import { fetchBCVRates } from './dolarapi'
import { CACHE_TTL_MS, loadRates, saveRates } from './rates-cache'

/** Exporta la validez del cache para que los hooks la consulten */
export { CACHE_TTL_MS }

/**
 * Consulta la red y construye un snapshot fresco de todas las tasas.
 * @returns Snapshot con dolar BCV, euro BCV y USDT Binance P2P
 * @throws Error si alguna de las fuentes falla
 */
export async function fetchFreshRates(): Promise<ExchangeRates> {
  const [bcv, usdt] = await Promise.all([fetchBCVRates(), fetchUsdtSellRate()])

  const snapshot: ExchangeRates = {
    bcvUsd: bcv.bcvUsd,
    bcvEur: bcv.bcvEur,
    usdtSellP2p: usdt,
    fetchedAt: new Date().toISOString()
  }

  await saveRates(snapshot)
  return snapshot
}

/**
 * Devuelve las tasas mas recientes posibles:
 * usa el cache si tiene menos de CACHE_TTL_MS y va a la red en caso contrario.
 * Si la red falla pero existe un snapshot previo en cache, lo rescata
 * marcado con isStale: true para garantizar continuidad offline.
 * @param forceNetwork Cuando es true ignora el cache y consulta la red
 * @returns Snapshot de tasas desde cache o red
 * @throws Error solo si la red falla y no existe ningun cache previo
 */
export async function getExchangeRates(forceNetwork = false): Promise<ExchangeRates> {
  const cached = await loadRates()
  const cacheAge = cached ? Date.now() - new Date(cached.fetchedAt).getTime() : Infinity

  if (!forceNetwork && cached && cacheAge < CACHE_TTL_MS) {
    return cached
  }

  try {
    return await fetchFreshRates()
  } catch (error) {
    if (cached) {
      return { ...cached, isStale: true }
    }
    throw error
  }
}
