/**
 * Tipos publicos del atomo Screen.
 * Contenedor raiz de cada pantalla con area segura, scroll opcional,
 * pull-to-refresh y ranura para avisos flotantes.
 */

import type { ReactNode } from 'react'

/** Propiedades del atomo Screen */
export interface ScreenProps {
  /** Contenido de la pantalla */
  children: ReactNode
  /** Habilita desplazamiento vertical cuando el contenido excede la altura */
  scrollable?: boolean
  /** Oculta el padding horizontal base (pantallas a medida) */
  noPadding?: boolean
  /** Clases adicionales sobre el contenedor */
  className?: string
  /** Al proveerlo, habilita pull-to-refresh con este callback */
  onRefresh?: () => Promise<void>
  /** Estado controlado del indicador de refresco */
  refreshing?: boolean
  /** Aviso flotante (Toast) superpuesto fuera del area de scroll */
  overlay?: ReactNode
}
