/**
 * Logica pura de comparacion de metodos y ofertas de pago.
 * Determina que divisa conviene pagar evaluando la brecha cambiaria,
 * el ahorro real en moneda base y la tasa implicita aplicada por el comercio.
 */

import { convert } from '@src/lib/conversions'
import { formatAmount, formatNumber } from '@src/lib/format'
import type { BaseCurrency, Currency, ExchangeRates } from '@src/types/domain'

/** Oferta de pago con monto y divisa seleccionada */
export interface PaymentOffer {
  readonly amount: number
  readonly currency: Currency
}

/** Detalle de la tasa implicita entre bolivares y divisas o paridades cruzadas */
export interface ImplicitRateDetail {
  readonly foreignCurrency: Currency
  readonly vendorRate: number
  readonly marketRate: number
  readonly gapPercentage: number
  readonly description: string
  readonly isOverpriced: boolean
}

/** Ganador de la comparacion */
export type ComparisonWinner = 'A' | 'B' | 'EQUAL' | 'NONE'

/** Resultado de la evaluacion comparativa de pago */
export interface PaymentComparisonResult {
  readonly winner: ComparisonWinner
  readonly amountBaseA: number
  readonly amountBaseB: number
  readonly savingsBase: number
  readonly savingsPercentage: number
  readonly implicitRate?: ImplicitRateDetail
  readonly verdictTitle: string
  readonly verdictSubtitle: string
}

/**
 * Obtiene la tasa de mercado de referencia en bolivares por unidad de divisa.
 * @param currency Moneda consultada
 * @param rates Snapshot de tasas del dia
 * @returns Tasa en bolivares
 */
function getMarketRate(currency: Currency, rates: ExchangeRates): number {
  switch (currency) {
    case 'VES':
      return 1
    case 'USD':
      return rates.bcvUsd
    case 'USDT':
      return rates.usdtSellP2p
    case 'EUR':
      return rates.bcvEur
  }
}

/**
 * Calcula la tasa implicita si una oferta es en VES y otra en divisa, o USD vs EUR.
 * @param offerA Primera oferta
 * @param offerB Segunda oferta
 * @param rates Snapshot de tasas
 * @returns Detalle de la tasa implicita o undefined si no aplica
 */
export function calculateImplicitRate(
  offerA: PaymentOffer,
  offerB: PaymentOffer,
  rates: ExchangeRates
): ImplicitRateDetail | undefined {
  if (offerA.amount <= 0 || offerB.amount <= 0) return undefined

  // Caso 1: Una oferta es VES y la otra es divisa extranjera (USD, USDT, EUR)
  const isVesA = offerA.currency === 'VES'
  const isVesB = offerB.currency === 'VES'

  if ((isVesA && !isVesB) || (isVesB && !isVesA)) {
    const vesOffer = isVesA ? offerA : offerB
    const foreignOffer = isVesA ? offerB : offerA

    const vendorRate = vesOffer.amount / foreignOffer.amount
    const marketRate = getMarketRate(foreignOffer.currency, rates)

    if (marketRate <= 0) return undefined

    // Si el comercio recibe la divisa por debajo del mercado (o cobra sobreprecio en Bs)
    const gapPercentage = Math.abs((vendorRate - marketRate) / marketRate) * 100

    const isOverpriced =
      foreignOffer.currency === 'USDT' ? vendorRate < marketRate : vendorRate > marketRate

    let description = ''
    if (foreignOffer.currency === 'USDT') {
      if (vendorRate < marketRate) {
        description = `El comercio te recibe el USDT a ${formatNumber(vendorRate)} Bs. (mercado P2P: ${formatNumber(marketRate)} Bs.).`
      } else if (vendorRate > marketRate) {
        description = `El comercio te reconoce ${formatNumber(vendorRate)} Bs. por USDT (por encima de los ${formatNumber(marketRate)} Bs. de mercado).`
      } else {
        description = `El comercio aplica exactamente la tasa P2P de mercado (${formatNumber(marketRate)} Bs./USDT).`
      }
    } else {
      if (vendorRate > marketRate) {
        description = `El comercio calcula a ${formatNumber(vendorRate)} Bs. por ${foreignOffer.currency} (tasa oficial BCV: ${formatNumber(marketRate)} Bs.).`
      } else if (vendorRate < marketRate) {
        description = `El comercio toma la tasa por debajo del BCV (${formatNumber(vendorRate)} Bs. vs ${formatNumber(marketRate)} Bs.).`
      } else {
        description = `El comercio aplica la tasa oficial BCV (${formatNumber(marketRate)} Bs.).`
      }
    }

    return {
      foreignCurrency: foreignOffer.currency,
      vendorRate: Math.round(vendorRate * 100) / 100,
      marketRate: Math.round(marketRate * 100) / 100,
      gapPercentage: Math.round(gapPercentage * 10) / 10,
      description,
      isOverpriced
    }
  }

  // Caso 2: USD vs EUR (descuento indebido 1 a 1)
  const isUsdEur =
    (offerA.currency === 'USD' && offerB.currency === 'EUR') ||
    (offerA.currency === 'EUR' && offerB.currency === 'USD')

  if (isUsdEur && rates.bcvUsd > 0) {
    const usdOffer = offerA.currency === 'USD' ? offerA : offerB
    const eurOffer = offerA.currency === 'EUR' ? offerA : offerB

    const vendorParity = usdOffer.amount / eurOffer.amount
    const marketParity = rates.bcvEur / rates.bcvUsd

    const gapPercentage = Math.abs((vendorParity - marketParity) / marketParity) * 100

    const isOverpriced = vendorParity < marketParity
    const description =
      vendorParity === 1
        ? `El euro oficial equivale a ${formatNumber(marketParity)} USD. Al recibirlo 1 a 1, pierdes ${formatNumber(gapPercentage)}% de valor.`
        : `Paridad aplicada: 1 EUR = ${formatNumber(vendorParity)} USD (oficial BCV: ${formatNumber(marketParity)} USD).`

    return {
      foreignCurrency: 'EUR',
      vendorRate: Math.round(vendorParity * 100) / 100,
      marketRate: Math.round(marketParity * 100) / 100,
      gapPercentage: Math.round(gapPercentage * 10) / 10,
      description,
      isOverpriced
    }
  }

  return undefined
}

