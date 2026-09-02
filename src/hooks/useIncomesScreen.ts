/**
 * Hook useIncomesScreen: gestiona la busqueda, paginacion, enriquecimiento
 * de divisas y confirmaciones de cobro para la pantalla de Ingresos (/incomes).
 */

import { useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'

import { useIncomes } from '@src/hooks/useIncomes'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { convert } from '@src/lib/conversions'
import { formatAmount } from '@src/lib/format'
import type { BaseCurrency, Income } from '@src/types/domain'

/** Cantidad de ingresos por pagina */
export const INCOMES_PER_PAGE = 8

/** Fila visible de la lista enriquecida de ingresos */
export interface VisibleIncomeRow {
  id: string
  name: string
  paydayDay: number
  formattedAmount: string
  formattedOriginalAmount?: string
  isConfirmed: boolean
  rawIncome: Income
}

export interface UseIncomesScreenResult {
  searchText: string
  handleSearchChange: (text: string) => void
  handleSearch: () => void
  currentPage: number
  totalPages: number
  setPage: (page: number) => void
  paginatedRows: VisibleIncomeRow[]
  totalRowsCount: number
  visiblePendingConfirmations: Income[]
  handleConfirmReceipt: (income: Income) => Promise<void>
  refreshing: boolean
  onRefresh: () => Promise<void>
  openCreateIncome: () => void
  openIncomeDetail: (id: string) => void
}

/**
 * Hook para la pantalla de Ingresos.
 * @returns Estado de busqueda, listas enriquecidas y acciones de cobro
 */
export function useIncomesScreen(): UseIncomesScreenResult {
  const router = useRouter()
  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const incomesState = useIncomes(ratesState.rates, baseCurrency)

  const [searchText, setSearchText] = useState('')
  const [query, setQuery] = useState('')
  const [currentPage, setPage] = useState(1)

  const openCreateIncome = useCallback(() => {
    router.push('/new-income')
  }, [router])

  const openIncomeDetail = useCallback(
    (id: string) => {
      router.push({ pathname: '/income/[id]', params: { id } })
    },
    [router]
  )

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text)
    if (!text.trim()) {
      setQuery('')
      setPage(1)
    }
  }, [])

  const handleSearch = useCallback(() => {
    setQuery(searchText)
    setPage(1)
  }, [searchText])

  const filteredIncomes = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return incomesState.incomes

    return incomesState.incomes.filter((income) => income.name.toLowerCase().includes(term))
  }, [incomesState.incomes, query])

  const rows: VisibleIncomeRow[] = useMemo(() => {
    const rates = ratesState.rates
    const receiptIds = new Set(incomesState.receipts.map((r) => r.incomeId))

    return filteredIncomes.map((income) => {
      const baseAmount = rates ? convert(income.amount, income.currency, baseCurrency, rates) : null
      const formattedAmount = baseAmount !== null ? formatAmount(baseAmount, baseCurrency) : '$ --'
      const formattedOriginal = formatAmount(income.amount, income.currency)

      return {
        id: income.id,
        name: income.name,
        paydayDay: income.paydayDay,
        formattedAmount,
        formattedOriginalAmount: formattedOriginal,
        isConfirmed: receiptIds.has(income.id),
        rawIncome: income
      }
    })
  }, [filteredIncomes, ratesState.rates, baseCurrency, incomesState.receipts])

  const totalPages = Math.max(1, Math.ceil(rows.length / INCOMES_PER_PAGE))
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * INCOMES_PER_PAGE
    return rows.slice(start, start + INCOMES_PER_PAGE)
  }, [rows, currentPage])

  const visiblePendingConfirmations = useMemo(() => {
    const term = query.trim().toLowerCase()
    return incomesState.pendingConfirmations.filter(
      (c) => !term || c.name.toLowerCase().includes(term)
    )
  }, [incomesState.pendingConfirmations, query])

  const handleConfirmReceipt = useCallback(
    async (income: Income) => {
      await incomesState.confirmReceipt(income)
    },
    [incomesState]
  )

  return {
    searchText,
    handleSearchChange,
    handleSearch,
    currentPage,
    totalPages,
    setPage,
    paginatedRows,
    totalRowsCount: rows.length,
    visiblePendingConfirmations,
    handleConfirmReceipt,
    refreshing: ratesState.refreshing,
    onRefresh: ratesState.refresh,
    openCreateIncome,
    openIncomeDetail
  }
}
