/**
 * Pruebas del orquestador de tasas: estrategia cache-first,
 * expiracion por TTL y forzado de red manual.
 */

import * as criptoya from '@src/services/criptoya'
import * as dolarapi from '@src/services/dolarapi'
import { getExchangeRates } from '@src/services/rates'
import * as cache from '@src/services/rates-cache'

import { AHORA, buildRates } from '../helpers/factories'

const loadRatesMock = cache.loadRates as jest.Mock
const saveRatesMock = cache.saveRates as jest.Mock
const fetchBCVMock = dolarapi.fetchBCVRates as jest.Mock
const fetchUsdtMock = criptoya.fetchUsdtSellRate as jest.Mock

jest.mock('@src/services/rates-cache', () => ({
  CACHE_TTL_MS: 6 * 60 * 60 * 1000,
  MIN_NETWORK_INTERVAL_MS: 10 * 60 * 1000,
  loadRates: jest.fn(),
  saveRates: jest.fn(),
  clearRates: jest.fn()
}))

jest.mock('@src/services/dolarapi')
jest.mock('@src/services/criptoya')

describe('getExchangeRates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ now: AHORA })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('usa el cache fresco sin tocar la red', async () => {
    const fresco = buildRates()
    loadRatesMock.mockResolvedValueOnce(fresco)

    const resultado = await getExchangeRates()

    expect(resultado).toEqual(fresco)
    expect(fetchBCVMock).not.toHaveBeenCalled()
    expect(fetchUsdtMock).not.toHaveBeenCalled()
  })

  it('va a la red cuando no hay cache y persiste el snapshot', async () => {
    loadRatesMock.mockResolvedValueOnce(null)
    fetchBCVMock.mockResolvedValueOnce({ bcvUsd: 780, bcvEur: 912 })
    fetchUsdtMock.mockResolvedValueOnce(912.01)

    const resultado = await getExchangeRates()

    expect(resultado).toMatchObject({
      bcvUsd: 780,
      bcvEur: 912,
      usdtSellP2p: 912.01,
      fetchedAt: AHORA.toISOString()
    })
    expect(saveRatesMock).toHaveBeenCalledWith(resultado)
  })

  it('renueva cuando el cache supera las seis horas de validez', async () => {
    const viejo = buildRates({
      fetchedAt: new Date(AHORA.getTime() - 7 * 60 * 60 * 1000).toISOString()
    })
    loadRatesMock.mockResolvedValueOnce(viejo)
    fetchBCVMock.mockResolvedValueOnce({ bcvUsd: 781, bcvEur: 913 })
    fetchUsdtMock.mockResolvedValueOnce(913)

    const resultado = await getExchangeRates()

    expect(fetchBCVMock).toHaveBeenCalledTimes(1)
    expect(resultado.bcvUsd).toBe(781)
  })

  it('ignora un cache fresco cuando se fuerza la red', async () => {
    const fresco = buildRates()
    loadRatesMock.mockResolvedValue(fresco)
    fetchBCVMock.mockResolvedValueOnce({ bcvUsd: 782, bcvEur: 914 })
    fetchUsdtMock.mockResolvedValueOnce(914)

    const resultado = await getExchangeRates(true)

    expect(fetchBCVMock).toHaveBeenCalledTimes(1)
    expect(resultado.bcvUsd).toBe(782)
    expect(saveRatesMock).toHaveBeenCalled()
  })
})
