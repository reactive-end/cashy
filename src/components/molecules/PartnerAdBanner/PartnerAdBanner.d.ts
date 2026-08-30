/**
 * Tipos para la molecula PartnerAdBanner.
 */

import type { PartnerAd } from '@src/types/marketing'

/** Props del componente PartnerAdBanner */
export interface PartnerAdBannerProps {
  /** Anuncio de asociado a mostrar. Si es null, no renderiza nada. */
  ad: PartnerAd | null
  /** Clases adicionales de estilo */
  className?: string
  /** Callback opcional cuando se interactua con la accion */
  onPress?: () => void
}
