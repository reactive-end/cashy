/**
 * Molecula SegmentedControl: selector exclusivo de opciones cortas
 * (tipo de gasto, moneda, recurrencia) con estilo pill minimalista.
 */

import { Pressable, View } from 'react-native'

import { Typography } from '@src/components/atoms/Typography'

import type { SegmentOption, SegmentedControlProps } from './SegmentedControl.d'

/**
 * Renderiza la fila de segmentos con el valor activo resaltado.
 * @param props Opciones tipadas, valor actual y callback de cambio
 * @returns Control segmentado accesible y sin dependencias externas
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange
}: SegmentedControlProps<T>) {
  return (
    <View className="flex-row rounded-xl border border-line bg-card p-1">
      {options.map((option: SegmentOption<T>) => {
        const active = option.value === value

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`flex-1 rounded-lg py-2 ${active ? 'bg-accent' : ''}`}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
          >
            <Typography
              variant="caption"
              className={`text-center font-sans-semibold text-[12px] ${
                active ? 'text-paper' : 'text-muted'
              }`}
              numberOfLines={1}
            >
              {option.label}
            </Typography>
          </Pressable>
        )
      })}
    </View>
  )
}
