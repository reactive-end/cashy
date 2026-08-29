/**
 * Pantalla dedicada de Ingresos (app/incomes.tsx):
 * Administracion de fuentes de ingreso con busqueda, paginacion,
 * confirmacion de cobros pendientes y navegacion hacia el detalle
 * de cada ingreso.
 */

import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { EmptyState } from '@src/components/molecules/EmptyState'
import { IncomeItem } from '@src/components/molecules/IncomeItem'
import { Pagination } from '@src/components/molecules/Pagination'
import { SearchBar } from '@src/components/molecules/SearchBar'
import { useIncomes } from '@src/hooks/useIncomes'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { convert } from '@src/lib/conversions'
import { formatAmount } from '@src/lib/format'
import type { BaseCurrency, Income } from '@src/types/domain'

/** Cantidad de ingresos por pagina */
const ITEMS_PER_PAGE = 8

/** Fila visible de la lista enriquecida de ingresos */
interface VisibleIncomeRow {
  id: string
  name: string
  paydayDay: number
  formattedAmount: string
  formattedOriginalAmount?: string
  isConfirmed: boolean
  rawIncome: Income
}

/**
 * Vista de ingresos con cobros pendientes, busqueda y paginacion.
 * @returns Pantalla completa para gestionar fuentes de ingreso
 */
export default function IncomesScreen() {
  const router = useRouter()
  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const incomesState = useIncomes(ratesState.rates, baseCurrency)

  // Busqueda
  const [searchText, setSearchText] = useState('')
  const [query, setQuery] = useState('')

  // Paginacion
  const [currentPage, setPage] = useState(1)

  function openCreateIncome(): void {
    router.push('/new-income')
  }

  // Filtrado por query de busqueda
  const filteredIncomes = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return incomesState.incomes

    return incomesState.incomes.filter((income) => income.name.toLowerCase().includes(term))
  }, [incomesState.incomes, query])

  // Transformacion a filas enriquecidas
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

  // Paginacion
  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE))
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return rows.slice(start, start + ITEMS_PER_PAGE)
  }, [rows, currentPage])

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

  const visiblePendingConfirmations = useMemo(() => {
    const term = query.trim().toLowerCase()
    return incomesState.pendingConfirmations.filter(
      (c) => !term || c.name.toLowerCase().includes(term)
    )
  }, [incomesState.pendingConfirmations, query])

  return (
    <Screen scrollable refreshing={ratesState.refreshing} onRefresh={ratesState.refresh}>
      <View className="gap-6 pt-6 pb-12">
        {/* Cabecera con boton volver y titulo */}
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a Finanzas"
            onPress={() => router.back()}
            className="size-10 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
          >
            <Icon name="back" size={20} color="#1C1C1A" />
          </Pressable>
          <Typography variant="display">Ingresos</Typography>
        </View>

        {/* Cobros pendientes de confirmacion del mes */}
        {visiblePendingConfirmations.length > 0 ? (
          <Card className="border-accent/30 bg-accent-soft/40 gap-3">
            <View className="flex-row items-center gap-2">
              <Icon name="savings" size={18} color="#0D8A58" />
              <Typography variant="figure" className="text-accent">
                Cobros pendientes por confirmar
              </Typography>
            </View>

            <View className="gap-2">
              {visiblePendingConfirmations.map((income) => (
                <View
                  key={income.id}
                  className="flex-row items-center justify-between py-1.5 border-b border-accent/20 last:border-b-0"
                >
                  <View className="flex-1 min-w-0 pr-2">
                    <Typography variant="body" className="font-sans-semibold" numberOfLines={1}>
                      {income.name}
                    </Typography>
                    <Typography variant="caption" className="text-muted">
                      Dia {income.paydayDay} • {formatAmount(income.amount, income.currency)}
                    </Typography>
                  </View>

                  <Button
                    label="Recibido"
                    variant="primary"
                    onPress={() => incomesState.confirmReceipt(income)}
                  />
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Busqueda y boton de nuevo ingreso */}
        <SearchBar
          value={searchText}
          onChangeText={handleSearchChange}
          onSearch={handleSearch}
          onAdd={openCreateIncome}
          placeholder="Buscar ingresos..."
          addAccessibilityLabel="Agregar ingreso"
        />

        {/* Lista paginada de ingresos */}
        {rows.length === 0 ? (
          <Card>
            <EmptyState
              icon="savings"
              title={query ? 'Sin resultados' : 'Sin ingresos todavia'}
              message={
                query
                  ? 'No hay fuentes que coincidan con la busqueda.'
                  : 'Registra tus fuentes de ingreso habituales.'
              }
              action={
                !query ? (
                  <Button label="Agregar ingreso" icon="add" fullWidth onPress={openCreateIncome} />
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
                  <IncomeItem
                    key={row.id}
                    testID={`income-item-${row.id}`}
                    name={row.name}
                    paydayDay={row.paydayDay}
                    formattedAmount={row.formattedAmount}
                    formattedOriginalAmount={row.formattedOriginalAmount}
                    isConfirmed={row.isConfirmed}
                    onPress={() =>
                      router.push({ pathname: '/income/[id]', params: { id: row.id } })
                    }
                  />
                ))}
              </View>
            </Card>
          </View>
        )}
      </View>
    </Screen>
  )
}
