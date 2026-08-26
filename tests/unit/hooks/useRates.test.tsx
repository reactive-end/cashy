/**
 * Pruebas unitarias del hook useRates con el servicio mockeado.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import { RATES_LOAD_ERROR_MESSAGE } from '@src/lib/errorMessages'
import { useRates } from '@src/hooks/useRates'
import * as ratesService from '@src/services/rates'

import { buildRates } from '../../helpers/factories'

const getExchangeRatesMock = ratesService.getExchangeRates as jest.Mock

jest.mock('@src/services/rates')

describe('useRates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('arranca cargando y expone el snapshot al resolver', async () => {
    const snapshot = buildRates()
    let resolver!: (v: ReturnType<typeof buildRates>) => void
    getExchangeRatesMock.mockImplementationOnce(() => new Promise((r) => (resolver = r)))

    const { result } = await renderHook(() => useRates())

    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolver(snapshot)
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rates).toEqual(snapshot)
    expect(result.current.error).toBeNull()
  })

  it('expone el mensaje amigable cuando la red falla', async () => {
    getExchangeRatesMock.mockRejectedValueOnce(new Error('sin internet'))

    const { result } = await renderHook(() => useRates())

    await waitFor(() => expect(result.current.error).toBe(RATES_LOAD_ERROR_MESSAGE))
    expect(result.current.error).not.toContain('sin internet')
    expect(result.current.rates).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('refresh no hace nada si el hook ya se desmonto', async () => {
    getExchangeRatesMock.mockResolvedValueOnce(buildRates())
    const { result, unmount } = await renderHook(() => useRates())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await unmount()
    await act(async () => {
      await result.current.refresh()
    })

    // El guard interno evito la segunda llamada pese al refresh.
    expect(getExchangeRatesMock).toHaveBeenCalledTimes(1)
  })

  it('refresh fuerza la red y limpia el error previo', async () => {
    getExchangeRatesMock
      .mockRejectedValueOnce(new Error('primera caida'))
      .mockResolvedValueOnce(buildRates({ bcvUsd: 800 }))

    const { result } = await renderHook(() => useRates())
    await waitFor(() => expect(result.current.error).not.toBeNull())

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.rates?.bcvUsd).toBe(800)
    expect(result.current.refreshing).toBe(false)
    expect(getExchangeRatesMock).toHaveBeenLastCalledWith(true)
  })
})
