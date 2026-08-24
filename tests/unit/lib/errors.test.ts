/**
 * Pruebas unitarias del extractor seguro de mensajes de error.
 * El generico evita anotaciones prohibidas y cubre valores raros.
 */

import { getErrorMessage } from '@src/lib/errors'

describe('getErrorMessage', () => {
  it('extrae el message de un Error estandar', () => {
    const error = new Error('La red fallo')

    expect(getErrorMessage(error)).toBe('La red fallo')
  })

  it('extrae el message de subclases como TypeError', () => {
    const capturado: TypeError = new TypeError('no es una funcion')

    expect(getErrorMessage(capturado)).toBe('no es una funcion')
  })

  it('devuelve un mensaje amable para valores que no son Error', () => {
    expect(getErrorMessage('texto lanzado')).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    expect(getErrorMessage(42)).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    expect(getErrorMessage(null)).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
  })
})
