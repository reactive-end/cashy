/**
 * Summary screen: accounting overview with monthly indicators,
 * category breakdown bars and the largest unique expenses, all
 * expressed in the base currency using the day rates.
 */

import { useMemo } from 'react'
import { View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { EmptyState } from '@src/components/molecules/EmptyState'
import { CategoryBreakdown } from '@src/components/organisms/CategoryBreakdown'
import type { ChartCategory } from '@src/components/organisms/CategoryBreakdown'
import { MonthlySummary } from '@src/components/organisms/MonthlySummary'
import { useExpenses } from '@src/hooks/useExpenses'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { convert } from '@src/lib/conversions'
import { formatAmount } from '@src/lib/format'
import type { BaseCurrency } from '@src/types/domain'

/**
 * Pestaña de resumen con indicadores del mes, desglose por categoria
 * y mayores gastos unicos para apoyar la contabilidad personal.
 * @returns Resumen del mes, barras por categoria y top de gastos
 */
export default function Charts() {
  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const expensesState = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)

  const breakdownLoading = !ratesState.rates || expensesState.loading

  const categories = useMemo<ChartCategory[]>(() => {
    if (!ratesState.rates) return []

    const amountsByCategory = new Map<string, number>()

    for (const expense of expensesState.expenses) {
      const key = (expense.category ?? '').trim() || 'Sin categoria'
      const amount = convert(expense.amount, expense.currency, baseCurrency, ratesState.rates)
      amountsByCategory.set(key, (amountsByCategory.get(key) ?? 0) + amount)
    }

    const grandTotal = [...amountsByCategory.values()].reduce((sum, value) => sum + value, 0)

    if (grandTotal <= 0) return []

    return [...amountsByCategory.entries()]
      .map(([name, total]) => ({
        name,
        formattedAmount: formatAmount(total, baseCurrency),
        pct: Math.round((total / grandTotal) * 100)
      }))
      .sort((a, b) => b.pct - a.pct)
  }, [expensesState.expenses, ratesState.rates, baseCurrency])

  // Indicadores contables: total general, promedio diario y mayores gastos.
  const indicators = useMemo(() => {
    if (!ratesState.rates) return null

    let uniqueTotal = 0

    for (const expense of expensesState.uniqueExpenses) {
      uniqueTotal += convert(expense.amount, expense.currency, baseCurrency, ratesState.rates)
    }

    const dayOfMonth = new Date().getDate()
    const dailyAverage = dayOfMonth > 0 ? uniqueTotal / dayOfMonth : uniqueTotal

    return {
      uniqueTotal,
      dailyAverage,
      activeFixedCount: expensesState.fixedExpenses.length
    }
  }, [expensesState.uniqueExpenses, expensesState.fixedExpenses, ratesState.rates, baseCurrency])

  const topExpenses = useMemo(() => {
    const currentRates = ratesState.rates

    if (!currentRates) return []

    return [...expensesState.uniqueExpenses]
      .map((expense) => ({
        id: expense.id,
        name: expense.name,
        amount: convert(expense.amount, expense.currency, baseCurrency, currentRates)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map((expense) => ({
        id: expense.id,
        name: expense.name,
        formattedAmount: formatAmount(expense.amount, baseCurrency)
      }))
  }, [expensesState.uniqueExpenses, ratesState.rates, baseCurrency])

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
        <Typography variant="display">Resumen</Typography>

        <MonthlySummary
          summary={expensesState.monthlySummary}
          baseCurrency={baseCurrency}
          loading={!ratesState.rates || expensesState.loading}
        />

        {categories.length === 0 && !breakdownLoading ? (
          <EmptyState
            className="min-h-72"
            icon="chart"
            title="Sin datos para resumir"
            message="Registra gastos y aqui veras indicadores, desglose por categoria y tus mayores desembolsos."
          />
        ) : (
          <>
            <Card className="gap-3">
              <Typography variant="title">Indicadores del mes</Typography>

              {indicators ? (
                <View className="gap-2">
                  <View className="flex-row items-baseline justify-between gap-3">
                    <Typography variant="caption" className="text-faint">
                      Unicos del mes
                    </Typography>
                    <Typography variant="body">
                      {formatAmount(indicators.uniqueTotal, baseCurrency)}
                    </Typography>
                  </View>

                  <View className="flex-row items-baseline justify-between gap-3">
                    <Typography variant="caption" className="text-faint">
                      Promedio diario (unicos)
                    </Typography>
                    <Typography variant="body">
                      {formatAmount(indicators.dailyAverage, baseCurrency)}
                    </Typography>
                  </View>

                  <View className="flex-row items-baseline justify-between gap-3">
                    <Typography variant="caption" className="text-faint">
                      Gastos fijos activos
                    </Typography>
                    <Typography variant="body">{indicators.activeFixedCount}</Typography>
                  </View>
                </View>
              ) : (
                <Typography variant="caption">Calculando indicators...</Typography>
              )}
            </Card>

            <Card className="gap-4">
              <Typography variant="title">Desglose por categoria</Typography>
              <CategoryBreakdown items={categories} loading={breakdownLoading} />
            </Card>

            <Card className="gap-3">
              <Typography variant="title">Mayores gastos unicos</Typography>

              {topExpenses.length === 0 ? (
                <Typography variant="caption">Sin gastos unicos registrados</Typography>
              ) : (
                <View className="gap-2">
                  {topExpenses.map((expense) => (
                    <View
                      key={expense.id}
                      className="flex-row items-baseline justify-between gap-3"
                    >
                      <Typography variant="body" numberOfLines={1}>
                        {expense.name}
                      </Typography>
                      <Typography variant="figure" className="text-[13px]">
                        {expense.formattedAmount}
                      </Typography>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </>
        )}
      </View>
    </Screen>
  )
}
