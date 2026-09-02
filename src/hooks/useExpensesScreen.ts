/**
 * Hook useExpensesScreen: gestiona el estado de segmentacion, filtros,
 * busqueda por texto, ordenamiento, conversion de divisas y paginacion
 * para la pantalla de Gastos (/expenses).
 */

import { useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'

import type { BadgeTone } from '@src/components/atoms/Badge/Badge.d'
import type { ExpenseFilters, ExpenseSortOrder } from '@src/components/molecules/FilterSheet'
import { useExpenses } from '@src/hooks/useExpenses'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { convert } from '@src/lib/conversions'
import { formatAmount } from '@src/lib/format'
import { daysUntil, fromISODate } from '@src/lib/recurrences'
import {
  RECURRENCE_LABELS,
  type BaseCurrency,
  type Currency,
  type ExpenseType
} from '@src/types/domain'

/** Cantidad de filas por pagina */
export const ITEMS_PER_PAGE = 8

/** Fila visible de la lista de gastos */
export interface ExpenseListRow {
  id: string
  name: string
  convertedAmount: number
  createdAt: string
  icon: 'tag' | 'repeat'
  detail: string | undefined
  formattedAmount: string
  formattedOriginalAmount?: string
  badge?: { text: string; tone: BadgeTone }
}

export interface UseExpensesScreenResult {
  segment: ExpenseType
  handleSegmentChange: (val: string) => void
  searchText: string
  handleSearchChange: (text: string) => void
  handleSearch: () => void
  filterSheetVisible: boolean
  setFilterSheetVisible: (visible: boolean) => void
  filters: ExpenseFilters
  setFilters: React.Dispatch<React.SetStateAction<ExpenseFilters>>
  sortOrder: ExpenseSortOrder
  setSortOrder: (order: ExpenseSortOrder) => void
  activeFiltersCount: number
  availableCategories: string[]
  availableCurrencies: Currency[]
  currentPage: number
  totalPages: number
  setPage: (page: number) => void
  paginatedRows: ExpenseListRow[]
  totalRowsCount: number
  refreshing: boolean
  onRefresh: () => Promise<void>
  openExpenseDetail: (id: string) => void
  openCreateExpense: () => void
}

/**
 * Hook para la logica y transformaciones de la pantalla de Gastos.
 * @returns Estado completo de navegacion, filtros y paginacion
 */
export function useExpensesScreen(): UseExpensesScreenResult {
  const router = useRouter()
  const [segment, setSegment] = useState<ExpenseType>('fixed')
  const [page, setPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [query, setQuery] = useState('')
  const [filterSheetVisible, setFilterSheetVisible] = useState(false)
  const [filters, setFilters] = useState<ExpenseFilters>({ categories: [], currencies: [] })
  const [sortOrder, setSortOrder] = useState<ExpenseSortOrder>('recent')

  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const expensesState = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)
  const { isPaidThisMonth } = expensesState

  const sourceList =
    segment === 'fixed' ? expensesState.fixedExpenses : expensesState.uniqueExpenses

  const availableCategories = useMemo(() => {
    const uniqueSet = new Set<string>()

    for (const expense of expensesState.expenses) {
      const key = (expense.category ?? '').trim()
      if (key) uniqueSet.add(key)
    }

    return [...uniqueSet].sort((a, b) => a.localeCompare(b))
  }, [expensesState.expenses])

  const availableCurrencies = useMemo<Currency[]>(() => {
    const uniqueSet = new Set<Currency>()

    for (const expense of expensesState.expenses) {
      uniqueSet.add(expense.currency)
    }

    return [...uniqueSet]
  }, [expensesState.expenses])

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filterCategories = filters.categories
    const filterCurrencies = filters.currencies
    const categorySet = new Set(filterCategories)
    const currencySet = new Set(filterCurrencies)
    const mappedRows: ExpenseListRow[] = []

    for (const expense of sourceList) {
      const expenseCategory = (expense.category ?? '').trim()

      if (categorySet.size > 0 && !categorySet.has(expenseCategory)) {
        continue
      }

      if (currencySet.size > 0 && !currencySet.has(expense.currency)) {
        continue
      }

      const matchesSearch =
        !term ||
        expense.name.toLowerCase().includes(term) ||
        expenseCategory.toLowerCase().includes(term)

      if (!matchesSearch) {
        continue
      }

      const converted =
        expense.baseAmount !== undefined && expense.baseCurrency === baseCurrency
          ? expense.baseAmount
          : ratesState.rates
            ? convert(expense.amount, expense.currency, baseCurrency, ratesState.rates)
            : null

      const formattedAmount = converted
        ? formatAmount(converted, baseCurrency)
        : formatAmount(expense.amount, expense.currency)

      if (expense.type === 'unique') {
        mappedRows.push({
          id: expense.id,
          name: expense.name,
          convertedAmount: converted ?? expense.amount,
          createdAt: expense.createdAt,
          icon: 'tag',
          detail: expense.category,
          formattedAmount,
          formattedOriginalAmount:
            converted && expense.currency !== baseCurrency
              ? formatAmount(expense.amount, expense.currency)
              : undefined
        })
      } else if (expense.type === 'fixed' && expense.nextDueDate && expense.recurrence) {
        const isPaid = isPaidThisMonth(expense.id)
        const remaining = daysUntil(fromISODate(expense.nextDueDate))
        let badge: { text: string; tone: BadgeTone } | undefined

        if (isPaid) {
          badge = { text: 'pagado', tone: 'success' }
        } else if (remaining <= 0) {
          badge = { text: 'vence hoy', tone: 'danger' }
        } else if (remaining <= 3) {
          badge = { text: remaining === 1 ? '1 dia' : `${remaining} dias`, tone: 'warning' }
        }

        const recurrenceLabel = RECURRENCE_LABELS[expense.recurrence]
        const detail = expense.category
          ? `${recurrenceLabel} · ${expense.category}`
          : recurrenceLabel

        mappedRows.push({
          id: expense.id,
          name: expense.name,
          convertedAmount: converted ?? expense.amount,
          createdAt: expense.createdAt,
          icon: 'repeat',
          detail,
          formattedAmount,
          formattedOriginalAmount:
            converted && expense.currency !== baseCurrency
              ? formatAmount(expense.amount, expense.currency)
              : undefined,
          badge
        })
      }
    }

    mappedRows.sort((a, b) => {
      if (sortOrder === 'amountDesc') return b.convertedAmount - a.convertedAmount
      if (sortOrder === 'amountAsc') return a.convertedAmount - b.convertedAmount
      if (sortOrder === 'name') return a.name.localeCompare(b.name)
      return b.createdAt.localeCompare(a.createdAt)
    })

    return mappedRows
  }, [
    sourceList,
    query,
    filters.categories,
    filters.currencies,
    ratesState.rates,
    baseCurrency,
    sortOrder,
    isPaidThisMonth
  ])

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return rows.slice(start, start + ITEMS_PER_PAGE)
  }, [rows, currentPage])

  const handleSegmentChange = useCallback((val: string) => {
    setSegment(val as ExpenseType)
    setPage(1)
  }, [])

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

  const openExpenseDetail = useCallback(
    (id: string) => {
      router.push({ pathname: '/expense/[id]', params: { id } })
    },
    [router]
  )

  const openCreateExpense = useCallback(() => {
    router.push('/new-expense')
  }, [router])

  const activeFiltersCount = filters.categories.length + filters.currencies.length

  return {
    segment,
    handleSegmentChange,
    searchText,
    handleSearchChange,
    handleSearch,
    filterSheetVisible,
    setFilterSheetVisible,
    filters,
    setFilters,
    sortOrder,
    setSortOrder,
    activeFiltersCount,
    availableCategories,
    availableCurrencies,
    currentPage,
    totalPages,
    setPage,
    paginatedRows,
    totalRowsCount: rows.length,
    refreshing: ratesState.refreshing,
    onRefresh: ratesState.refresh,
    openExpenseDetail,
    openCreateExpense
  }
}
