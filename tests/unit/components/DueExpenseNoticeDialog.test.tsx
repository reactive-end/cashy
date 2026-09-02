/**
 * Pruebas unitarias de la molecula DueExpenseNoticeDialog.
 */

import { render, userEvent } from '@testing-library/react-native'

import { DueExpenseNoticeDialog } from '@src/components/molecules/DueExpenseNoticeDialog'
import type { Expense } from '@src/types/domain'

const sampleExpense: Expense = {
  id: 'e-1',
  name: 'Internet Fibra',
  amount: 35,
  currency: 'USD',
  type: 'fixed',
  recurrence: 'monthly',
  nextDueDate: '2026-09-01',
  dueDay: 1,
  active: true,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z'
}

describe('molecula DueExpenseNoticeDialog', () => {
  it('no renderiza nada cuando expense es null', async () => {
    const screen = await render(
      <DueExpenseNoticeDialog visible expense={null} onConfirm={jest.fn()} onDismiss={jest.fn()} />
    )

    expect(screen.toJSON()).toBeNull()
  })

  it('muestra el nombre y monto del gasto al estar visible', async () => {
    const screen = await render(
      <DueExpenseNoticeDialog
        visible
        expense={sampleExpense}
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
      />
    )

    expect(await screen.findByText('Internet Fibra')).toBeTruthy()
    expect(screen.getByText(/Hoy corresponde pagar Internet Fibra/)).toBeTruthy()
    expect(screen.getByText('Marcar como pagado')).toBeTruthy()
    expect(screen.getByText('Aun no / Mas tarde')).toBeTruthy()
  })

  it('ejecuta onConfirm al pulsar Marcar como pagado', async () => {
    const onConfirm = jest.fn()
    const screen = await render(
      <DueExpenseNoticeDialog
        visible
        expense={sampleExpense}
        onConfirm={onConfirm}
        onDismiss={jest.fn()}
      />
    )
    const user = userEvent.setup()

    await user.press(screen.getByText('Marcar como pagado'))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('ejecuta onDismiss al pulsar Aun no / Mas tarde', async () => {
    const onDismiss = jest.fn()
    const screen = await render(
      <DueExpenseNoticeDialog
        visible
        expense={sampleExpense}
        onConfirm={jest.fn()}
        onDismiss={onDismiss}
      />
    )
    const user = userEvent.setup()

    await user.press(screen.getByText('Aun no / Mas tarde'))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
