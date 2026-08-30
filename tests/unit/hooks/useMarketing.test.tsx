/**
 * Pruebas unitarias para el hook useMarketing.
 */

import { act, renderHook } from '@testing-library/react-native'

import { useMarketing } from '@src/hooks/useMarketing'
import { useSubscription } from '@src/hooks/useSubscription'
import * as marketingService from '@src/services/marketing'
import type { AppAnnouncement, PartnerAd } from '@src/types/marketing'

jest.mock('@src/hooks/useSubscription')
jest.mock('@src/services/marketing')

const useSubscriptionMock = useSubscription as jest.Mock
const getActivePartnerAdMock = marketingService.getActivePartnerAd as jest.Mock
const getActiveAnnouncementsMock = marketingService.getActiveAnnouncements as jest.Mock
const dismissAnnouncementsMock = marketingService.dismissAnnouncements as jest.Mock

const mockAd: PartnerAd = {
  id: 'ad-10',
  title: 'Seguros Plus',
  cta_label: 'Saber más',
  cta_action: 'url',
  cta_payload: 'https://plus.com',
  placement: 'home',
  target_plan: 'all',
  priority: 1,
  is_active: true
}

const mockAnn: AppAnnouncement = {
  id: 'ann-20',
  title: 'Nueva versión 1.1.0',
  message: 'Disfruta de las nuevas funciones',
  category: 'news',
  tone: 'accent',
  display_type: 'modal',
  is_dismissible: true,
  target_plan: 'all',
  priority: 1,
  is_active: true
}

describe('useMarketing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useSubscriptionMock.mockReturnValue({ isPro: false })
    getActivePartnerAdMock.mockResolvedValue(mockAd)
    getActiveAnnouncementsMock.mockResolvedValue([mockAnn])
    dismissAnnouncementsMock.mockResolvedValue(undefined)
  })

  it('carga anuncios y comunicados activos al montar', async () => {
    const { result } = await renderHook(() => useMarketing('home'))

    expect(result.current.partnerAd).toEqual(mockAd)
    expect(result.current.announcements).toEqual([mockAnn])
    expect(result.current.loading).toBe(false)
  })

  it('permite descartar todos los comunicados activos', async () => {
    const { result } = await renderHook(() => useMarketing('home'))

    await act(async () => {
      await result.current.dismissAllAnnouncements()
    })

    expect(dismissAnnouncementsMock).toHaveBeenCalledWith(['ann-20'])
    expect(result.current.announcements).toEqual([])
  })
})
