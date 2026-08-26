/**
 * Finanzas screen: gestion completa del flujo personal segmentada
 * entre gastos (fijos y unicos, con busqueda y filtros) e ingresos
 * (resumen mensual, tabla de fuentes y alta/edicion en modal).
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
import { IncomeFormSheet } from '@src/components/molecules/IncomeFormSheet'
import { Pagination } from '@src/components/molecules/Pagination'
import { SearchBar } from '@src/components/molecules/SearchBar'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import type { IncomeDraft } from '@src/components/organisms/IncomeEditor'
import { IncomesPanel } from '@src/components/organisms/IncomesPanel'
import { useExpenses } from '@src/hooks/useExpenses'
import { useIncomes } from '@src/hooks/useIncomes'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { convert } from '@src/lib/conversions'
import { formatAmount } from '@src/lib/format'
import { daysUntil, fromISODate } from '@src/lib/recurrences'
import { isValidIncomeRow } from '@src/lib/validation'
import {
  RECURRENCE_LABELS,
  type BaseCurrency,
  type Currency,
  type ExpenseType,
  type Income
} from '@src/types/domain'

/** Secciones principales de la pestana de finanzas */
type FinanceView = 'expenses' | 'incomes'

/**
 * Pestaña de gestion de gastos con alternancia Fijos y Unicos.
 * @returns Pantalla de listado con busqueda, detalle y creacion
 */
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

