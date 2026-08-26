/**
 * Molecula IncomeItem: fila de lista enriquecida para fuentes de ingreso.
 * Muestra icono de ahorro, nombre, dia de cobro, insignia de cobro y montos.
 * Al tocarse navega a la pantalla de detalle del ingreso.
 */

import { Pressable, View } from 'react-native'

import { Badge } from '@src/components/atoms/Badge'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'

import type { IncomeItemProps } from './IncomeItem.d'

/**
 * Renderiza una fila de ingreso presionable con diseno homonimo al de gastos.
 * @param props Datos y callback onPress de la fuente de ingreso
 * @returns Fila interactiva con accesibilidad completa
 */
export function IncomeItem({
  testID,
  name,
  paydayDay,
  formattedAmount,
  formattedOriginalAmount,
  isConfirmed = false,
  onPress
}: IncomeItemProps) {
  const showOriginal =
    formattedOriginalAmount !== undefined && formattedOriginalAmount !== formattedAmount

  return (
    <Pressable onPress={onPress} className="active:opacity-70" testID={testID}>
      <View className="flex-row items-center gap-3 py-2.5">
        <View className="size-10 items-center justify-center rounded-full border border-line bg-paper">
          <Icon name="savings" size={18} color="#6B6B66" />
        </View>

        <View className="flex-1 gap-0.5 min-w-0">
          <Typography variant="figure" numberOfLines={1}>
            {name}
          </Typography>

          <View className="flex-row items-center gap-2">
            <Typography variant="caption" numberOfLines={1}>
              Dia {paydayDay}
            </Typography>
            <Badge
              text={isConfirmed ? 'Cobrado este mes' : 'Pendiente de cobro'}
              tone={isConfirmed ? 'success' : 'neutral'}
            />
          </View>
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
