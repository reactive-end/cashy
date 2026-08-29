/**
 * Organismo MonthlySummary: tarjeta destacada del inicio que resume
 * el balance neto disponible (ingresos cobrados - gastos), los ingresos
 * confirmados y los desembolsos, todo en moneda base del usuario.
 */

import { ActivityIndicator, View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'
import { currencySymbol, formatAmount } from '@src/lib/format'

import type { MonthlySummaryProps } from './MonthlySummary.d'

interface SummaryMetricProps {
  title: string
  value: string | null
  footer: string
  loading: boolean
  highlighted?: boolean
  alignEnd?: boolean
}

/**
 * Celda metrica individual con etiqueta, valor y pie.
 */
function SummaryMetric({
  title,
  value,
  footer,
  loading,
  highlighted = false,
  alignEnd = false
}: SummaryMetricProps) {
  const alignment = alignEnd ? 'items-end text-right' : 'items-start'

  return (
    <View className={`flex-1 min-w-0 gap-1 ${alignEnd ? 'pl-3' : 'pr-3'} ${alignment}`}>
      <Typography variant="caption" numberOfLines={1}>
        {title}
      </Typography>

      {loading ? (
        <View className="h-[26px] items-center justify-center">
          <ActivityIndicator size="small" color={COLORS.accent} />
        </View>
      ) : (
        <Typography
          variant="display"
          className={`w-full text-[18px] leading-[22px] ${highlighted ? 'text-accent' : ''}`}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Typography>
      )}

      <Typography variant="caption" numberOfLines={1}>
        {footer}
      </Typography>
    </View>
  )
}

/**
 * Renderiza la tarjeta resumen con balance disponible e ingresos/gastos.
 * @param props Resumen calculado, moneda base y estado de carga de tasas
 * @returns Tarjeta de totales para la pantalla de inicio y resumen
 */
export function MonthlySummary({ summary, baseCurrency, loading = false }: MonthlySummaryProps) {
  const noData = !loading && !summary
  const totalSpent = summary ? summary.totalFixed + summary.totalUnique : 0
  const symbol = currencySymbol(baseCurrency)

  const netBalanceDisplay = summary
    ? formatAmount(summary.netBalance, baseCurrency)
    : `${symbol} --`

  const confirmedIncomeDisplay = summary
    ? formatAmount(summary.confirmedIncome, baseCurrency)
    : `${symbol} --`

  const totalSpentDisplay = summary ? formatAmount(totalSpent, baseCurrency) : `${symbol} --`

  return (
    <Card highlighted className="gap-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon name="savings" size={18} color={COLORS.accent} />
          <Typography variant="label">Balance de este mes</Typography>
        </View>
      </View>

      <View className="gap-1 rounded-xl bg-card p-3.5 border border-line">
        <Typography variant="caption" className="text-faint">
          Balance disponible
        </Typography>
        {loading ? (
          <View className="h-[32px] items-start justify-center">
            <ActivityIndicator size="small" color={COLORS.accent} />
          </View>
        ) : (
          <Typography
            variant="display"
            className="text-[26px] leading-[30px] text-accent"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {netBalanceDisplay}
          </Typography>
        )}
        <Typography variant="caption" className="text-faint">
          Ingresos cobrados menos gastos totales
        </Typography>
      </View>

      <View className="flex-row">
        <SummaryMetric
          title="Ingresos cobrados"
          value={confirmedIncomeDisplay}
          footer="efectivos"
          loading={loading}
          highlighted
        />

        <View className="w-px bg-line" />

        <SummaryMetric
          title="Gastos del mes"
          value={totalSpentDisplay}
          footer={summary ? `${summary.uniqueCount} unicos + fijos` : 'sin datos'}
          loading={loading}
          alignEnd
        />
      </View>

      {noData ? (
        <Typography variant="caption">
          No pudimos cargar las tasas del dia; los totales esperan una conexion valida.
        </Typography>
      ) : null}
    </Card>
  )
}
