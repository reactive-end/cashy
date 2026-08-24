/**
 * Pruebas de instantanea de los organismos compuestos.
 */

import { render } from '@testing-library/react-native'
import type { ReactElement } from 'react'

import { CalendarPicker } from '@src/components/organisms/CalendarPicker'
import { MonthlySummary } from '@src/components/organisms/MonthlySummary'
import { RatesGrid } from '@src/components/organisms/RatesGrid'
import { UpcomingPayments } from '@src/components/organisms/UpcomingPayments'
import type { UseRatesResult } from '@src/hooks/useRates'

import { AHORA, buildFixedExpense, buildRates } from '../helpers/factories'

beforeAll(() => {
  jest.useFakeTimers({ now: AHORA })
})

afterAll(() => {
  jest.useRealTimers()
})

async function snapshotar(elemento: ReactElement): Promise<string> {
  const pantalla = await render(elemento)
  return JSON.stringify(pantalla.toJSON())
}

function estado(overrides: Partial<UseRatesResult>): UseRatesResult {
  return {
    rates: null,
    loading: false,
    refreshing: false,
    error: null,
    lastRefreshOk: null,
    refresh: jest.fn(),
    ...overrides
  }
}

describe('instantaneas de organismos', () => {
  it('CalendarPicker imprime la grilla completa del mes', async () => {
    const snapshot = await snapshotar(<CalendarPicker value="2026-02-15" onChange={jest.fn()} />)
    expect(snapshot).toMatchSnapshot()
  })

  it('MonthlySummary cubre vacio y con datos', async () => {
    const a = await snapshotar(<MonthlySummary summary={null} baseCurrency="USD" />)
    const b = await snapshotar(
      <MonthlySummary
        summary={{ totalFixed: 1301, totalUnique: 320.53, uniqueCount: 4 }}
        baseCurrency="USD"
      />
    )
    expect([a, b]).toMatchSnapshot()
  })

  it('UpcomingPayments cubre vacio y con pagos', async () => {
    const a = await snapshotar(<UpcomingPayments payments={[]} />)
    const b = await snapshotar(
      <UpcomingPayments
        payments={[
          {
            expense: buildFixedExpense({
              id: 'fijo-1',
              name: 'Alquiler',
              nextDueDate: '2026-08-25'
            }),
            daysRemaining: 2
          }
        ]}
      />
    )
    expect([a, b]).toMatchSnapshot()
  })

  it('RatesGrid cubre carga, datos y error', async () => {
    const a = await snapshotar(<RatesGrid ratesState={estado({ loading: true })} />)
    const b = await snapshotar(<RatesGrid ratesState={estado({ rates: buildRates() })} />)
    const c = await snapshotar(<RatesGrid ratesState={estado({ error: 'sin internet' })} />)
    expect([a, b, c]).toMatchSnapshot()
  })
})
