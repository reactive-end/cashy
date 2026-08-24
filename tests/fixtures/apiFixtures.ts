/**
 * Fixtures de respuestas de las APIs externas.
 * Espejan la forma real verificada de dolarapi.com y criptoya.com,
 * ademas de variantes corruptas para probar los guards.
 */

/** Respuesta valida del endpoint oficial de dolarapi */
export const DOLAR_OFICIAL_VALIDO = {
  moneda: 'USD',
  fuente: 'oficial',
  nombre: 'Dólar',
  compra: null,
  venta: null,
  promedio: 779.9522,
  fechaActualizacion: '2026-08-21T00:00:00-04:00'
}

/** Respuesta valida del endpoint oficial de euro en dolarapi */
export const EURO_OFICIAL_VALIDO = {
  moneda: 'EUR',
  fuente: 'oficial',
  nombre: 'Euro',
  compra: null,
  venta: null,
  promedio: 911.21815526,
  fechaActualizacion: '2026-08-21T00:00:00-04:00'
}

/** Tasa con promedio invalido para fallar el guard */
export const DOLAR_PROMEDIO_INVALIDO = {
  ...DOLAR_OFICIAL_VALIDO,
  promedio: -5
}

/** Objeto sin el campo promedio para fallar el guard */
export const DOLAR_SIN_CAMPOS = {
  moneda: 'USD'
}

/** Respuesta completa valida de CriptoYa con varios mercados P2P */
export const CRIPTOYA_USDT_VALIDO = {
  binancep2p: { ask: 919.91, totalAsk: 919.91, bid: 919, totalBid: 919, time: 1787499141 },
  bybitp2p: { ask: 918, totalAsk: 918, bid: 919, totalBid: 919, time: 1787499138 },
  okexp2p: { ask: 923, totalAsk: 923, bid: 916, totalBid: 916, time: 1787499148 },
  bitgetp2p: { ask: 921.8, totalAsk: 921.8, bid: 917, totalBid: 917, time: 1787499107 },
  bingxp2p: { ask: 923, totalAsk: 923, bid: 915, totalBid: 915, time: 1787499115 },
  mexcp2p: { ask: 920.95, totalAsk: 920.95, bid: 912.01, totalBid: 912.01, time: 1787499119 }
}

/** Respuesta sin mercado binancep2p para fallar el guard */
export const CRIPTOYA_SIN_BINANCE = {
  bybitp2p: { ask: 918, totalAsk: 918, bid: 919, totalBid: 919, time: 1787499138 }
}

/** Mercado binancep2p con ask no numerico para fallar el guard anidado */
export const CRIPTOYA_BINANCE_CORRUPTO = {
  binancep2p: { ask: 'caro', bid: 919 }
}
