/**
 * Pruebas unitarias de la libreria de comparacion de ofertas (comparator.ts).
 */

import { calculateImplicitRate, compareOffers } from '@src/lib/comparator'
import type { ExchangeRates } from '@src/types/domain'

describe('comparator', () => {
  const mockRates: ExchangeRates = {
    bcvUsd: 40.0,
    bcvEur: 44.0,
    usdtSellP2p: 48.0,
    fetchedAt: '2026-08-26T00:00:00.000Z'
  }

  describe('calculateImplicitRate', () => {
    it('retorna undefined si algun monto es 0 o negativo', () => {
      expect(
        calculateImplicitRate(
          { amount: 0, currency: 'VES' },
          { amount: 10, currency: 'USDT' },
          mockRates
        )
      ).toBeUndefined()
    })

    it('calcula la tasa implicita entre VES y USDT detectando sobreprecio', () => {
      // 1500 Bs vs 35 USDT -> Tasa = 42.86 Bs/USDT vs 48.00 P2P
      const result = calculateImplicitRate(
        { amount: 1500, currency: 'VES' },
        { amount: 35, currency: 'USDT' },
        mockRates
      )

      expect(result).toBeDefined()
      expect(result?.vendorRate).toBe(42.86)
      expect(result?.marketRate).toBe(48.0)
      expect(result?.isOverpriced).toBe(true)
      expect(result?.description).toContain('El comercio te recibe el USDT a 42,86 Bs.')
    })

    it('calcula la paridad cruzada entre USD y EUR cuando se cobra 1 a 1', () => {
      // 20 USD vs 20 EUR -> paridad 1.0 vs 44/40 = 1.10
      const result = calculateImplicitRate(
        { amount: 20, currency: 'USD' },
        { amount: 20, currency: 'EUR' },
        mockRates
      )

      expect(result).toBeDefined()
      expect(result?.vendorRate).toBe(1.0)
      expect(result?.marketRate).toBe(1.1)
      expect(result?.isOverpriced).toBe(true)
      expect(result?.description).toContain('Al recibirlo 1 a 1, pierdes')
    })

    it('retorna undefined si ambas ofertas son en la misma divisa', () => {
      expect(
        calculateImplicitRate(
          { amount: 100, currency: 'USD' },
          { amount: 90, currency: 'USD' },
          mockRates
        )
      ).toBeUndefined()
    })
  })

  describe('compareOffers', () => {
    it('retorna NONE si no hay tasas o los montos son cero', () => {
      const result = compareOffers(
        { amount: 0, currency: 'USD' },
        { amount: 10, currency: 'USDT' },
        mockRates,
        'USD'
      )
      expect(result.winner).toBe('NONE')

      const resultSinTasas = compareOffers(
        { amount: 10, currency: 'USD' },
        { amount: 10, currency: 'USDT' },
        null,
        'USD'
      )
      expect(resultSinTasas.winner).toBe('NONE')
    })

    it('declara ganadora a la Oferta A cuando cuesta menos en moneda base', () => {
      // Moneda base: USD
      // Oferta A: 1440 Bs -> 1440 / 40 = 36 USD
      // Oferta B: 40 USD -> 40 USD
      const result = compareOffers(
        { amount: 1440, currency: 'VES' },
        { amount: 40, currency: 'USD' },
        mockRates,
        'USD'
      )

      expect(result.winner).toBe('A')
      expect(result.amountBaseA).toBe(36)
      expect(result.amountBaseB).toBe(40)
      expect(result.savingsBase).toBe(4)
      expect(result.savingsPercentage).toBe(10)
      expect(result.verdictTitle).toContain('Opción A')
      expect(result.verdictSubtitle).toContain('4,00')
    })

    it('declara ganadora a la Oferta B cuando cuesta menos en moneda base', () => {
      // Moneda base: USDT
      // Oferta A: 2400 Bs -> 2400 / 48 = 50 USDT
      // Oferta B: 40 USDT -> 40 USDT
      const result = compareOffers(
        { amount: 2400, currency: 'VES' },
        { amount: 40, currency: 'USDT' },
        mockRates,
        'USDT'
      )

      expect(result.winner).toBe('B')
      expect(result.amountBaseA).toBe(50)
      expect(result.amountBaseB).toBe(40)
      expect(result.savingsBase).toBe(10)
      expect(result.savingsPercentage).toBe(20)
      expect(result.verdictTitle).toBe('Te conviene la Opción B (USDT)')
      expect(result.verdictTitle).not.toContain('[object Object]')
    })

    it('declara EQUAL si ambas opciones cuestan exactamente lo mismo', () => {
      const result = compareOffers(
        { amount: 1920, currency: 'VES' }, // 1920 / 48 = 40 USDT
        { amount: 40, currency: 'USDT' },
        mockRates,
        'USDT'
      )

      expect(result.winner).toBe('EQUAL')
      expect(result.savingsBase).toBe(0)
      expect(result.verdictTitle).toBe('Ambas opciones son equivalentes')
    })
  })
})
