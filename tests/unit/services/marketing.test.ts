/**
 * Pruebas unitarias para el servicio de marketing (marketing.ts).
 * Valida la logica de programacion de fechas, segmentacion por planes,
 * elegibilidad de versiones, persistencia de descartes y fallbacks offline.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  ANNOUNCEMENTS_CACHE_KEY,
  DISMISSED_ANNOUNCEMENTS_KEY,
  PARTNER_ADS_CACHE_KEY,
  dismissAnnouncements,
  getActiveAnnouncements,
  getActivePartnerAd,
  getDismissedAnnouncementIds,
  isAdVisibleForPlan,
  isAnnouncementVisibleForPlan,
  isVersionEligible,
  isWithinSchedule
} from '@src/services/marketing'
import { supabase } from '@src/services/supabase'
import type { AppAnnouncement, PartnerAd } from '@src/types/marketing'

const mockSampleAd: PartnerAd = {
  id: 'ad-1',
  title: 'Banco Aliado',
  description: 'Abre tu cuenta en minutos',
  badge_text: 'Patrocinado',
  image_url: 'https://example.com/banner.jpg',
  cta_label: 'Ver oferta',
  cta_action: 'url',
  cta_payload: 'https://ejemplo.com',
  placement: 'home',
  target_plan: 'free',
  show_to_pro: false,
  priority: 10,
  is_active: true,
  start_at: null,
  end_at: null
}

const mockSampleAnnouncement: AppAnnouncement = {
  id: 'ann-1',
  title: 'Mantenimiento programado',
  message: 'Estaremos mejorando las tasas.',
  category: 'maintenance',
  tone: 'warning',
  display_type: 'modal',
  is_dismissible: true,
  target_plan: 'all',
  min_app_version: '1.0.0',
  max_app_version: '2.0.0',
  priority: 5,
  is_active: true,
  start_at: null,
  end_at: null
}

describe('servicio de marketing', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  describe('isWithinSchedule', () => {
    it('retorna true si no hay fechas limites especificadas', () => {
      expect(isWithinSchedule(null, null)).toBe(true)
      expect(isWithinSchedule(undefined, undefined)).toBe(true)
    })

    it('retorna true si la fecha actual esta dentro del rango', () => {
      const now = new Date('2026-06-15T12:00:00Z').getTime()
      const start = '2026-06-01T00:00:00Z'
      const end = '2026-06-30T23:59:59Z'
      expect(isWithinSchedule(start, end, now)).toBe(true)
    })

    it('retorna false si aun no ha iniciado el periodo de vigencia', () => {
      const now = new Date('2026-05-31T23:59:59Z').getTime()
      const start = '2026-06-01T00:00:00Z'
      expect(isWithinSchedule(start, null, now)).toBe(false)
    })

    it('retorna false si ya paso la fecha limite de expiracion', () => {
      const now = new Date('2026-07-01T00:00:00Z').getTime()
      const end = '2026-06-30T23:59:59Z'
      expect(isWithinSchedule(null, end, now)).toBe(false)
    })
  })

  describe('isAdVisibleForPlan', () => {
    it('muestra anuncio con target_plan free a usuarios gratuitos y lo oculta a PRO', () => {
      const ad: PartnerAd = { ...mockSampleAd, target_plan: 'free', show_to_pro: false }
      expect(isAdVisibleForPlan(ad, false)).toBe(true)
      expect(isAdVisibleForPlan(ad, true)).toBe(false)
    })

    it('permite mostrar anuncio a usuario PRO si tiene show_to_pro habilitado', () => {
      const ad: PartnerAd = { ...mockSampleAd, target_plan: 'free', show_to_pro: true }
      expect(isAdVisibleForPlan(ad, true)).toBe(true)
    })

    it('muestra anuncio con target_plan all tanto a free como a pro', () => {
      const ad: PartnerAd = { ...mockSampleAd, target_plan: 'all', show_to_pro: false }
      expect(isAdVisibleForPlan(ad, false)).toBe(true)
      expect(isAdVisibleForPlan(ad, true)).toBe(true)
    })

    it('muestra anuncio con target_plan pro solo a usuarios pro', () => {
      const ad: PartnerAd = { ...mockSampleAd, target_plan: 'pro' }
      expect(isAdVisibleForPlan(ad, false)).toBe(false)
      expect(isAdVisibleForPlan(ad, true)).toBe(true)
    })
  })

  describe('isVersionEligible', () => {
    it('retorna true si el comunicado no define restricciones de version', () => {
      const ann: AppAnnouncement = {
        ...mockSampleAnnouncement,
        min_app_version: null,
        max_app_version: null
      }
      expect(isVersionEligible(ann, '1.1.0')).toBe(true)
    })

    it('valida cota inferior de version correctamente', () => {
      const ann: AppAnnouncement = { ...mockSampleAnnouncement, min_app_version: '1.2.0' }
      expect(isVersionEligible(ann, '1.1.0')).toBe(false)
      expect(isVersionEligible(ann, '1.2.0')).toBe(true)
      expect(isVersionEligible(ann, '1.3.0')).toBe(true)
    })

    it('valida cota superior de version correctamente', () => {
      const ann: AppAnnouncement = {
        ...mockSampleAnnouncement,
        min_app_version: null,
        max_app_version: '1.0.4'
      }
      expect(isVersionEligible(ann, '1.0.4')).toBe(true)
      expect(isVersionEligible(ann, '1.1.0')).toBe(false)
    })
  })

  describe('isAnnouncementVisibleForPlan', () => {
    it('cumple con target_plan all, free y pro', () => {
      const annAll: AppAnnouncement = { ...mockSampleAnnouncement, target_plan: 'all' }
      const annFree: AppAnnouncement = { ...mockSampleAnnouncement, target_plan: 'free' }
      const annPro: AppAnnouncement = { ...mockSampleAnnouncement, target_plan: 'pro' }

      expect(isAnnouncementVisibleForPlan(annAll, false)).toBe(true)
      expect(isAnnouncementVisibleForPlan(annAll, true)).toBe(true)

      expect(isAnnouncementVisibleForPlan(annFree, false)).toBe(true)
      expect(isAnnouncementVisibleForPlan(annFree, true)).toBe(false)

      expect(isAnnouncementVisibleForPlan(annPro, false)).toBe(false)
      expect(isAnnouncementVisibleForPlan(annPro, true)).toBe(true)
    })
  })

  describe('gestion de descartes en AsyncStorage', () => {
    it('guarda y recupera comunicados descartados', async () => {
      const initial = await getDismissedAnnouncementIds()
      expect(initial.size).toBe(0)

      await dismissAnnouncements(['ann-1', 'ann-2'])
      const after = await getDismissedAnnouncementIds()
      expect(after.has('ann-1')).toBe(true)
      expect(after.has('ann-2')).toBe(true)
      expect(after.has('ann-3')).toBe(false)

      await dismissAnnouncements([])
      expect((await getDismissedAnnouncementIds()).size).toBe(2)
    })

    it('maneja fallas de parseo en AsyncStorage degradando a vacio', async () => {
      await AsyncStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, 'corrupted-json')
      const set = await getDismissedAnnouncementIds()
      expect(set.size).toBe(0)
    })
  })

  describe('getActivePartnerAd', () => {
    it('obtiene el anuncio activo de mayor prioridad desde Supabase', async () => {
      const adHigh: PartnerAd = { ...mockSampleAd, id: 'ad-high', priority: 20 }
      const adLow: PartnerAd = { ...mockSampleAd, id: 'ad-low', priority: 5 }

      jest.spyOn(supabase, 'from').mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: [adHigh, adLow],
          error: null
        })
      } as never)

      const result = await getActivePartnerAd('home', false)
      expect(result?.id).toBe('ad-high')

      // Valida que guardo en cache
      const cached = await AsyncStorage.getItem(PARTNER_ADS_CACHE_KEY)
      expect(cached).toContain('ad-high')
    })

    it('recurre a la cache local si Supabase arroja error', async () => {
      const cachedAd: PartnerAd = { ...mockSampleAd, id: 'ad-cached' }
      await AsyncStorage.setItem(PARTNER_ADS_CACHE_KEY, JSON.stringify([cachedAd]))

      jest.spyOn(supabase, 'from').mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValueOnce(new Error('Network error'))
      } as never)

      const result = await getActivePartnerAd('home', false)
      expect(result?.id).toBe('ad-cached')
    })
  })

  describe('getActiveAnnouncements', () => {
    it('filtra comunicados no descartados y elegibles desde Supabase', async () => {
      const ann1: AppAnnouncement = { ...mockSampleAnnouncement, id: 'ann-1' }
      const ann2: AppAnnouncement = { ...mockSampleAnnouncement, id: 'ann-2' }

      await dismissAnnouncements(['ann-1'])

      jest.spyOn(supabase, 'from').mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: [ann1, ann2],
          error: null
        })
      } as never)

      const result = await getActiveAnnouncements('1.1.0', false)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('ann-2')
    })

    it('recurre a la cache local de comunicados si falla la consulta', async () => {
      const cachedAnn: AppAnnouncement = { ...mockSampleAnnouncement, id: 'ann-offline' }
      await AsyncStorage.setItem(ANNOUNCEMENTS_CACHE_KEY, JSON.stringify([cachedAnn]))

      jest.spyOn(supabase, 'from').mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValueOnce(new Error('Offline'))
      } as never)

      const result = await getActiveAnnouncements('1.1.0', false)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('ann-offline')
    })
  })
})
