/**
 * Expenses screen: complete list segmented between fixed and unique.
 * Includes a search bar with quick actions, always visible pagination
 * and navigation to the expense detail screen.
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
import type { FiltrosGastos, OrdenGastos } from '@src/components/molecules/FilterSheet'
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

/**
 * Pestaña de gestion de gastos con alternancia Fijos y Unicos.
 * @returns Pantalla de listado con busqueda, detalle y creacion
 */
/** Filas mostradas por pagina en la lista segmentada */
const ITEMS_PER_PAGE = 8

export default function Expenses() {
  const router = useRouter()
  const [segment, setSegment] = useState<ExpenseType>('fixed')
  const [page, setPage] = useState(1)
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [consulta, setConsulta] = useState('')
  const [panelFiltros, setPanelFiltros] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosGastos>({ categorias: [], monedas: [] })
  const [orden, setOrden] = useState<OrdenGastos>('recientes')

  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const gastos = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)

  const lista = segment === 'fixed' ? gastos.fixedExpenses : gastos.uniqueExpenses

  // Catalogos para el panel: categorias y monedas presentes en los datos.
  const categoriasDisponibles = useMemo(() => {
    const conjunto = new Set<string>()

    for (const gasto of gastos.expenses) {
      const clave = (gasto.category ?? '').trim()

      if (clave) conjunto.add(clave)
    }

    return [...conjunto].sort((a, b) => a.localeCompare(b))
  }, [gastos.expenses])

  const monedasDisponibles = useMemo<Currency[]>(() => {
    const conjunto = new Set<Currency>()

    for (const gasto of gastos.expenses) {
      conjunto.add(gasto.currency)
    }

    return [...conjunto]
  }, [gastos.expenses])

  const rows = useMemo(() => {
    const termino = consulta.trim().toLowerCase()
    const filtroCategorias = filtros.categorias
    const filtroMonedas = filtros.monedas

    const filasMapeadas = lista
      .filter((expense) => {
        if (filtroCategorias.length > 0) {
          const clave = (expense.category ?? '').trim()

          if (!filtroCategorias.includes(clave)) return false
        }

        if (filtroMonedas.length > 0 && !filtroMonedas.includes(expense.currency)) {
          return false
        }

        if (!termino) return true

        return (
          expense.name.toLowerCase().includes(termino) ||
          (expense.category ?? '').toLowerCase().includes(termino)
        )
      })
      .map((expense) => {
        const convertido = ratesState.rates
          ? convert(expense.amount, expense.currency, baseCurrency, ratesState.rates)
          : null

        const formattedAmount = convertido
          ? formatAmount(convertido, baseCurrency)
          : formatAmount(expense.amount, expense.currency)

        if (expense.type === 'unique') {
          return {
            id: expense.id,
            name: expense.name,
            montoConvertido: convertido ?? expense.amount,
            createdAt: expense.createdAt,
            icon: 'tag' as const,
            detail: expense.category,
            formattedAmount,
            formattedOriginalAmount:
              convertido && expense.currency !== baseCurrency
                ? formatAmount(expense.amount, expense.currency)
                : undefined,
            badge: undefined
          }
        }

        const dias = expense.nextDueDate ? daysUntil(fromISODate(expense.nextDueDate)) : 0

        const tone: BadgeTone = dias <= 1 ? 'danger' : dias <= 3 ? 'warning' : 'neutral'

        return {
          id: expense.id,
          name: expense.name,
          montoConvertido: convertido ?? expense.amount,
          createdAt: expense.createdAt,
          icon: 'repeat' as const,
          detail: expense.recurrence
            ? `${RECURRENCE_LABELS[expense.recurrence]} · ${formatAmount(
                expense.amount,
                expense.currency
              )}`
            : formatAmount(expense.amount, expense.currency),
          formattedAmount,
          formattedOriginalAmount: undefined,
          badge: { text: `vence en ${dias} dia${dias === 1 ? '' : 's'}`, tone }
        }
      })

    if (orden === 'montoDesc') {
      return [...filasMapeadas].sort((a, b) => b.montoConvertido - a.montoConvertido)
    }

    if (orden === 'montoAsc') {
      return [...filasMapeadas].sort((a, b) => a.montoConvertido - b.montoConvertido)
    }

    if (orden === 'nombre') {
      return [...filasMapeadas].sort((a, b) => a.name.localeCompare(b.name))
    }

    return [...filasMapeadas].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [lista, ratesState.rates, baseCurrency, consulta, filtros, orden])

  const hayFiltros =
    filtros.categorias.length > 0 || filtros.monedas.length > 0 || orden !== 'recientes'

  // Paginacion client-side: 8 filas por pagina, reinicio al cambiar segmento
  // o al aplicar la busqueda. La pagina efectiva se deriva (clamp) sin efectos.
  const totalPaginas = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE))
  const paginaSegura = Math.min(page, totalPaginas)
  const filasVisibles = rows.slice(
    (paginaSegura - 1) * ITEMS_PER_PAGE,
    paginaSegura * ITEMS_PER_PAGE
  )

  const cambiarSegmento = (valor: ExpenseType) => {
    setSegment(valor)
    setPage(1)
  }

  const aplicarBusqueda = () => {
    setConsulta(textoBusqueda)
    setPage(1)
  }

  const aplicarFiltros = (nuevos: FiltrosGastos, nuevoOrden: OrdenGastos) => {
    setFiltros(nuevos)
    setOrden(nuevoOrden)
    setPage(1)
  }

  const refrescarTodo = async () => {
    await Promise.all([ratesState.refresh(), gastos.reload()])
  }

  return (
    <Screen
      scrollable
      onRefresh={refrescarTodo}
      refreshing={ratesState.refreshing || gastos.reloading}
    >
      <View className="gap-6 pt-6">
        <View className="flex-row items-center justify-between gap-3">
          <Typography variant="display">Gastos</Typography>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtrar gastos"
            className="size-11 items-center justify-center rounded-full border border-line bg-card active:opacity-60"
            onPress={() => setPanelFiltros(true)}
          >
            <Icon name="filter" size={20} color="#1C1C1A" />
            {hayFiltros ? (
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
          onChange={cambiarSegmento}
        />

        <SearchBar
          value={textoBusqueda}
          onChangeText={setTextoBusqueda}
          onSearch={aplicarBusqueda}
          onAdd={() => router.push('/new-expense')}
        />

        {gastos.loading ? (
          <Typography variant="caption">Cargando gastos...</Typography>
        ) : rows.length === 0 && consulta.trim() ? (
          <EmptyState
            className="min-h-72"
            icon="search"
            title="Sin resultados"
            message={`No encontramos gastos que coincidan con "${consulta.trim()}" en esta seccion.`}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            className="min-h-96"
            icon={segment === 'fixed' ? 'repeat' : 'savings'}
            title={segment === 'fixed' ? 'Sin gastos fijos todavia' : 'Sin gastos unicos todavia'}
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
            <Pagination page={paginaSegura} totalPages={totalPaginas} onPageChange={setPage} />

            <Card noPadding className="divide-y divide-line px-4">
              {filasVisibles.map((fila, index) => (
                <ExpenseItem
                  key={fila.id}
                  testID={`expense-row-${(paginaSegura - 1) * ITEMS_PER_PAGE + index}`}
                  icon={fila.icon}
                  name={fila.name}
                  detail={fila.detail}
                  formattedAmount={fila.formattedAmount}
                  formattedOriginalAmount={fila.formattedOriginalAmount}
                  badge={fila.badge}
                  onPress={() =>
                    router.push({ pathname: '/expense/[id]', params: { id: fila.id } })
                  }
                />
              ))}
            </Card>
          </>
        )}
      </View>

      <FilterSheet
        visible={panelFiltros}
        categorias={categoriasDisponibles}
        monedas={monedasDisponibles}
        filtros={filtros}
        orden={orden}
        onAplicar={aplicarFiltros}
        onClose={() => setPanelFiltros(false)}
      />
    </Screen>
  )
}
