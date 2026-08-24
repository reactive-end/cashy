/**
 * Tipos publicos del atomo Card.
 * Superficie basica blanca con borde hairline del estilo minimalista.
 */

import type { ViewProps } from 'react-native'

/** Propiedades del atomo Card */
export interface CardProps extends ViewProps {
  /** Elimina el padding interno para composiciones a medida */
  noPadding?: boolean
  /** Resalta el borde con el color de acento */
  highlighted?: boolean
}
