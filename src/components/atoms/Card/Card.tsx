/**
 * Atomo Card: contenedor de superficie blanca con borde fino,
 * base visual de tarjetas de tasas, resumenes y formularios.
 */

import { View } from 'react-native'

import type { CardProps } from './Card.d'

/**
 * Renderiza una superficie elevada sutil sobre el fondo papel.
 * @param props Propiedades nativas de View mas opciones de padding y resaltado
 * @returns Contenedor tipo tarjeta listo para componer contenido
 */
export function Card({ noPadding = false, highlighted = false, className, ...rest }: CardProps) {
  const clases = [
    'rounded-2xl bg-card border',
    highlighted ? 'border-accent' : 'border-line',
    noPadding ? '' : 'p-4',
    className ?? ''
  ]

  return <View className={clases.filter(Boolean).join(' ')} {...rest} />
}
