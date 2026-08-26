/**
 * Pruebas de integracion con red simulada del cliente dolarapi.
 * Valida el parseo paralelo de USD y EUR oficiales del BCV.
 */

import { fetchBCVRates } from '@src/services/dolarapi'

import {
  INVALID_DOLLAR_AVERAGE,
  VALID_OFFICIAL_DOLLAR,
  VALID_OFFICIAL_EURO
} from '../fixtures/apiFixtures'
import { installFetchMock } from '../helpers/networkMock'

describe('fetchBCVRates', () => {
  let controlador: ReturnType<typeof installFetchMock>

  afterEach(() => {
    controlador.restore()
  })

  it('consulta ambos endpoints y devuelve las dos tasas', async () => {
    controlador = installFetchMock([
      { match: /dolares\/oficial/, respond: () => ({ body: VALID_OFFICIAL_DOLLAR }) },
      { match: /euros\/oficial/, respond: () => ({ body: VALID_OFFICIAL_EURO }) }
    ])

    const tasas = await fetchBCVRates()

    expect(tasas).toEqual({ bcvUsd: 779.9522, bcvEur: 911.21815526 })
    expect(controlador.calls).toHaveLength(2)
  })

  it('rechaza cuando el endpoint del euro falla', async () => {
    controlador = installFetchMock([
      { match: /dolares\/oficial/, respond: () => ({ body: VALID_OFFICIAL_DOLLAR }) },
      { match: /euros\/oficial/, respond: () => new Error('sin conexion') }
    ])

    await expect(fetchBCVRates()).rejects.toThrow('sin conexion')
  })

  it('rechaza un promedio negativo que no pasa el guard', async () => {
    controlador = installFetchMock([
      { match: /dolares\/oficial/, respond: () => ({ body: INVALID_DOLLAR_AVERAGE }) },
      { match: /euros\/oficial/, respond: () => ({ body: VALID_OFFICIAL_EURO }) }
    ])

    await expect(fetchBCVRates()).rejects.toThrow('no tiene el formato esperado')
  })
})
