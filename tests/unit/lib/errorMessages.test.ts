/**
 * Pruebas del catalogo de mensajes amigables para la interfaz.
 * Garantiza que los textos existan y nunca expongan detalles tecnicos.
 */

import { EXPENSES_LOAD_ERROR_MESSAGE, RATES_LOAD_ERROR_MESSAGE } from '@src/lib/errorMessages'

describe('mensajes de error para usuario', () => {
  it('el mensaje de tasas es textual y sin jerga tecnica', () => {
    expect(RATES_LOAD_ERROR_MESSAGE).toBe(
      'La solicitud para obtener las tasas ha fallado. Revisa tu conexion e intenta de nuevo.'
    )
  })

  it('el mensaje de gastos es textual y sin jerga tecnica', () => {
    expect(EXPENSES_LOAD_ERROR_MESSAGE).toBe(
      'No se pudieron cargar tus gastos. Revisa tu conexion e intenta de nuevo.'
    )
  })

  it('ningun mensaje contiene terminos tecnicos prohibidos', () => {
    const prohibidos = ['Failed', 'Query', 'Internal Server Error', 'Network request']

    for (const mensaje of [RATES_LOAD_ERROR_MESSAGE, EXPENSES_LOAD_ERROR_MESSAGE]) {
      for (const termino of prohibidos) {
        expect(mensaje).not.toContain(termino)
      }
    }
  })
})
