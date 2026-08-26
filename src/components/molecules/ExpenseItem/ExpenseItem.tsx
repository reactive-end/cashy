/**
 * Molecula ExpenseItem: fila de lista para gastos fijos y unicos.
 * Muestra icono contextual, nombre, insignia de estado y montos
 * en moneda base y original cuando difieren.
 */

import { Pressable, View } from 'react-native'

import { Badge } from '@src/components/atoms/Badge'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'

import type { ExpenseItemProps } from './ExpenseItem.d'

/**
 * Renderiza la fila del gasto con jerarquia visual clara.
 * @param props Datos ya formateados por el organismo padre
 * @returns Fila presionable lista para listas planas
 */
export function ExpenseItem({
  testID,
  icon,
  name,
  detail,
  formattedAmount,
  formattedOriginalAmount,
  badge,
  onPress
}: ExpenseItemProps) {
  const showOriginal =
    formattedOriginalAmount !== undefined && formattedOriginalAmount !== formattedAmount

  return (
    <Pressable onPress={onPress} className="active:opacity-70" testID={testID}>
      <View className="flex-row items-center gap-3 py-3">
        <View className="size-10 items-center justify-center rounded-full border border-line bg-paper">
          <Icon name={icon} size={18} color="#6B6B66" />
        </View>

        <View className="flex-1 gap-1">
          <Typography variant="figure" numberOfLines={1}>
            {name}
          </Typography>

          {detail ? (
            <Typography variant="caption" numberOfLines={1}>
              {detail}
            </Typography>
          ) : null}

          {badge ? (
            <View className="self-start">
              <Badge text={badge.text} tone={badge.tone} />
            </View>
          ) : null}
        </View>

        <View className="items-end gap-0.5">
          <Typography variant="figure" className="text-[12px] leading-[16px]">
            {formattedAmount}
          </Typography>
          {showOriginal ? (
            <Typography variant="caption">{formattedOriginalAmount}</Typography>
          ) : null}
        </View>
      </View>
    </Pressable>
  )
}
