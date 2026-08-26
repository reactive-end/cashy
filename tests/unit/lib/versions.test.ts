/**
 * Pruebas unitarias de la comparacion semantica de versiones.
 * Cubre prefijos "v", segmentos faltantes y orden mayor/menor.
 */

import { compareVersions, isNewerVersion } from '@src/lib/versions'

describe('compareVersions', () => {
  it('detecta versiones mayores, menores e iguales', () => {
    expect(compareVersions('1.0.1', '1.0.2')).toBe(-1)
    expect(compareVersions('1.0.2', '1.0.1')).toBe(1)
    expect(compareVersions('1.0.1', '1.0.1')).toBe(0)
  })

  it('soporta el prefijo "v" de los tags de GitHub', () => {
    expect(compareVersions('1.0.1', 'v1.1.0')).toBe(-1)
    expect(compareVersions('v1.1.0', '1.0.1')).toBe(1)
  })

  it('ordena correctamente saltos de version mayor y menor', () => {
    expect(compareVersions('1.9.9', '2.0.0')).toBe(-1)
    expect(compareVersions('2.0.0', '1.9.9')).toBe(1)
    expect(compareVersions('1.0.9', '1.1.0')).toBe(-1)
  })

  it('tolera segmentos faltantes o malformados', () => {
    expect(compareVersions('1.0.1', '1.0')).toBe(1)
    expect(compareVersions('1.0', '1.0.1')).toBe(-1)
    expect(compareVersions('1.0.0', '1.x.0')).toBe(0)
  })
})

describe('isNewerVersion', () => {
  it('solo devuelve true con versiones estrictamente mayores', () => {
    expect(isNewerVersion('1.0.1', '1.0.2')).toBe(true)
    expect(isNewerVersion('1.0.1', '1.0.1')).toBe(false)
    expect(isNewerVersion('1.0.2', '1.0.1')).toBe(false)
  })
})
