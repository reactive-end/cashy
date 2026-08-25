/**
 * Pruebas unitarias de la comparacion semantica de versiones.
 * Cubre prefijos "v", segmentos faltantes y orden mayor/menor.
 */

import { compararVersiones, esVersionMasNueva } from '@src/lib/versiones'

describe('compararVersiones', () => {
  it('detecta versiones mayores, menores e iguales', () => {
    expect(compararVersiones('1.0.1', '1.0.2')).toBe(-1)
    expect(compararVersiones('1.0.2', '1.0.1')).toBe(1)
    expect(compararVersiones('1.0.1', '1.0.1')).toBe(0)
  })

  it('soporta el prefijo "v" de los tags de GitHub', () => {
    expect(compararVersiones('1.0.1', 'v1.1.0')).toBe(-1)
    expect(compararVersiones('v1.1.0', '1.0.1')).toBe(1)
  })

  it('ordena correctamente saltos de version mayor y menor', () => {
    expect(compararVersiones('1.9.9', '2.0.0')).toBe(-1)
    expect(compararVersiones('2.0.0', '1.9.9')).toBe(1)
    expect(compararVersiones('1.0.9', '1.1.0')).toBe(-1)
  })

  it('tolera segmentos faltantes o malformados', () => {
    expect(compararVersiones('1.0.1', '1.0')).toBe(1)
    expect(compararVersiones('1.0', '1.0.1')).toBe(-1)
    expect(compararVersiones('1.0.0', '1.x.0')).toBe(0)
  })
})

describe('esVersionMasNueva', () => {
  it('solo devuelve true con versiones estrictamente mayores', () => {
    expect(esVersionMasNueva('1.0.1', '1.0.2')).toBe(true)
    expect(esVersionMasNueva('1.0.1', '1.0.1')).toBe(false)
    expect(esVersionMasNueva('1.0.2', '1.0.1')).toBe(false)
  })
})
