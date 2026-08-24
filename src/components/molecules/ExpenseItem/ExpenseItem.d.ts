/**
 * Tipos publicos de la molecula ExpenseItem.
 * Fila presentacional de las listas de gastos fijos y unicos.
 */

import type { BadgeTone } from '@src/components/atoms/Badge/Badge.d'
import type { IconName } from '@src/components/atoms/Icon/Icon.d'

/** Insignia opcional mostrada junto al detalle del gasto */
export interface ExpenseBadge {
  text: string
  tone: BadgeTone
}

/** Propiedades de la fila de gasto */
export interface ExpenseItemProps {
  /** Icono contextual (categoria o tipo) */
  icon: IconName
  /** Nombre descriptivo del gasto */
  name: string
  /** Categoria legible o etiqueta alternativa; opcional */
  detail?: string
  /** Monto ya formateado en moneda base para la columna derecha */
  formattedAmount: string
  /** Monto original ya formateado en su moneda de registro */
  formattedOriginalAmount?: string
  /** Insignia de estado (vence manana, pagado, etc.); opcional */
  badge?: ExpenseBadge
  /** Identificador de prueba para automatizacion (Maestro); opcional */
  testID?: string
  /** Accion al tocar la fila */
  onPress?: () => void
}
