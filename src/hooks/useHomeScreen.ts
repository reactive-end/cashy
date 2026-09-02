/**
 * Hook useHomeScreen: coordina el estado general del panel de inicio,
 * tasas, resumenes mensuales, recordatorios, avisos de pago pendiente
 * y avisos de tasa BCV.
 */

import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useExpenses } from '@src/hooks/useExpenses'
import { useIncomes } from '@src/hooks/useIncomes'
import { useMarketing } from '@src/hooks/useMarketing'
import { useRates, type UseRatesResult } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import type {
  BaseCurrency,
  Expense,
  Income,
  MonthlySummary as MonthlySummaryType,
  UpcomingPayment
} from '@src/types/domain'
import type { AppAnnouncement, PartnerAd } from '@src/types/marketing'

/** Saludo segun la hora del dispositivo */
export function greetingByTime(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos dias'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export interface UseHomeScreenResult {
  greeting: string
  ratesState: UseRatesResult
  baseCurrency: BaseCurrency
  ratesNotice: { ok: boolean } | null
  setRatesNotice: (notice: { ok: boolean } | null) => void
  monthlySummary: MonthlySummaryType | null
  upcomingPayments: UpcomingPayment[]
  activePendingIncome: Income | null
  confirmingReceipt: boolean
  handleConfirmPending: (income: Income) => Promise<void>
  handleDismissPending: (income: Income) => void
  activePendingDueExpense: Expense | null
  confirmingExpensePayment: boolean
  handleConfirmDueExpense: (expense: Expense) => Promise<void>
  handleDismissDueExpense: (expense: Expense) => void
  partnerAd: PartnerAd | null
  announcements: AppAnnouncement[]
  dismissAllAnnouncements: () => void
  openNewExpense: () => void
  openExpenseDetail: (id: string) => void
}

/**
 * Hook para la pantalla de Inicio (/index).
 * @returns Datos financieros, alertas y navegacion para la pantalla principal
 */
export function useHomeScreen(): UseHomeScreenResult {
  const router = useRouter()
  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const expensesState = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)
  const incomesState = useIncomes(ratesState.rates, baseCurrency)
  const { partnerAd, announcements, dismissAllAnnouncements } = useMarketing('home')

  const [ratesNotice, setRatesNotice] = useState<{ ok: boolean } | null>(null)
  const wasRefreshing = useRef(false)

  const [dismissedPaydayIds, setDismissedPaydayIds] = useState<Set<string>>(new Set())
  const [confirmingReceipt, setConfirmingReceipt] = useState(false)

  const [dismissedDueExpenseIds, setDismissedDueExpenseIds] = useState<Set<string>>(new Set())
  const [confirmingExpensePayment, setConfirmingExpensePayment] = useState(false)

  const activePendingIncome: Income | null =
    incomesState.pendingConfirmations.find((income) => !dismissedPaydayIds.has(income.id)) ?? null

  const activePendingDueExpense: Expense | null =
    expensesState.pendingDueExpenses.find((expense) => !dismissedDueExpenseIds.has(expense.id)) ??
    null

  const handleConfirmPending = useCallback(
    async (income: Income): Promise<void> => {
      setConfirmingReceipt(true)
      try {
        await incomesState.confirmReceipt(income)
      } finally {
        setConfirmingReceipt(false)
      }
    },
    [incomesState]
  )

  const handleDismissPending = useCallback((income: Income): void => {
    setDismissedPaydayIds((prev) => new Set(prev).add(income.id))
  }, [])

  const handleConfirmDueExpense = useCallback(
    async (expense: Expense): Promise<void> => {
      setConfirmingExpensePayment(true)
      try {
        await expensesState.markAsPaid(expense)
      } finally {
        setConfirmingExpensePayment(false)
      }
    },
    [expensesState]
  )

  const handleDismissDueExpense = useCallback((expense: Expense): void => {
    setDismissedDueExpenseIds((prev) => new Set(prev).add(expense.id))
  }, [])

  useEffect(() => {
    if (ratesState.refreshing) {
      wasRefreshing.current = true
      return
    }

    if (wasRefreshing.current && ratesState.lastRefreshOk !== null) {
      wasRefreshing.current = false
      setRatesNotice({ ok: ratesState.lastRefreshOk })
    }
  }, [ratesState.refreshing, ratesState.lastRefreshOk])

  const openNewExpense = useCallback(() => {
    router.push('/new-expense')
  }, [router])

  const openExpenseDetail = useCallback(
    (id: string) => {
      router.push({ pathname: '/expense/[id]', params: { id } })
    },
    [router]
  )

  return {
    greeting: greetingByTime(),
    ratesState,
    baseCurrency,
    ratesNotice,
    setRatesNotice,
    monthlySummary: expensesState.monthlySummary,
    upcomingPayments: expensesState.upcomingPayments,
    activePendingIncome,
    confirmingReceipt,
    handleConfirmPending,
    handleDismissPending,
    activePendingDueExpense,
    confirmingExpensePayment,
    handleConfirmDueExpense,
    handleDismissDueExpense,
    partnerAd,
    announcements,
    dismissAllAnnouncements,
    openNewExpense,
    openExpenseDetail
  }
}
