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
import type { CategoriaGrafica } from '@src/components/organisms/CategoryBreakdown'
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
  const gastos = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)

  const cargandoDesglose = !ratesState.rates || gastos.loading

  const categorias = useMemo<CategoriaGrafica[]>(() => {
    if (!ratesState.rates) return []

    const mapa = new Map<string, number>()

    for (const gasto of gastos.expenses) {
      const clave = (gasto.category ?? '').trim() || 'Sin categoria'
      const monto = convert(gasto.amount, gasto.currency, baseCurrency, ratesState.rates)
      mapa.set(clave, (mapa.get(clave) ?? 0) + monto)
    }

    const totalGeneral = [...mapa.values()].reduce((suma, valor) => suma + valor, 0)

    if (totalGeneral <= 0) return []

    return [...mapa.entries()]
      .map(([nombre, total]) => ({
        nombre,
        montoFormateado: formatAmount(total, baseCurrency),
        pct: Math.round((total / totalGeneral) * 100)
      }))
      .sort((a, b) => b.pct - a.pct)
  }, [gastos.expenses, ratesState.rates, baseCurrency])

  // Indicadores contables: total general, promedio diario y mayores gastos.
  const indicadores = useMemo(() => {
    if (!ratesState.rates) return null

    let totalUnicos = 0

    for (const gasto of gastos.uniqueExpenses) {
      totalUnicos += convert(gasto.amount, gasto.currency, baseCurrency, ratesState.rates)
    }

    const diaDelMes = new Date().getDate()
    const promedioDiario = diaDelMes > 0 ? totalUnicos / diaDelMes : totalUnicos

    return {
      totalUnicos,
      promedioDiario,
      fijosActivos: gastos.fixedExpenses.length
    }
  }, [gastos.uniqueExpenses, gastos.fixedExpenses, ratesState.rates, baseCurrency])

  const mayoresGastos = useMemo(() => {
    const tasas = ratesState.rates

    if (!tasas) return []

    return [...gastos.uniqueExpenses]
      .map((gasto) => ({
        id: gasto.id,
        name: gasto.name,
        monto: convert(gasto.amount, gasto.currency, baseCurrency, tasas)
      }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 3)
      .map((gasto) => ({
        id: gasto.id,
        name: gasto.name,
        montoFormateado: formatAmount(gasto.monto, baseCurrency)
      }))
  }, [gastos.uniqueExpenses, ratesState.rates, baseCurrency])

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
        <Typography variant="display">Resumen</Typography>

        <MonthlySummary
          summary={gastos.monthlySummary}
          baseCurrency={baseCurrency}
          loading={!ratesState.rates || gastos.loading}
        />

        {categorias.length === 0 && !cargandoDesglose ? (
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

              {indicadores ? (
                <View className="gap-2">
                  <View className="flex-row items-baseline justify-between gap-3">
                    <Typography variant="caption" className="text-faint">
                      Unicos del mes
                    </Typography>
                    <Typography variant="body">
                      {formatAmount(indicadores.totalUnicos, baseCurrency)}
                    </Typography>
                  </View>

                  <View className="flex-row items-baseline justify-between gap-3">
                    <Typography variant="caption" className="text-faint">
                      Promedio diario (unicos)
                    </Typography>
                    <Typography variant="body">
                      {formatAmount(indicadores.promedioDiario, baseCurrency)}
                    </Typography>
                  </View>

                  <View className="flex-row items-baseline justify-between gap-3">
                    <Typography variant="caption" className="text-faint">
                      Gastos fijos activos
                    </Typography>
                    <Typography variant="body">{indicadores.fijosActivos}</Typography>
                  </View>
                </View>
              ) : (
                <Typography variant="caption">Calculando indicadores...</Typography>
              )}
            </Card>

            <Card className="gap-4">
              <Typography variant="title">Desglose por categoria</Typography>
              <CategoryBreakdown items={categorias} loading={cargandoDesglose} />
            </Card>

            <Card className="gap-3">
              <Typography variant="title">Mayores gastos unicos</Typography>

              {mayoresGastos.length === 0 ? (
                <Typography variant="caption">Sin gastos unicos registrados</Typography>
              ) : (
                <View className="gap-2">
                  {mayoresGastos.map((gasto) => (
                    <View key={gasto.id} className="flex-row items-baseline justify-between gap-3">
                      <Typography variant="body" numberOfLines={1}>
                        {gasto.name}
                      </Typography>
                      <Typography variant="figure" className="text-[13px]">
                        {gasto.montoFormateado}
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
