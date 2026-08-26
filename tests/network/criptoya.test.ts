/**
 * Pruebas de integracion con red simulada del cliente criptoya.
 * Valida la tasa de venta (minima puja entre mercados principales).
 */

import { fetchUsdtSellRate } from '@src/services/criptoya'

import {
  CORRUPT_CRIPTOYA_BINANCE,
  CRIPTOYA_MISSING_BINANCE,
  VALID_CRIPTOYA_USDT
} from '../fixtures/apiFixtures'
import { installFetchMock } from '../helpers/networkMock'

describe('fetchUsdtSellRate', () => {
  let controlador: ReturnType<typeof installFetchMock>

  afterEach(() => {
    controlador.restore()
  })

  it('consulta USDT/VES y toma la minima puja entre mercados principales', async () => {
    controlador = installFetchMock([
      { match: /USDT\/VES/, respond: () => ({ body: VALID_CRIPTOYA_USDT }) }
    ])

    const tasa = await fetchUsdtSellRate()

    // Bids principales: 919, 919, 916, 917, 912.01, 915 -> minimo 912.01
    expect(tasa).toBe(912.01)
    expect(controlador.calls[0]).toContain('criptoya.com/api/USDT/VES/1')
  })

  it('rechaza respuestas sin mercado binancep2p', async () => {
    controlador = installFetchMock([
      { match: /USDT\/VES/, respond: () => ({ body: CRIPTOYA_MISSING_BINANCE }) }
    ])

    await expect(fetchUsdtSellRate()).rejects.toThrow('no tiene el formato esperado')
  })

  it('rechaza mercados con cotizaciones no numericas', async () => {
    controlador = installFetchMock([
      { match: /USDT\/VES/, respond: () => ({ body: CORRUPT_CRIPTOYA_BINANCE }) }
    ])

    await expect(fetchUsdtSellRate()).rejects.toThrow(
      'Ningun mercado P2P devolvio una puja de compra valida'
    )
  })
})
