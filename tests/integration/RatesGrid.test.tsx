/**
 * Pruebas de integracion del organismo RatesGrid en sus tres estados.
 */

import { fireEvent, render } from '@testing-library/react-native'

import { RatesGrid } from '@src/components/organisms/RatesGrid'
import type { UseRatesResult } from '@src/hooks/useRates'

import { buildRates } from '../helpers/factories'

/** Construye un estado del hook a partir de overrides */
function estado(overrides: Partial<UseRatesResult>): UseRatesResult {
  return {
    rates: null,
    loading: false,
    refreshing: false,
    error: null,
    lastRefreshOk: null,
    isStale: false,
    refresh: jest.fn(),
    ...overrides
  }
}

describe('RatesGrid', () => {
  it('muestra esqueleto sin valores mientras carga', async () => {
    const { queryByText } = await render(<RatesGrid ratesState={estado({ loading: true })} />)

    expect(queryByText(/Bs\./)).toBeNull()
    expect(queryByText('Reintentar')).toBeNull()
  })

  it('presenta las tres tasas formateadas y la antiguedad', async () => {
    const tasas = buildRates()
    const { getByText } = await render(
      <RatesGrid
        ratesState={estado({
          rates: tasas,
          loading: false
        })}
      />
    )

    expect(getByText('Bs. 779,95')).toBeTruthy()
    expect(getByText('Bs. 911,21')).toBeTruthy()
    expect(getByText('Bs. 912,01')).toBeTruthy()
    expect(getByText('USDT · Venta P2P')).toBeTruthy()
  })

  it('ante error muestra el mensaje y reintenta via refresh', async () => {
    const refresh = jest.fn().mockResolvedValue(undefined)
    const { getByText } = await render(
      <RatesGrid ratesState={estado({ error: 'sin internet', refresh })} />
    )

    expect(getByText('No pudimos actualizar las tasas')).toBeTruthy()

    fireEvent.press(getByText('Reintentar'))

    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
