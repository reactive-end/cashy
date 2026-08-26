/**
 * Organismo MonthlySummary: tarjeta destacada del inicio que resume
 * cuanto representan los fijos proyectados y lo gastado en unicos,
 * todo convertido a la moneda base del usuario. Mientras las tasas
 * no esten disponibles muestra indicadores de carga, nunca NaN.
 */

import { ActivityIndicator, View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'
import { currencySymbol, formatAmount } from '@src/lib/format'

import type { MonthlySummaryProps } from './MonthlySummary.d'

interface SummaryColumnProps {
  title: string
  value: string | null
  footer: string
  loading: boolean
  highlighted?: boolean
  alignEnd?: boolean
}

/**
 * Columna individual con etiqueta, valor y pie.
 * @param props Etiqueta superior, monto o carga, texto inferior y alineacion
 * @returns Columna del resumen lista para la tarjeta
 */
function SummaryColumn({
  title,
  value,
  footer,
  loading,
  highlighted = false,
  alignEnd = false
}: SummaryColumnProps) {
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
          className={`w-full text-[20px] leading-[24px] ${highlighted ? 'text-accent' : ''}`}
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
 * Renderiza la tarjeta resumen con dos columnas comparativas.
 * @param props Resumen calculado, moneda base y estado de carga de tasas
 * @returns Tarjeta de totales para la pantalla de inicio
 */
export function MonthlySummary({ summary, baseCurrency, loading = false }: MonthlySummaryProps) {
  const noData = !loading && !summary

  return (
    <Card highlighted className="gap-4">
      <View className="flex-row items-center gap-2">
        <Icon name="savings" size={18} color={COLORS.accent} />
        <Typography variant="label">Este mes</Typography>
      </View>

      <View className="flex-row">
        <SummaryColumn
          title="Gastos fijos"
          value={
            summary
              ? formatAmount(summary.totalFixed, baseCurrency)
              : `${currencySymbol(baseCurrency)} --`
          }
          footer="proyectados"
          loading={loading}
          highlighted
        />

        <View className="w-px bg-line" />

        <SummaryColumn
          title="Gastos unicos"
          value={
            summary
              ? formatAmount(summary.totalUnique, baseCurrency)
              : `${currencySymbol(baseCurrency)} --`
          }
          footer={summary ? `${summary.uniqueCount} registrados` : 'sin datos'}
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
