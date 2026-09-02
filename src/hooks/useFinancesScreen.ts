/**
 * Hook useFinancesScreen: administra los calculos de balance general,
 * totales consolidados y subtitulos para el centro de Finanzas (/finances).
 */

import { useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'

import { useExpenses } from '@src/hooks/useExpenses'
import { useIncomes } from '@src/hooks/useIncomes'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { formatAmount } from '@src/lib/format'
import type { BaseCurrency } from '@src/types/domain'

export interface UseFinancesScreenResult {
  expensesSubtitle: string
  incomesSubtitle: string
  formattedBalance: string
  formattedConfirmed: string
  formattedSpent: string
  refreshing: boolean
  onRefresh: () => Promise<void>
  openExpenses: () => void
  openIncomes: () => void
}

/**
 * Hook para la pantalla principal de Finanzas.
 * @returns Totales calculados, subtitulos y navegacion a gastos e ingresos
 */
export function useFinancesScreen(): UseFinancesScreenResult {
  const router = useRouter()
  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const expensesState = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)
  const incomesState = useIncomes(ratesState.rates, baseCurrency)

  const summary = expensesState.monthlySummary
  const totalSpent = summary ? summary.totalFixed + summary.totalUnique : 0
  const formattedSpent = formatAmount(totalSpent, baseCurrency)
  const confirmedTotal = incomesState.confirmedTotal ?? 0
  const formattedConfirmed = formatAmount(confirmedTotal, baseCurrency)
  const formattedBalance = summary ? formatAmount(summary.netBalance, baseCurrency) : '$ --'

  const expensesSubtitle = useMemo(() => {
    const count = expensesState.expenses.length
    const label = count === 1 ? '1 registrado' : `${count} registrados`
    return `${label} · ${formattedSpent} este mes`
  }, [expensesState.expenses.length, formattedSpent])

  const incomesSubtitle = useMemo(() => {
    const count = incomesState.incomes.length
    const label = count === 1 ? '1 fuente' : `${count} fuentes`
    return `${label} · ${formattedConfirmed} cobrado`
  }, [incomesState.incomes.length, formattedConfirmed])

  const openExpenses = useCallback(() => {
    router.push('/expenses')
  }, [router])

  const openIncomes = useCallback(() => {
    router.push('/incomes')
  }, [router])

  return {
    expensesSubtitle,
    incomesSubtitle,
    formattedBalance,
    formattedConfirmed,
    formattedSpent,
    refreshing: ratesState.refreshing,
    onRefresh: ratesState.refresh,
    openExpenses,
    openIncomes
  }
}
