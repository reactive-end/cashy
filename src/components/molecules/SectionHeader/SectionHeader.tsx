/**
 * Molecula SectionHeader: titulo editorial de seccion
 * con accion secundaria opcional alineada a la derecha.
 */

import { Pressable, View } from 'react-native'

import { Typography } from '@src/components/atoms/Typography'

import type { SectionHeaderProps } from './SectionHeader.d'

/**
 * Renderiza el encabezado con jerarquia tipografica Fraunces.
 * @param props Titulo y accion opcional
 * @returns Encabezado consistente entre pantallas
 */
export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <View className="flex-row items-baseline justify-between">
      <Typography variant="title">{title}</Typography>

      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} className="active:opacity-60">
          <Typography variant="caption" className="font-sans-semibold text-accent">
            {actionLabel}
          </Typography>
        </Pressable>
      ) : null}
    </View>
  )
}
