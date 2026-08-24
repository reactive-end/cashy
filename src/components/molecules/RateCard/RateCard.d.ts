/**
 * Public types of the RateCard molecule.
 */

import type { IconName } from '@src/components/atoms/Icon/Icon.d'

/** Propiedades de la tarjeta de tasa */
export interface RateCardProps {
  /** Nombre de la tasa (ejemplo Dolar BCV) */
  title: string
  /** Valor ya formateado en bolivares */
  value: string
  /** Icono identificador de la divisa */
  icon: IconName
  /** Muestra esqueleto mientras llega el dato */
  loading?: boolean
  /** Clases adicionales sobre la tarjeta (flex, anchos) */
  className?: string
}
