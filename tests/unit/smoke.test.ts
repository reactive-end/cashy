/**
 * Prueba de humo del entorno de pruebas.
 * Verifica que el preset jest-expo, el alias @src y los helpers
 * cargan correctamente antes de ejecutar la suite completa.
 */

import { generateId } from '@src/lib/ids'

describe('humo del entorno de pruebas', () => {
  it('resuelve el alias @src y ejecuta logica real', () => {
    const id = generateId()

    expect(typeof id).toBe('string')
    expect(id).toContain('-')
  })
})
