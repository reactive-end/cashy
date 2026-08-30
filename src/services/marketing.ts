/**
 * Servicio de marketing y comunicados: gestiona la obtencion remota
 * de publicidad de asociados y anuncios/alertas oficiales desde Supabase,
 * con filtrado por planes, control de descarte en almacenamiento local y tolerancia a fallas de red.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

import { compareVersions } from '@src/lib/versions'
import { supabase } from '@src/services/supabase'
import type { AppAnnouncement, PartnerAd } from '@src/types/marketing'

/** Clave de AsyncStorage para el registro de IDs de anuncios descartados */
export const DISMISSED_ANNOUNCEMENTS_KEY = 'cashy.dismissed-announcements'

/** Clave de cache local para publicidad de asociados */
export const PARTNER_ADS_CACHE_KEY = 'cashy.partner-ads-cache'

/** Clave de cache local para alertas y noticias */
export const ANNOUNCEMENTS_CACHE_KEY = 'cashy.announcements-cache'

/**
 * Obtiene la lista de identificadores de comunicados descartados por el usuario.
 * @returns Conjunto de IDs descartados
 */
export async function getDismissedAnnouncementIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY)
    if (!raw) return new Set<string>()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set<string>()
  }
}

/**
 * Marca uno o varios comunicados como descartados en el almacenamiento persistente.
 * @param ids Identificadores de los comunicados a descartar
 */
export async function dismissAnnouncements(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  try {
    const current = await getDismissedAnnouncementIds()
    ids.forEach((id) => current.add(id))
    await AsyncStorage.setItem(
      DISMISSED_ANNOUNCEMENTS_KEY,
      JSON.stringify(Array.from(current))
    )
  } catch {
    // Ignora fallas de guardado local
  }
}

/**
 * Comprueba si un registro esta en su ventana de vigencia temporal.
 * @param startAt Fecha de inicio opcional en ISO
 * @param endAt Fecha de fin opcional en ISO
 * @param now Marca de tiempo actual en milisegundos
 * @returns true si el registro es valido temporalmente
 */
export function isWithinSchedule(
  startAt?: string | null,
  endAt?: string | null,
  now: number = Date.now()
): boolean {
  if (startAt) {
    const startTime = new Date(startAt).getTime()
    if (!Number.isNaN(startTime) && startTime > now) return false
  }

  if (endAt) {
    const endTime = new Date(endAt).getTime()
    if (!Number.isNaN(endTime) && endTime < now) return false
  }

  return true
}

/**
 * Comprueba si un anuncio de asociado debe mostrarse a un usuario segun su suscripcion.
 * Los usuarios PRO solo ven publicidad si el anuncio tiene show_to_pro activo o target_plan 'all'/'pro'.
 * @param ad Anuncio de asociado
 * @param isPro Si el usuario tiene suscripcion PRO activa
 * @returns true si el anuncio es visible para el usuario
 */
export function isAdVisibleForPlan(ad: PartnerAd, isPro: boolean): boolean {
  if (isPro) {
    return Boolean(ad.show_to_pro) || ad.target_plan === 'all' || ad.target_plan === 'pro'
  }
  return ad.target_plan === 'all' || ad.target_plan === 'free'
}

/**
 * Comprueba si un comunicado coincide con la version instalada de la aplicacion.
 * @param announcement Comunicado a validar
 * @param appVersion Version actual de Cashy instalada
 * @returns true si la version esta dentro de los rangos especificados
 */
export function isVersionEligible(
  announcement: AppAnnouncement,
  appVersion: string
): boolean {
  if (announcement.min_app_version) {
    if (compareVersions(appVersion, announcement.min_app_version) < 0) {
      return false
    }
  }

  if (announcement.max_app_version) {
    if (compareVersions(appVersion, announcement.max_app_version) > 0) {
      return false
    }
  }

  return true
}

/**
 * Comprueba si un comunicado es visible segun el plan del usuario.
 * @param announcement Comunicado a evaluar
 * @param isPro Si el usuario es PRO
 * @returns true si corresponde a la audiencia del comunicado
 */
