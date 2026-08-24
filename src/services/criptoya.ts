/**
 * Client for the criptoya.com USDT/VES service.
 * Devuelve la tasa de VENTA referencial del USDT: la minima puja
 * (bid) entre los mercados P2P principales. Es el valor conservador
 * que una persona puede alcanzar realmente al liquidar USDT, por
 * debajo del mejor ask publicitado en el tope del libro.
 * No requiere clave de API.
 */

import { fetchJson } from './http'

/** URL del endpoint de CriptoYa para USDT contra bolivares */
const USDT_VES_URL = 'https://criptoya.com/api/USDT/VES/1'

/**
 * Mercados P2P considerados para la tasa de venta.
 * Se excluyen venues sin liquidez real en VES (ejemplo coinex).
 */
const MERCADOS_PRINCIPALES: readonly string[] = [
  'binancep2p',
  'bybitp2p',
  'okexp2p',
  'bitgetp2p',
  'mexcp2p',
  'bingxp2p'
]

/** Cotizacion de un mercado P2P individual */
interface CotizacionMercado {
  /** Mejor precio de venta publicitado (no usamos el tope) */
  ask: number
  /** Mejor puja de compra: lo que recibe quien vende */
  bid: number
}

/** Forma esperada de la respuesta de CriptoYa para USDT/VES */
type RespuestaCriptoYa = Record<string, Partial<CotizacionMercado>>

/**
 * Comprueba que un valor responde a la forma de una cotizacion valida.
 * El generico permite validar propiedades dinamicas sin anotar unknown.
 * @param value Valor sin tipo recibido de la API
 * @returns true si el valor contiene ask y bid numericos positivos
 */
function esCotizacionValida<T>(value: T): value is T & CotizacionMercado {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ask' in value &&
    typeof value.ask === 'number' &&
    value.ask > 0 &&
    'bid' in value &&
    typeof value.bid === 'number' &&
    value.bid > 0
  )
}

/**
 * Comprueba que un valor responde a la forma de la respuesta de CriptoYa.
 * @param value Valor sin tipo recibido de la API
 * @returns true si el valor contiene al menos el mercado binancep2p valido
 */
function esRespuestaCriptoYa<T>(value: T): value is T & RespuestaCriptoYa {
  if (typeof value !== 'object' || value === null || !('binancep2p' in value)) return false

  const mercadoBase = (value as RespuestaCriptoYa).binancep2p
  return typeof mercadoBase === 'object' && mercadoBase !== null
}

/**
 * Obtiene la tasa referencial de VENTA del USDT: minima puja (bid)
 * entre los mercados P2P principales. Representa el peor precio
 * estandar disponible, alineado con lo que un vendedor real alcanza.
 * @returns Bolivares por 1 USDT al vender
 * @throws Error si el endpoint falla o ningun mercado ofrece puja valida
 */
export async function fetchUsdtSellRate(): Promise<number> {
  const respuesta = await fetchJson(USDT_VES_URL, esRespuestaCriptoYa)

  const pujas = MERCADOS_PRINCIPALES.map((mercado) => respuesta[mercado]).filter(esCotizacionValida)

  if (pujas.length === 0) {
    throw new Error('Ningun mercado P2P devolvio una puja de compra valida')
  }

  return Math.min(...pujas.map((cotizacion) => cotizacion.bid))
}
