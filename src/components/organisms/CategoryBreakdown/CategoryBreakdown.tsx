/**
 * Organismo CategoryBreakdown: desglose grafico horizontal de gastos
 * por categoria con barras proporcionales al total del periodo.
 * Barras puras con Views: sin dependencias nativas extra.
 */

import { View } from 'react-native'

import { Typography } from '@src/components/atoms/Typography'

import type { CategoryBreakdownProps } from './CategoryBreakdown.d'

/**
 * Renderiza una barra por categoria con etiqueta, monto y porcentaje.
 * @param props Categorias agregadas y estado de carga
 * @returns Tarjeta de barras horizontales ordenadas por gasto
 */
export function CategoryBreakdown({ items, loading = false }: CategoryBreakdownProps) {
  if (loading) {
    return <Typography variant="caption">Calculando desglose...</Typography>
  }

  return (
    <View className="gap-4">
      {items.map((item, index) => (
        <View key={item.name} className="gap-1.5">
          <View className="flex-row items-baseline justify-between gap-3">
            <Typography variant="body" numberOfLines={1}>
              {item.name}
            </Typography>
            <Typography variant="caption">{`${item.formattedAmount} · ${item.pct}%`}</Typography>
          </View>

          <View className="h-2 w-full overflow-hidden rounded-full bg-line">
            <View
              className={`h-full rounded-full ${index === 0 ? 'bg-accent' : 'bg-accent/60'}`}
              style={{ width: `${Math.max(item.pct, 2)}%` }}
            />
          </View>
        </View>
      ))}
    </View>
  )
}