export function isAnnouncementVisibleForPlan(
  announcement: AppAnnouncement,
  isPro: boolean
): boolean {
  if (announcement.target_plan === 'all') return true
  if (announcement.target_plan === 'pro') return isPro
  if (announcement.target_plan === 'free') return !isPro
  return true
}

/**
 * Consulta la publicidad activa para una ubicacion especifica desde Supabase.
 * En caso de falla de red, consulta la cache local.
 * @param placement Ubicacion requerida (por defecto 'home')
 * @param isPro Si el usuario actual es PRO
 * @returns El anuncio de mayor prioridad o null si no hay ninguno aplicable
 */
export async function getActivePartnerAd(
  placement: string = 'home',
  isPro: boolean = false
): Promise<PartnerAd | null> {
  try {
    const { data, error } = await supabase
      .from('partner_ads')
      .select('*')
      .eq('is_active', true)
      .eq('placement', placement)
      .order('priority', { ascending: false })

    if (error) throw error

    const ads = (data ?? []) as PartnerAd[]

    // Actualiza la cache local en segundo plano
    void AsyncStorage.setItem(PARTNER_ADS_CACHE_KEY, JSON.stringify(ads)).catch(() => null)

    const candidate = ads.find((ad) => {
      return isWithinSchedule(ad.start_at, ad.end_at) && isAdVisibleForPlan(ad, isPro)
    })

    return candidate ?? null
  } catch {
    // Degradacion offline: lee de cache local si existe
    try {
      const cachedRaw = await AsyncStorage.getItem(PARTNER_ADS_CACHE_KEY)
      if (!cachedRaw) return null
      const cachedAds = JSON.parse(cachedRaw) as PartnerAd[]
      const candidate = cachedAds.find((ad) => {
        return (
          ad.is_active &&
          ad.placement === placement &&
          isWithinSchedule(ad.start_at, ad.end_at) &&
          isAdVisibleForPlan(ad, isPro)
        )
      })
      return candidate ?? null
    } catch {
      return null
    }
  }
}

/**
 * Consulta los comunicados y noticias vigentes no descartados desde Supabase.
 * @param appVersion Version de la aplicacion en ejecucion
 * @param isPro Si el usuario actual es PRO
 * @returns Lista de comunicados activos y ordenados por prioridad
 */
export async function getActiveAnnouncements(
  appVersion: string,
  isPro: boolean = false
): Promise<AppAnnouncement[]> {
  try {
    const dismissedIds = await getDismissedAnnouncementIds()

    const { data, error } = await supabase
      .from('app_announcements')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (error) throw error

    const announcements = (data ?? []) as AppAnnouncement[]

    // Guarda en cache local
    void AsyncStorage.setItem(
      ANNOUNCEMENTS_CACHE_KEY,
      JSON.stringify(announcements)
    ).catch(() => null)

    return announcements.filter((item) => {
      if (item.is_dismissible && dismissedIds.has(item.id)) return false
      if (!isWithinSchedule(item.start_at, item.end_at)) return false
      if (!isAnnouncementVisibleForPlan(item, isPro)) return false
      if (!isVersionEligible(item, appVersion)) return false
      return true
    })
  } catch {
    // Fallback con cache local
    try {
      const dismissedIds = await getDismissedAnnouncementIds()
      const cachedRaw = await AsyncStorage.getItem(ANNOUNCEMENTS_CACHE_KEY)
      if (!cachedRaw) return []
      const cachedAnnouncements = JSON.parse(cachedRaw) as AppAnnouncement[]

      return cachedAnnouncements.filter((item) => {
        if (!item.is_active) return false
        if (item.is_dismissible && dismissedIds.has(item.id)) return false
        if (!isWithinSchedule(item.start_at, item.end_at)) return false
        if (!isAnnouncementVisibleForPlan(item, isPro)) return false
        if (!isVersionEligible(item, appVersion)) return false
        return true
      })
    } catch {
      return []
    }
  }
}
