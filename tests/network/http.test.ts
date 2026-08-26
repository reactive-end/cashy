/**
 * Pruebas del cliente HTTP minimo sobre el interceptor propio.
 * Cubren exito, errores HTTP, validacion de forma y timeout.
 */

import { fetchJson } from '@src/services/http'

import { installFetchMock } from '../helpers/networkMock'

/** Guard minimo para las pruebas */
interface CargaValida {
  valor: number
}

function esCargaValida(value: object): value is CargaValida {
  return 'valor' in value && typeof value.valor === 'number'
}

describe('fetchJson', () => {
  let controlador: ReturnType<typeof installFetchMock>

  afterEach(() => {
    controlador.restore()
    jest.useRealTimers()
  })

  it('devuelve el cuerpo validado cuando la respuesta es 200', async () => {
    controlador = installFetchMock([{ match: /api\/ok/, respond: () => ({ body: { valor: 42 } }) }])

    await expect(fetchJson('https://x.test/api/ok', esCargaValida)).resolves.toEqual({
      valor: 42
    })
    expect(controlador.calls).toEqual(['https://x.test/api/ok'])
  })

  it('lanza error con el codigo HTTP cuando la respuesta no es 2xx', async () => {
    controlador = installFetchMock([{ match: /rota/, respond: () => ({ status: 503, body: {} }) }])

    await expect(fetchJson('https://x.test/rota', esCargaValida)).rejects.toThrow(
      'El servidor respondió con el código 503'
    )
  })

  it('lanza error cuando el cuerpo no pasa el guard de forma', async () => {
    controlador = installFetchMock([
      { match: /malforma/, respond: () => ({ body: { otraCosa: true } }) }
    ])

    await expect(fetchJson('https://x.test/malforma', esCargaValida)).rejects.toThrow(
      'La respuesta del servidor no tiene el formato esperado'
    )
  })

  it('propaga fallos de red simulados por la ruta', async () => {
    controlador = installFetchMock([
      { match: /caida/, respond: () => new Error('Network request failed') }
    ])

    await expect(fetchJson('https://x.test/caida', esCargaValida)).rejects.toThrow(
      'Network request failed'
    )
  })

  it('aborta cuando excede el tiempo maximo configurado', async () => {
    jest.useFakeTimers()

    controlador = installFetchMock([
      { match: /lenta/, respond: () => ({ body: { valor: 1 }, delayMs: 30000 }) }
    ])

    const pendiente = fetchJson('https://x.test/lenta', esCargaValida)
    const asercion = expect(pendiente).rejects.toThrow('Aborted')

    jest.advanceTimersByTime(10000)

    await asercion
  })

  it('rechaza URLs sin ruta registrada', async () => {
    controlador = installFetchMock([])

    await expect(fetchJson('https://x.test/desconocida', esCargaValida)).rejects.toThrow(
      'No hay mock registrado'
    )
  })
})
