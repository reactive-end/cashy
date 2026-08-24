/**
 * Pruebas unitarias del generador de identificadores locales.
 */

import { generateId } from '@src/lib/ids'

describe('generateId', () => {
  it('produce cadenas con formato tiempo-azar separadas por guion', () => {
    const id = generateId()

    expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
    expect(id.length).toBeGreaterThan(8)
  })

  it('genera identificadores unicos en series grandes', () => {
    const generados = new Set<string>()

    for (let i = 0; i < 1000; i += 1) {
      generados.add(generateId())
    }

    expect(generados.size).toBe(1000)
  })
})
