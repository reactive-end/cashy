/**
 * Definiciones de tipos para publicidad de asociados y comunicados/noticias de la aplicacion.
 */

import type { IconName } from '@src/components/atoms/Icon/Icon.d'

/** Tipo de accion ejecutable desde un anuncio o comunicado */
export type AdActionType = 'url' | 'route' | 'copy'

/** Tipo de accion para botones en anuncios y noticias */
export type AnnouncementActionType = 'url' | 'route' | 'dismiss'

/** Categoria tematica de un comunicado */
export type AnnouncementCategory = 'news' | 'alert' | 'maintenance' | 'tip' | 'promo'

/** Tono visual y de color para la interfaz del comunicado */
export type AnnouncementTone = 'info' | 'warning' | 'danger' | 'success' | 'accent'

/** Plan de destino para la segmentacion */
export type TargetPlan = 'all' | 'free' | 'pro'

/**
 * Registro de publicidad de asociado gestionado remotamente desde Supabase.
 */
export interface PartnerAd {
  id: string
  title: string
  description?: string | null
  badge_text?: string | null
  image_url?: string | null
  image_aspect_ratio?: string | null
  cta_label: string
  cta_action: AdActionType
  cta_payload: string
  bg_color?: string | null
  text_color?: string | null
  accent_color?: string | null
  placement: string
  target_plan: TargetPlan
  show_to_pro?: boolean | null
  priority: number
  is_active: boolean
  start_at?: string | null
  end_at?: string | null
  metadata?: Record<string, string | number | boolean>
}

/**
 * Comunicado, alerta o noticia oficial de la aplicacion gestionada remotamente.
 */
export interface AppAnnouncement {
  id: string
  title: string
  message: string
  category: AnnouncementCategory
  tone: AnnouncementTone
  icon_name?: IconName | null
  image_url?: string | null
  display_type: 'modal' | 'card' | 'banner'
  is_dismissible: boolean
  primary_cta_label?: string | null
  primary_cta_action?: AnnouncementActionType | null
  primary_cta_payload?: string | null
  secondary_cta_label?: string | null
  secondary_cta_action?: AnnouncementActionType | null
  secondary_cta_payload?: string | null
  target_plan: TargetPlan
  min_app_version?: string | null
  max_app_version?: string | null
  priority: number
  is_active: boolean
  start_at?: string | null
  end_at?: string | null
}
