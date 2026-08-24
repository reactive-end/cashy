/**
 * Currency conversion helpers using daily rates.
 * Bolivars act as bridge currency: every conversion goes through VES.
 */

import type { Currency, ExchangeRates } from '@src/types/domain'

/**
 * Tasa de una moneda expresada en bolivares.
 * @param currency Moneda consultada
 * @param rates Snapshot vigente de tasas
 * @returns Bolivares por unidad de la moneda
 */
function rateInBolivars(currency: Currency, rates: ExchangeRates): number {
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
 * Convierte un monto entre dos monedas del sistema.
 * La ruta siempre es origen -> bolivares -> destino, lo que refleja
 * con honestidad la brecha entre BCV y USDT P2P.
 * @param amount Cantidad a convertir
 * @param from Moneda de origen
 * @param to Moneda de destino
 * @param rates Snapshot de tasas del dia
 * @returns Monto convertido redondeado a dos decimales
 */
export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates
): number {
  const enBolivares = amount * rateInBolivars(from, rates)
  const convertido = enBolivares / rateInBolivars(to, rates)
  return Math.round(convertido * 100) / 100
}
