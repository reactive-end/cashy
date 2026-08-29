/**
 * Molecula EmptyState: acompana las listas sin registros
 * invitando al usuario a crear su primer gasto.
 */

import { View } from 'react-native'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'

import type { EmptyStateProps } from './EmptyState.d'

/**
 * Renderiza icono, titulos y accion centrados verticalmente.
 * @param props Icono, titulo, mensaje y boton opcional
 * @returns Bloque de vacio para listas y secciones
 */
export function EmptyState({ icon, title, message, action, className }: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center gap-4 px-6 py-12 ${className ?? ''}`}>
      <View className="size-14 items-center justify-center rounded-full bg-paper border border-line">
        <Icon name={icon} size={26} color="#70706A" />
      </View>

      <View className="items-center gap-1">
        <Typography variant="title">{title}</Typography>
        <Typography variant="caption" className="text-center text-[13px] leading-[18px]">
          {message}
        </Typography>
      </View>

      {action ? <View className="w-full">{action}</View> : null}
    </View>
  )
}
