/**
 * Pruebas de integracion del flujo de deteccion y registro de pagos moviles.
 * Valida la integracion entre el parser por patron, la persistencia en cola
 * y la confirmacion en el dialogo hacia la base de datos de ingresos.
 */

import { render, userEvent, waitFor } from '@testing-library/react-native'

import { BankPaymentNoticeDialog } from '@src/components/organisms/BankPaymentNoticeDialog'
import * as incomesRepo from '@src/db/incomes'
import {
  clearBankNotifications,
  dequeueBankNotification,
  enqueueBankNotification,
  getPendingBankNotifications,
  parsePaymentNotification
} from '@src/lib/bankNotifications'
import type { ExchangeRates } from '@src/types/domain'

const mockRates: ExchangeRates = {
  bcvUsd: 80,
  bcvEur: 85,
  usdtSellP2p: 82,
  fetchedAt: '2026-08-29T00:00:00.000Z'
}

jest.mock('@src/db/incomes', () => ({
  insertIncome: jest.fn(async () => ({
    id: 'inc-pago-movil',
    name: 'Pago Movil BNC',
    amount: 10000,
    currency: 'VES',
    type: 'unique',
    paydayDay: 29
  }))
}))

const insertIncomeMock = incomesRepo.insertIncome as jest.Mock

describe('Flujo de deteccion y registro de pago movil', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await clearBankNotifications()
  })

  it('detecta una notificacion real del BNC y permite registrarla en ingresos', async () => {
    // 1. Parsear la notificacion real capturada del sistema
    const parsed = parsePaymentNotification(
      'PAGO MOVIL RECIBIDO',
      'BNC Pago Movil Recibido Bs.10000,00 Telf.0414***69..'
    )
    expect(parsed).not.toBeNull()

    // 2. Encolar en almacenamiento local
    const added = await enqueueBankNotification(parsed!)
    expect(added).toBe(true)

    // 3. Renderizar el dialogo con la notificacion detectada
    const handleConfirm = jest.fn(async (concept: string) => {
      await incomesRepo.insertIncome(
        {
          name: concept,
          amount: parsed!.amount,
          currency: parsed!.currency,
          type: 'unique',
          paydayDay: new Date().getDate()
        },
        'id-123'
      )
    })

    const screen = await render(
      <BankPaymentNoticeDialog
        notification={parsed}
        visible={true}
        rates={mockRates}
        baseCurrency="USD"
        onConfirm={handleConfirm}
        onDismiss={jest.fn()}
      />
    )
    const user = userEvent.setup()

    expect(screen.getByText('Bs. 10.000,00')).toBeTruthy()
    expect(screen.getByText(/≈ \$ 125,00/)).toBeTruthy()

    // 4. Modificar concepto y confirmar
    const input = screen.getByTestId('bank-payment-concept')
    await user.clear(input)
    await user.type(input, 'Honorarios BNC')

    await user.press(screen.getByText('Registrar como ingreso'))

    await waitFor(() => {
      expect(handleConfirm).toHaveBeenCalledWith('Honorarios BNC')
      expect(insertIncomeMock).toHaveBeenCalledWith(
        {
          name: 'Honorarios BNC',
          amount: 10000,
          currency: 'VES',
          type: 'unique',
          paydayDay: expect.any(Number)
        },
        'id-123'
      )
    })
  })

  it('encola un aviso real de BBVA Provincial parseado desde el patron', async () => {
    const parsed = parsePaymentNotification(
      '',
      'BBVA Provincial informa Pago Movil desde cuenta 5256 por Bs. 30,206.00. Si no la realizaste envia N al 77106.'
    )
    expect(parsed?.amount).toBe(30206)
    expect(parsed?.bank).toBe('bbva')

    const added = await enqueueBankNotification(parsed!)
    expect(added).toBe(true)

    const pending = await getPendingBankNotifications()
    expect(pending).toHaveLength(1)
    expect(pending[0].amountCents).toBe(3020600)
  })

  it('descarta la notificacion sin registrar ingreso alguno', async () => {
    const parsed = parsePaymentNotification(
      'Has recibido un Pago Movil',
      'BANESCO REGISTRO: Pago recibido a traves de Pago Movil de MEJIA B por Bs. 1900.0 el 31/08/2026; 15:43 REF 062437337739.'
    )
    await enqueueBankNotification(parsed!)

    const handleDismiss = jest.fn()
    const screen = await render(
      <BankPaymentNoticeDialog
        notification={parsed}
        visible={true}
        rates={mockRates}
        baseCurrency="USD"
        onConfirm={jest.fn()}
        onDismiss={handleDismiss}
      />
    )
    const user = userEvent.setup()

    expect(screen.getByText('Bs. 1.900,00')).toBeTruthy()

    await user.press(screen.getByText('Descartar'))

    expect(handleDismiss).toHaveBeenCalled()
    expect(insertIncomeMock).not.toHaveBeenCalled()

    await dequeueBankNotification(parsed!.detectedAt)
    const pending = await getPendingBankNotifications()
    expect(pending).toHaveLength(0)
  })
})
