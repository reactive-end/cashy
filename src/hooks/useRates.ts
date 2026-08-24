/**
 * Hook useRates: fetches and maintains the daily rates snapshot.
 * Reads the local cache first and hits the network only when expired,
 * also exposing a manual refresh for pull-to-retry flows.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { getErrorMessage } from '@src/lib/errors'
import { getExchangeRates } from '@src/services/rates'
import type { ExchangeRates } from '@src/types/domain'

/** Estado y acciones expuestos por el hook de tasas */
export interface UseRatesResult {
  /** Snapshot vigente; null hasta la primera carga exitosa */
  rates: ExchangeRates | null
  /** true durante la carga inicial */
  loading: boolean
  /** true durante una actualizacion manual */
  refreshing: boolean
  /** Mensaje del ultimo error de red; null si todo va bien */
  error: string | null
  /** Resultado del ultimo refresco manual: true/false; null si aun no ocurre */
  lastRefreshOk: boolean | null
  /** Fuerza una consulta a la red ignorando el cache */
  refresh: () => Promise<void>
}

/**
 * Mantiene las tasas de cambio actualizadas con estrategia cache-first.
 * @returns Snapshot reactivo, estados de carga, error y refresco manual
 */
export function useRates(): UseRatesResult {
  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshOk, setLastRefreshOk] = useState<boolean | null>(null)
  const montado = useRef(true)

  useEffect(() => {
    montado.current = true

    getExchangeRates()
      .then((snapshot) => {
        if (montado.current) setRates(snapshot)
      })
      .catch((e) => {
        if (montado.current) setError(getErrorMessage(e))
      })
      .finally(() => {
        if (montado.current) setLoading(false)
      })

    return () => {
      montado.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!montado.current) return
    setRefreshing(true)
    setError(null)

    try {
      const snapshot = await getExchangeRates(true)
      if (montado.current) {
        setRates(snapshot)
        setLastRefreshOk(true)
      }
    } catch (e) {
      if (montado.current) {
        setError(getErrorMessage(e))
        setLastRefreshOk(false)
      }
    } finally {
      if (montado.current) setRefreshing(false)
    }
  }, [])

  return { rates, loading, refreshing, error, lastRefreshOk, refresh }
}
