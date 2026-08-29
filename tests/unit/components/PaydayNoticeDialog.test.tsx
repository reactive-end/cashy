/**
 * Pruebas unitarias de la molecula PaydayNoticeDialog.
 */

import { render, userEvent } from '@testing-library/react-native'

import { PaydayNoticeDialog } from '@src/components/molecules/PaydayNoticeDialog'
import type { Income } from '@src/types/domain'

const sampleIncome: Income = {
  id: 'i-1',
  name: 'Salario Empresa',
  amount: 800,
  currency: 'USD',
  type: 'fixed',
  recurrence: 'monthly',
  paydayDay: 15,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z'
}

describe('molecula PaydayNoticeDialog', () => {
  it('no renderiza nada cuando income es null', async () => {
    const screen = await render(
      <PaydayNoticeDialog visible income={null} onConfirm={jest.fn()} onDismiss={jest.fn()} />
    )

    expect(screen.toJSON()).toBeNull()
  })

  it('muestra el nombre y monto del ingreso al estar visible', async () => {
    const screen = await render(
      <PaydayNoticeDialog
        visible
        income={sampleIncome}
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
      />
    )

    expect(await screen.findByText('Salario Empresa')).toBeTruthy()
    expect(screen.getByText(/Hoy es el dia de cobro de Salario Empresa/)).toBeTruthy()
    expect(screen.getByText('Si, recibido')).toBeTruthy()
    expect(screen.getByText('Aun no / Mas tarde')).toBeTruthy()
  })

  it('ejecuta onConfirm al pulsar Si, recibido', async () => {
    const onConfirm = jest.fn()
    const screen = await render(
      <PaydayNoticeDialog
        visible
        income={sampleIncome}
        onConfirm={onConfirm}
        onDismiss={jest.fn()}
      />
    )
    const user = userEvent.setup()

    await user.press(screen.getByText('Si, recibido'))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('ejecuta onDismiss al pulsar Aun no / Mas tarde', async () => {
    const onDismiss = jest.fn()
    const screen = await render(
      <PaydayNoticeDialog
        visible
        income={sampleIncome}
        onConfirm={jest.fn()}
        onDismiss={onDismiss}
      />
    )
    const user = userEvent.setup()

    await user.press(screen.getByText('Aun no / Mas tarde'))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
