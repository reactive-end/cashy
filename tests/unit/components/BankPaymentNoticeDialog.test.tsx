/**
 * Pruebas unitarias para el organismo BankPaymentNoticeDialog.
 */

import { render, userEvent } from '@testing-library/react-native'

import { BankPaymentNoticeDialog } from '@src/components/organisms/BankPaymentNoticeDialog'
import type { ParsedBankNotification } from '@src/lib/bankNotifications'
import type { ExchangeRates } from '@src/types/domain'

const mockRates: ExchangeRates = {
  bcvUsd: 80,
  bcvEur: 85,
  usdtSellP2p: 82,
  fetchedAt: '2026-08-29T00:00:00.000Z'
}

const sampleNotification: ParsedBankNotification = {
  bank: 'bnc',
  bankName: 'BNC',
  operationType: 'incoming_pago_movil',
  amount: 10000,
  amountCents: 1000000,
  currency: 'VES',
  sender: '0414***69',
  rawTitle: 'PAGO MOVIL RECIBIDO',
  rawBody: 'BNC Pago Movil Recibido Bs. 10000,00 Telf. 0414***69..',
  detectedAt: '2026-08-29T15:40:00.000Z'
}

describe('BankPaymentNoticeDialog', () => {
  it('no renderiza nada cuando notification es null', async () => {
    const screen = await render(
      <BankPaymentNoticeDialog
        notification={null}
        visible={true}
        rates={mockRates}
        baseCurrency="USD"
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
      />
    )

    expect(screen.toJSON()).toBeNull()
  })

  it('muestra datos extraidos del pago movil BNC y equivalencia en moneda base', async () => {
    const screen = await render(
      <BankPaymentNoticeDialog
        notification={sampleNotification}
        visible={true}
        rates={mockRates}
        baseCurrency="USD"
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
      />
    )

    expect(screen.getByText('¿Registrar pago móvil recibido?')).toBeTruthy()
    expect(screen.getByText('BNC')).toBeTruthy()
    expect(screen.getByText('Bs. 10.000,00')).toBeTruthy()
    expect(screen.getByText(/De: 0414\*\*\*69/)).toBeTruthy()
    expect(screen.getByText(/≈ \$ 125,00/)).toBeTruthy()
  })

  it('permite modificar el concepto y confirmar el registro', async () => {
    const handleConfirm = jest.fn()
    const screen = await render(
      <BankPaymentNoticeDialog
        notification={sampleNotification}
        visible={true}
        rates={mockRates}
        baseCurrency="USD"
        onConfirm={handleConfirm}
        onDismiss={jest.fn()}
      />
    )
    const user = userEvent.setup()

    const input = screen.getByTestId('bank-payment-concept')
    await user.clear(input)
    await user.type(input, 'Pago por diseño web')

    await user.press(screen.getByText('Registrar como ingreso'))

    expect(handleConfirm).toHaveBeenCalledWith('Pago por diseño web')
  })

  it('llama a onDismiss al presionar Descartar', async () => {
    const handleDismiss = jest.fn()
    const screen = await render(
      <BankPaymentNoticeDialog
        notification={sampleNotification}
        visible={true}
        rates={mockRates}
        baseCurrency="USD"
        onConfirm={jest.fn()}
        onDismiss={handleDismiss}
      />
    )
    const user = userEvent.setup()

    await user.press(screen.getByText('Descartar'))

    expect(handleDismiss).toHaveBeenCalled()
  })
})
