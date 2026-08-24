/**
 * Tipos publicos de la molecula EmptyState.
 * Mensaje ilustrado cuando una lista no tiene contenido.
 */

import type { ReactNode } from 'react'

import type { IconName } from '@src/components/atoms/Icon/Icon.d'

/** Propiedades del estado vacio */
export interface EmptyStateProps {
  /** Icono grande que ambienta la situacion */
  icon: IconName
  /** Titulo breve y amable */
  title: string
  /** Texto explicativo de como llenar la seccion */
  message: string
  /** Accion sugerida (boton) mostrada bajo el mensaje */
  action?: ReactNode
  /** Clases adicionales sobre el contenedor raiz */
  className?: string
}
