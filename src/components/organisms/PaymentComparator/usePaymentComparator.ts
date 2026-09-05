/**
 * Hook usePaymentComparator: gestiona los estados de las dos ofertas a comparar,
 * la seleccion de sus divisas y la derivacion del veredicto contable.
 */

import { useCallback, useMemo, useState } from 'react'

import { compareOffers, type PaymentComparisonResult } from '@src/lib/comparator'
import { amountFromCents } from '@src/lib/money'
import type { BaseCurrency, Currency, ExchangeRates } from '@src/types/domain'

export interface UsePaymentComparatorResult {
  amountCentsA: number
  currencyA: Currency
  amountCentsB: number
  currencyB: Currency
  amountA: number
  amountB: number
  comparison: PaymentComparisonResult
  handleCentsChangeA: (cents: number) => void
  handleCurrencyChangeA: (currency: Currency) => void
  handleCentsChangeB: (cents: number) => void
  handleCurrencyChangeB: (currency: Currency) => void
  handleSwapOffers: () => void
  handleReset: () => void
}

/**
 * Hook que administra el comparador de pagos.
 * @param rates Snapshot vigente de tasas
 * @param baseCurrency Moneda base del usuario
 * @returns Estado y acciones del comparador
 */
export function usePaymentComparator(
  rates: ExchangeRates | null,
  baseCurrency: BaseCurrency
): UsePaymentComparatorResult {
  const [amountCentsA, setAmountCentsA] = useState(0)
  const [currencyA, setCurrencyA] = useState<Currency>('VES')

  const [amountCentsB, setAmountCentsB] = useState(0)
  const [currencyB, setCurrencyB] = useState<Currency>('USDT')

  const handleCentsChangeA = useCallback((cents: number) => setAmountCentsA(cents), [])
  const handleCurrencyChangeA = useCallback((curr: Currency) => setCurrencyA(curr), [])

  const handleCentsChangeB = useCallback((cents: number) => setAmountCentsB(cents), [])
  const handleCurrencyChangeB = useCallback((curr: Currency) => setCurrencyB(curr), [])

  const handleSwapOffers = useCallback(() => {
    setAmountCentsA(amountCentsB)
    setAmountCentsB(amountCentsA)
    setCurrencyA(currencyB)
    setCurrencyB(currencyA)
  }, [amountCentsA, amountCentsB, currencyA, currencyB])

  const handleReset = useCallback(() => {
    setAmountCentsA(0)
    setAmountCentsB(0)
  }, [])

  const amountA = amountFromCents(amountCentsA)
  const amountB = amountFromCents(amountCentsB)

  const comparison = useMemo(() => {
    return compareOffers(
      { amount: amountA, currency: currencyA },
      { amount: amountB, currency: currencyB },
      rates,
      baseCurrency
    )
  }, [amountA, currencyA, amountB, currencyB, rates, baseCurrency])

  return {
    amountCentsA,
    currencyA,
    amountCentsB,
    currencyB,
    amountA,
    amountB,
    comparison,
    handleCentsChangeA,
    handleCurrencyChangeA,
    handleCentsChangeB,
    handleCurrencyChangeB,
    handleSwapOffers,
    handleReset
  }
}
