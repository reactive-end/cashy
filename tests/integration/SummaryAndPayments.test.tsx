/**
 * Pruebas de integracion de la tarjeta resumen y los proximos pagos.
 */

import { fireEvent, render } from '@testing-library/react-native'

import { MonthlySummary } from '@src/components/organisms/MonthlySummary'
import { UpcomingPayments } from '@src/components/organisms/UpcomingPayments'

import { buildFixedExpense } from '../helpers/factories'

describe('MonthlySummary', () => {
  it('muestra placeholders mientras no hay tasas disponibles', async () => {
    const { getAllByText, getByText } = await render(
      <MonthlySummary summary={null} baseCurrency="USD" />
    )

    expect(getAllByText('$ --')).toHaveLength(3)
    expect(getByText('sin datos')).toBeTruthy()
  })

  it('expresa el balance disponible y los totales en la moneda base', async () => {
    const { getByText } = await render(
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

    expect(getByText('$ 378,47')).toBeTruthy()
    expect(getByText('$ 2.000,00')).toBeTruthy()
    expect(getByText('$ 1.621,53')).toBeTruthy()
    expect(getByText('4 unicos + fijos')).toBeTruthy()
  })
})

describe('UpcomingPayments', () => {
  it('muestra mensaje de calma cuando nada vence pronto', async () => {
    const { getByText } = await render(<UpcomingPayments payments={[]} />)

    expect(getByText(/Nada vence en los proximos siete dias/)).toBeTruthy()
  })

  it('lista los pagos con insignias segun urgencia', async () => {
    const pagos = [
      {
        expense: buildFixedExpense({ id: 'hoy', name: 'Luz', nextDueDate: '2026-01-01' }),
        daysRemaining: 0
      },
      {
        expense: buildFixedExpense({ id: 'medio', name: 'Agua', nextDueDate: '2026-01-03' }),
        daysRemaining: 2
      }
    ]

    const { getByText } = await render(<UpcomingPayments payments={pagos} />)

    expect(getByText('vence hoy')).toBeTruthy()
    expect(getByText('2 dias')).toBeTruthy()
    expect(getByText('Luz')).toBeTruthy()
  })

  it('notifica el identificador del gasto tocado', async () => {
    const onPaymentPress = jest.fn()
    const pagos = [
      {
        expense: buildFixedExpense({ id: 'fijo-9' }),
        daysRemaining: 3
      }
    ]

    const { getByText } = await render(
      <UpcomingPayments payments={pagos} onPaymentPress={onPaymentPress} />
    )

    fireEvent.press(getByText('Netflix'))

    expect(onPaymentPress).toHaveBeenCalledWith('fijo-9')
  })
})