/**
 * Compara dos ofertas de pago en cualquier combinacion de las 4 divisas de Cashy.
 * @param offerA Primera oferta
 * @param offerB Segunda oferta
 * @param rates Snapshot de tasas vigente (null si no esta disponible)
 * @param baseCurrency Moneda base del usuario
 * @returns Resultado completo de la comparacion
 */
export function compareOffers(
  offerA: PaymentOffer,
  offerB: PaymentOffer,
  rates: ExchangeRates | null,
  baseCurrency: BaseCurrency
): PaymentComparisonResult {
  if (!rates || offerA.amount <= 0 || offerB.amount <= 0) {
    return {
      winner: 'NONE',
      amountBaseA: 0,
      amountBaseB: 0,
      savingsBase: 0,
      savingsPercentage: 0,
      verdictTitle: 'Ingresa ambos montos',
      verdictSubtitle: 'Indica el precio en cada divisa para conocer cual opcion te conviene'
    }
  }

  const amountBaseA = convert(offerA.amount, offerA.currency, baseCurrency, rates)
  const amountBaseB = convert(offerB.amount, offerB.currency, baseCurrency, rates)

  const diff = Math.abs(amountBaseA - amountBaseB)
  const roundedDiff = Math.round(diff * 100) / 100
  const maxAmount = Math.max(amountBaseA, amountBaseB)
  const savingsPercentage = maxAmount > 0 ? Math.round((roundedDiff / maxAmount) * 1000) / 10 : 0

  const implicitRate = calculateImplicitRate(offerA, offerB, rates)

  if (roundedDiff === 0) {
    return {
      winner: 'EQUAL',
      amountBaseA,
      amountBaseB,
      savingsBase: 0,
      savingsPercentage: 0,
      implicitRate,
      verdictTitle: 'Ambas opciones son equivalentes',
      verdictSubtitle: `El costo real es el mismo (${formatAmount(amountBaseA, baseCurrency)})`
    }
  }

  const isAWinner = amountBaseA < amountBaseB
  const winner: ComparisonWinner = isAWinner ? 'A' : 'B'
  const winnerCurrency: Currency = isAWinner ? offerA.currency : offerB.currency
  const winnerLabel = isAWinner ? 'Opción A' : 'Opción B'

  const formattedSavings = formatAmount(roundedDiff, baseCurrency)

  return {
    winner,
    amountBaseA,
    amountBaseB,
    savingsBase: roundedDiff,
    savingsPercentage,
    implicitRate,
    verdictTitle: `Te conviene la ${winnerLabel} (${winnerCurrency})`,
    verdictSubtitle: `Ahorras ${formattedSavings} (${formatNumber(savingsPercentage)}% menos)`
  }
}
