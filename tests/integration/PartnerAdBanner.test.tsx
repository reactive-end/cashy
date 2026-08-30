/**
 * Pruebas de integracion para la molecula PartnerAdBanner.
 */

import * as Clipboard from 'expo-clipboard'
import { render, userEvent } from '@testing-library/react-native'
import { Linking } from 'react-native'

import { PartnerAdBanner } from '@src/components/molecules/PartnerAdBanner'
import type { PartnerAd } from '@src/types/marketing'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush })
}))

const sampleAd: PartnerAd = {
  id: 'ad-test',
  title: 'Tienda Tecnológica',
  description: 'Descuentos exclusivos en dispositivos',
  badge_text: 'Oferta',
  image_url: 'https://img.example.com/banner.jpg',
  cta_label: 'Comprar ahora',
  cta_action: 'url',
  cta_payload: 'https://tienda.example.com',
  placement: 'home',
  target_plan: 'free',
  priority: 1,
  is_active: true
}

describe('PartnerAdBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true)
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)
  })

  it('no renderiza nada si ad es null', async () => {
    const { toJSON } = await render(<PartnerAdBanner ad={null} />)
    expect(toJSON()).toBeNull()
  })

  it('renderiza la informacion del anuncio correctamente', async () => {
    const screen = await render(<PartnerAdBanner ad={sampleAd} />)

    expect(screen.getByText('Oferta')).toBeTruthy()
    expect(screen.getByText('Tienda Tecnológica')).toBeTruthy()
    expect(screen.getByText('Descuentos exclusivos en dispositivos')).toBeTruthy()
    expect(screen.getByText('Comprar ahora')).toBeTruthy()
  })

  it('abre enlace externo cuando cta_action es url', async () => {
    const screen = await render(<PartnerAdBanner ad={sampleAd} />)
    const user = userEvent.setup()

    await user.press(screen.getByText('Comprar ahora'))

    expect(Linking.canOpenURL).toHaveBeenCalledWith('https://tienda.example.com')
    expect(Linking.openURL).toHaveBeenCalledWith('https://tienda.example.com')
  })

  it('copia cupon al portapapeles cuando cta_action es copy', async () => {
    const copyAd: PartnerAd = {
      ...sampleAd,
      cta_action: 'copy',
      cta_payload: 'CASHY2026',
      cta_label: 'Copiar cupón'
    }

    const screen = await render(<PartnerAdBanner ad={copyAd} />)
    const user = userEvent.setup()

    await user.press(screen.getByText('Copiar cupón'))

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('CASHY2026')
    expect(screen.getByText('Copiado al portapapeles')).toBeTruthy()
  })

  it('navega internamente cuando cta_action es route', async () => {
    const routeAd: PartnerAd = {
      ...sampleAd,
      cta_action: 'route',
      cta_payload: '/market',
      cta_label: 'Ir al mercado'
    }

    const screen = await render(<PartnerAdBanner ad={routeAd} />)
    const user = userEvent.setup()

    await user.press(screen.getByText('Ir al mercado'))

    expect(mockPush).toHaveBeenCalledWith('/market')
  })
})
