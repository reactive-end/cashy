/**
 * Hook reactivo para publicidad de asociados y comunicados/noticias de la aplicacion.
 * Consulta la base de datos de Supabase considerando el estado PRO del usuario y la version actual.
 */

import { useCallback, useEffect, useState } from 'react'

import { useSubscription } from '@src/hooks/useSubscription'
import { subscribe } from '@src/lib/events'
import { installedVersion } from '@src/services/appUpdate'
import {
  dismissAnnouncements,
  getActiveAnnouncements,
  getActivePartnerAd
} from '@src/services/marketing'
import type { AppAnnouncement, PartnerAd } from '@src/types/marketing'

/** Estado y metodos expuestos por el hook useMarketing */
export interface UseMarketingResult {
  partnerAd: PartnerAd | null
  announcements: AppAnnouncement[]
  loading: boolean
  dismissAllAnnouncements: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Hook que gestiona los anuncios comerciales activos y las noticias no descartadas.
 * @param placement Ubicacion deseada para los anuncios (por defecto 'home')
 * @returns Estado de marketing y metodos de control
 */
export function useMarketing(placement: string = 'home'): UseMarketingResult {
  const { isPro } = useSubscription()
  const appVersion = installedVersion() || '1.1.0'

  const [partnerAd, setPartnerAd] = useState<PartnerAd | null>(null)
  const [announcements, setAnnouncements] = useState<AppAnnouncement[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [ad, news] = await Promise.all([
        getActivePartnerAd(placement, isPro),
        getActiveAnnouncements(appVersion, isPro)
      ])
      setPartnerAd(ad)
      setAnnouncements(news)
    } finally {
      setLoading(false)
    }
  }, [appVersion, isPro, placement])

  useEffect(() => {
    void loadData()

    const unsubscribe = subscribe('auth-changed', () => {
      void loadData()
    })

    return () => {
      unsubscribe()
    }
  }, [loadData])

  const handleDismissAll = useCallback(async () => {
    const ids = announcements.map((a) => a.id)
    await dismissAnnouncements(ids)
    setAnnouncements([])
  }, [announcements])

  return {
    partnerAd,
    announcements,
    loading,
    dismissAllAnnouncements: handleDismissAll,
    refresh: loadData
  }
}
