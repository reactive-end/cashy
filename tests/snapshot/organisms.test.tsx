/**
 * Pruebas de instantanea de los organismos compuestos.
 */

import { render } from '@testing-library/react-native'
import type { ReactElement } from 'react'

import { CalendarPicker } from '@src/components/organisms/CalendarPicker'
import { IncomesPanel } from '@src/components/organisms/IncomesPanel'
import { MonthlySummary } from '@src/components/organisms/MonthlySummary'
import { RatesGrid } from '@src/components/organisms/RatesGrid'
import { TimePicker } from '@src/components/organisms/TimePicker'
import { UpcomingPayments } from '@src/components/organisms/UpcomingPayments'
import type { UseRatesResult } from '@src/hooks/useRates'

import { NOW, buildFixedExpense, buildIncome, buildRates } from '../helpers/factories'

beforeAll(() => {
  jest.useFakeTimers({ now: NOW })
})

afterAll(() => {
  jest.useRealTimers()
})

async function renderSnapshot(element: ReactElement): Promise<string> {
  const screen = await render(element)
  return JSON.stringify(screen.toJSON())
}

function makeState(overrides: Partial<UseRatesResult>): UseRatesResult {
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

describe('instantaneas de organismos', () => {
  it('CalendarPicker imprime la grilla completa del mes', async () => {
    const snapshot = await renderSnapshot(
      <CalendarPicker value="2026-02-15" onChange={jest.fn()} />
    )
    expect(snapshot).toMatchSnapshot()
  })

  it('MonthlySummary cubre vacio y con datos', async () => {
    const a = await renderSnapshot(<MonthlySummary summary={null} baseCurrency="USD" />)
    const b = await renderSnapshot(
      <MonthlySummary
        summary={{
          totalFixed: 1301,
          totalUnique: 320.53,
          uniqueCount: 4,
          confirmedIncome: 2000,
          netBalance: 378.47
        }}
        baseCurrency="USD"
      />
    )
    expect([a, b]).toMatchSnapshot()
  })

  it('UpcomingPayments cubre vacio y con pagos', async () => {
    const a = await renderSnapshot(<UpcomingPayments payments={[]} />)
    const b = await renderSnapshot(
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
    const a = await renderSnapshot(<RatesGrid ratesState={makeState({ loading: true })} />)
    const b = await renderSnapshot(<RatesGrid ratesState={makeState({ rates: buildRates() })} />)
    const c = await renderSnapshot(<RatesGrid ratesState={makeState({ error: 'sin internet' })} />)
    expect([a, b, c]).toMatchSnapshot()
  })

  it('TimePicker muestra el campo con hora y minuto', async () => {
    const snapshot = await renderSnapshot(
      <TimePicker hour={19} minute={30} onChange={jest.fn()} accessibilityLabel="Hora de prueba" />
    )
    expect(snapshot).toMatchSnapshot()
  })

  it('IncomesPanel cubre carga, vacio y con datos', async () => {
    const a = await renderSnapshot(
      <IncomesPanel
        incomes={[]}
        monthlyTotal={null}
        baseCurrency="USD"
        loading
        onAdd={jest.fn()}
        onEdit={jest.fn()}
        onRemove={jest.fn()}
      />
    )
    const b = await renderSnapshot(
      <IncomesPanel
        incomes={[buildIncome()]}
        monthlyTotal={500}
        baseCurrency="USD"
        loading={false}
        onAdd={jest.fn()}
        onEdit={jest.fn()}
        onRemove={jest.fn()}
      />
    )
    expect([a, b]).toMatchSnapshot()
  })
})
