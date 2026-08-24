/**
 * Pruebas unitarias de conversiones entre monedas.
 * El bolivar actua como divisa puente y el redondeo es a dos decimales.
 */

import { convert } from '@src/lib/conversions'

import { buildRates } from '../../helpers/factories'

const tasas = buildRates()

describe('convert', () => {
  it('es identidad al convertir VES hacia VES', () => {
    expect(convert(1234.56, 'VES', 'VES', tasas)).toBe(1234.56)
  })

  it('convierte USD a VES con la tasa BCV', () => {
    expect(convert(100, 'USD', 'VES', tasas)).toBe(77995)
  })

  it('convierte USDT a VES con la tasa de venta P2P', () => {
    expect(convert(100, 'USDT', 'VES', tasas)).toBe(91201)
  })

  it('redondea a dos decimales en la direccion inversa', () => {
    expect(convert(779.95, 'VES', 'USD', tasas)).toBe(1)
  })

  it('refleja la brecha real entre BCV y P2P al cruzar USD con USDT', () => {
    const resultado = convert(100, 'USD', 'USDT', tasas)

    expect(resultado).toBeLessThan(100)
    expect(resultado).toBe(85.52)
  })

  it('convierte VES hacia USDT con la tasa de venta P2P', () => {
    expect(convert(912.01, 'VES', 'USDT', tasas)).toBe(1)
  })
})
