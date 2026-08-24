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
import { formatAmount, currencySymbol } from '@src/lib/format'

import type { MonthlySummaryProps } from './MonthlySummary.d'

/**
 * Columna individual con etiqueta, valor y pie.
 * @param props Etiqueta superior, monto o carga, texto inferior y alineacion
 * @returns Columna del resumen lista para la tarjeta
 */
function Columna({
  titulo,
  valor,
  pie,
  loading,
  destacado = false,
  alignEnd = false
}: {
  titulo: string
  valor: string | null
  pie: string
  loading: boolean
  destacado?: boolean
  alignEnd?: boolean
}) {
  const alineacion = alignEnd ? 'items-end text-right' : 'items-start'

  return (
    <View className={`flex-1 min-w-0 gap-1 ${alignEnd ? 'pl-3' : 'pr-3'} ${alineacion}`}>
      <Typography variant="caption" numberOfLines={1}>
        {titulo}
      </Typography>

      {loading ? (
        <View className="h-[26px] items-center justify-center">
          <ActivityIndicator size="small" color={COLORS.accent} />
        </View>
      ) : (
        <Typography
          variant="display"
          className={`w-full text-[20px] leading-[24px] ${destacado ? 'text-accent' : ''}`}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {valor}
        </Typography>
      )}

      <Typography variant="caption" numberOfLines={1}>
        {pie}
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
  const sinDatos = !loading && !summary

  return (
    <Card highlighted className="gap-4">
      <View className="flex-row items-center gap-2">
        <Icon name="savings" size={18} color={COLORS.accent} />
        <Typography variant="label">Este mes</Typography>
      </View>

      <View className="flex-row">
        <Columna
          titulo="Gastos fijos"
          valor={
            summary
              ? formatAmount(summary.totalFixed, baseCurrency)
              : `${currencySymbol(baseCurrency)} --`
          }
          pie="proyectados"
          loading={loading}
          destacado
        />

        <View className="w-px bg-line" />

        <Columna
          titulo="Gastos unicos"
          valor={
            summary
              ? formatAmount(summary.totalUnique, baseCurrency)
              : `${currencySymbol(baseCurrency)} --`
          }
          pie={summary ? `${summary.uniqueCount} registrados` : 'sin datos'}
          loading={loading}
          alignEnd
        />
      </View>

      {sinDatos ? (
        <Typography variant="caption">
          No pudimos cargar las tasas del dia; los totales esperan una conexion valida.
        </Typography>
      ) : null}
    </Card>
  )
}
