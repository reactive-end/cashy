/**
 * Pantalla dedicada de Gastos: gestion completa de gastos fijos y unicos,
 * busqueda por texto, filtros por categoria y moneda, paginacion y acceso a detalle.
 */

import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'

import type { BadgeTone } from '@src/components/atoms/Badge/Badge.d'
import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { EmptyState } from '@src/components/molecules/EmptyState'
import { ExpenseItem } from '@src/components/molecules/ExpenseItem'
import { FilterSheet } from '@src/components/molecules/FilterSheet'
import type { ExpenseFilters, ExpenseSortOrder } from '@src/components/molecules/FilterSheet'
import { Pagination } from '@src/components/molecules/Pagination'
import { SearchBar } from '@src/components/molecules/SearchBar'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
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

/** Filas mostradas por pagina en la lista segmentada */
const ITEMS_PER_PAGE = 8

/** Fila derivada de un gasto para el listado */
interface ExpenseRow {
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

export default function ExpensesScreen() {
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

  const sourceList =
    segment === 'fixed' ? expensesState.fixedExpenses : expensesState.uniqueExpenses

  // Catalogos para el panel: categorias y monedas presentes en los datos.
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
    const mappedRows: ExpenseRow[] = []

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

      const converted = ratesState.rates
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
        const remaining = daysUntil(fromISODate(expense.nextDueDate))
        let badge: { text: string; tone: BadgeTone } | undefined

        if (remaining <= 0) {
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
    sortOrder
  ])

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return rows.slice(start, start + ITEMS_PER_PAGE)
  }, [rows, currentPage])

  function handleSegmentChange(val: string): void {
    setSegment(val as ExpenseType)
    setPage(1)
  }

  function handleSearchChange(text: string): void {
    setSearchText(text)
    if (!text.trim()) {
      setQuery('')
      setPage(1)
    }
  }

  function handleSearch(): void {
    setQuery(searchText)
    setPage(1)
  }

  const activeFiltersCount = filters.categories.length + filters.currencies.length

  return (
    <Screen scrollable refreshing={ratesState.refreshing} onRefresh={ratesState.refresh}>
      <View className="gap-6 pt-6 pb-12">
        {/* Cabecera con boton volver, titulo y boton de filtros */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver a Finanzas"
              onPress={() => router.back()}
              className="size-10 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
            >
              <Icon name="back" size={20} color="#1C1C1A" />
            </Pressable>
            <Typography variant="display">Mis gastos</Typography>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtrar gastos"
            onPress={() => setFilterSheetVisible(true)}
            className="relative size-10 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
          >
            <Icon name="filter" size={18} color="#1C1C1A" />
            {activeFiltersCount > 0 ? (
              <View className="absolute -top-1 -right-1 size-4 items-center justify-center rounded-full bg-accent">
                <Typography variant="caption" className="text-[10px] text-white">
                  {activeFiltersCount}
                </Typography>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* Alternador Fijos / Unicos */}
        <SegmentedControl
          options={[
            { value: 'fixed', label: 'Fijos' },
            { value: 'unique', label: 'Unicos' }
          ]}
          value={segment}
          onChange={handleSegmentChange}
        />

        {/* Busqueda con boton de agregar gasto nuevo */}
        <SearchBar
          value={searchText}
          onChangeText={handleSearchChange}
          onSearch={handleSearch}
          onAdd={() => router.push('/new-expense')}
        />

        {/* Lista paginada de gastos */}
        {rows.length === 0 ? (
          <Card>
            <EmptyState
              icon={segment === 'fixed' ? 'repeat' : 'tag'}
              title={
                query || activeFiltersCount > 0
                  ? 'Sin resultados'
                  : segment === 'fixed'
                    ? 'Sin gastos fijos'
                    : 'Sin gastos unicos'
              }
              message={
                query || activeFiltersCount > 0
                  ? 'Prueba modificando los filtros o el termino de busqueda.'
                  : segment === 'fixed'
                    ? 'Agrega tus suscripciones o servicios recurrentes.'
                    : 'Registra compras puntuales del dia a dia.'
              }
              action={
                !query && activeFiltersCount === 0 ? (
                  <Button
                    label="Registrar gasto"
                    icon="add"
                    fullWidth
                    onPress={() => router.push('/new-expense')}
                  />
                ) : undefined
              }
            />
          </Card>
        ) : (
          <View className="gap-3">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(next) => setPage(next)}
            />

            <Card>
              <View>
                {paginatedRows.map((row) => (
                  <ExpenseItem
                    key={row.id}
                    icon={row.icon}
                    name={row.name}
                    detail={row.detail}
                    formattedAmount={row.formattedAmount}
                    formattedOriginalAmount={row.formattedOriginalAmount}
                    badge={row.badge}
                    onPress={() => router.push(`/expense/${row.id}`)}
                  />
                ))}
              </View>
            </Card>
          </View>
        )}
      </View>

      <FilterSheet
        visible={filterSheetVisible}
        categories={availableCategories}
        currencies={availableCurrencies}
        filters={filters}
        sortOrder={sortOrder}
        onApply={(newFilters, newSort) => {
          setFilters(newFilters)
          setSortOrder(newSort)
          setPage(1)
          setFilterSheetVisible(false)
        }}
        onClose={() => setFilterSheetVisible(false)}
      />
    </Screen>
  )
}