export default function Finances() {
  const router = useRouter()
  const [view, setView] = useState<FinanceView>('expenses')
  const [segment, setSegment] = useState<ExpenseType>('fixed')
  const [page, setPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [query, setQuery] = useState('')
  const [filterSheetVisible, setFilterSheetVisible] = useState(false)
  const [filters, setFilters] = useState<ExpenseFilters>({ categories: [], currencies: [] })
  const [sortOrder, setSortOrder] = useState<ExpenseSortOrder>('recent')

  // Estado del modal de ingresos (alta/edicion).
  const [incomeSheetVisible, setIncomeSheetVisible] = useState(false)
  const [incomeRow, setIncomeRow] = useState<IncomeDraft>({
    name: '',
    amountCents: 0,
    currency: 'USD',
    paydayDayText: ''
  })
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)

  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const expensesState = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)
  const incomesState = useIncomes(ratesState.rates, baseCurrency)

  /** Abre la hoja vacia para registrar un ingreso nuevo */
  function openCreateIncome(): void {
    setEditingIncome(null)
    setIncomeRow({ name: '', amountCents: 0, currency: 'USD', paydayDayText: '' })
    setIncomeSheetVisible(true)
  }

  /** Precarga la hoja con los datos de un ingreso existente */
  function openEditIncome(income: Income): void {
    setEditingIncome(income)
    setIncomeRow({
      name: income.name,
      amountCents: Math.round(income.amount * 100),
      currency: income.currency,
      paydayDayText: String(income.paydayDay)
    })
    setIncomeSheetVisible(true)
  }

  /** Confirma la hoja persistiendo alta o edicion segun el modo */
  async function confirmIncome(): Promise<void> {
    if (!isValidIncomeRow(incomeRow)) return

    const content = {
      name: incomeRow.name.trim(),
      amount: incomeRow.amountCents / 100,
      currency: incomeRow.currency,
      paydayDay: Number.parseInt(incomeRow.paydayDayText.trim(), 10)
    }

    if (editingIncome) {
      await incomesState.edit(editingIncome.id, content)
    } else {
      await incomesState.create(content)
    }

    setIncomeSheetVisible(false)
    setEditingIncome(null)
    setIncomeRow({ name: '', amountCents: 0, currency: 'USD', paydayDayText: '' })
  }

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
      if (categorySet.size > 0 && !categorySet.has((expense.category ?? '').trim())) {
        continue
      }

      if (currencySet.size > 0 && !currencySet.has(expense.currency)) {
        continue
      }

      const matchesSearch =
        !term ||
        expense.name.toLowerCase().includes(term) ||
        (expense.category ?? '').toLowerCase().includes(term)

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
              : undefined,
          badge: undefined
        })
        continue
      }

      const dias = expense.nextDueDate ? daysUntil(fromISODate(expense.nextDueDate)) : 0

      const tone: BadgeTone = dias <= 1 ? 'danger' : dias <= 3 ? 'warning' : 'neutral'

      mappedRows.push({
        id: expense.id,
        name: expense.name,
        convertedAmount: converted ?? expense.amount,
        createdAt: expense.createdAt,
        icon: 'repeat',
        detail: expense.recurrence
          ? `${RECURRENCE_LABELS[expense.recurrence]} · ${formatAmount(
              expense.amount,
              expense.currency
            )}`
          : formatAmount(expense.amount, expense.currency),
        formattedAmount,
        formattedOriginalAmount: undefined,
        badge: { text: `vence en ${dias} dia${dias === 1 ? '' : 's'}`, tone }
      })
    }

    if (sortOrder === 'amountDesc') {
      return [...mappedRows].sort((a, b) => b.convertedAmount - a.convertedAmount)
    }

    if (sortOrder === 'amountAsc') {
      return [...mappedRows].sort((a, b) => a.convertedAmount - b.convertedAmount)
    }

    if (sortOrder === 'name') {
      return [...mappedRows].sort((a, b) => a.name.localeCompare(b.name))
    }

    return [...mappedRows].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [sourceList, ratesState.rates, baseCurrency, query, filters, sortOrder])

  const hasFilters =
    filters.categories.length > 0 || filters.currencies.length > 0 || sortOrder !== 'recent'

  // Paginacion client-side: 8 filas por pagina, reinicio al cambiar segmento
  // o al aplicar la busqueda. La pagina efectiva se deriva (clamp) sin efectos.
  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const visibleRows = rows.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const handleSegmentChange = (value: ExpenseType) => {
    setSegment(value)
    setPage(1)
  }

  const applySearch = () => {
    setQuery(searchText)
    setPage(1)
  }

  const applyFilters = (nextFilters: ExpenseFilters, nextSortOrder: ExpenseSortOrder) => {
    setFilters(nextFilters)
    setSortOrder(nextSortOrder)
    setPage(1)
  }

  const refreshAll = async () => {
    await Promise.all([ratesState.refresh(), expensesState.reload()])
  }

  return (
    <Screen
      scrollable
      onRefresh={refreshAll}
      refreshing={ratesState.refreshing || expensesState.reloading}
    >
      <View className="gap-6 pt-6">
        <Typography variant="display">Finanzas</Typography>

        <SegmentedControl
          options={[
            { value: 'expenses', label: 'Gastos' },
            { value: 'incomes', label: 'Ingresos' }
          ]}
          value={view}
          onChange={(value) => setView(value as FinanceView)}
        />

        {view === 'incomes' ? (
          <IncomesPanel
            incomes={incomesState.incomes}
            monthlyTotal={incomesState.monthlyTotal}
            baseCurrency={baseCurrency}
            loading={incomesState.loading}
            onAdd={openCreateIncome}
            onEdit={openEditIncome}
            onRemove={(id) => void incomesState.remove(id)}
          />
        ) : (
          <>
            <View className="flex-row items-center justify-between gap-3">
              <Typography variant="label">Mis gastos</Typography>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filtrar gastos"
                className="size-11 items-center justify-center rounded-full border border-line bg-card active:opacity-60"
                onPress={() => setFilterSheetVisible(true)}
              >
                <Icon name="filter" size={20} color="#1C1C1A" />
                {hasFilters ? (
                  <View className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent" />
                ) : null}
              </Pressable>
            </View>

            <SegmentedControl
              options={[
                { value: 'fixed', label: 'Fijos' },
                { value: 'unique', label: 'Unicos' }
              ]}
              value={segment}
              onChange={handleSegmentChange}
            />

            <SearchBar
              value={searchText}
              onChangeText={setSearchText}
              onSearch={applySearch}
              onAdd={() => router.push('/new-expense')}
            />

            {expensesState.loading ? (
              <Typography variant="caption">Cargando gastos...</Typography>
            ) : rows.length === 0 && query.trim() ? (
              <EmptyState
                className="min-h-72"
                icon="search"
                title="Sin resultados"
                message={`No encontramos gastos que coincidan con "${query.trim()}" en esta seccion.`}
              />
            ) : rows.length === 0 ? (
              <EmptyState
                className="min-h-96"
                icon={segment === 'fixed' ? 'repeat' : 'savings'}
                title={
                  segment === 'fixed' ? 'Sin gastos fijos todavia' : 'Sin gastos unicos todavia'
                }
                message={
                  segment === 'fixed'
                    ? 'Registra suscripciones, alquiler u otros pagos que se repiten para recibir recordatorios.'
                    : 'Registra compras puntuales como antojos o electrodomesticos para llevar tu control.'
                }
                action={
                  <Button
                    label="Registrar gasto"
                    icon="add"
                    fullWidth
                    onPress={() => router.push('/new-expense')}
                  />
                }
              />
            ) : (
              <>
                <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />

                <Card noPadding className="divide-y divide-line px-4">
                  {visibleRows.map((row, index) => (
                    <ExpenseItem
                      key={row.id}
                      testID={`expense-row-${(safePage - 1) * ITEMS_PER_PAGE + index}`}
                      icon={row.icon}
                      name={row.name}
                      detail={row.detail}
                      formattedAmount={row.formattedAmount}
                      formattedOriginalAmount={row.formattedOriginalAmount}
                      badge={row.badge}
                      onPress={() =>
                        router.push({ pathname: '/expense/[id]', params: { id: row.id } })
                      }
                    />
                  ))}
                </Card>
              </>
            )}
          </>
        )}
      </View>

      <IncomeFormSheet
        visible={incomeSheetVisible}
        values={incomeRow}
        onChange={setIncomeRow}
        actionLabel={editingIncome ? 'Guardar cambios' : 'Agregar ingreso'}
        onConfirm={() => void confirmIncome()}
        onClose={() => setIncomeSheetVisible(false)}
        title={editingIncome ? 'Editar ingreso' : 'Nuevo ingreso'}
        testIDBase="income-sheet"
      />

      <FilterSheet
        visible={filterSheetVisible}
        categories={availableCategories}
        currencies={availableCurrencies}
        filters={filters}
        sortOrder={sortOrder}
        onApply={applyFilters}
        onClose={() => setFilterSheetVisible(false)}
      />
    </Screen>
  )
}
