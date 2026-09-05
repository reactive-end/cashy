/**
 * Pruebas unitarias del organismo PaymentComparator.
 */

import { act, fireEvent, render } from '@testing-library/react-native'

import { PaymentComparator } from '@src/components/organisms/PaymentComparator'
import type { ExchangeRates } from '@src/types/domain'

describe('PaymentComparator', () => {
  const mockRates: ExchangeRates = {
    bcvUsd: 40.0,
    bcvEur: 44.0,
    usdtSellP2p: 48.0,
    fetchedAt: '2026-08-26T00:00:00.000Z'
  }

  it('renderiza mensaje inicial cuando los montos estan en cero', async () => {
    const { findByText, queryByTestId } = await render(
      <PaymentComparator rates={mockRates} baseCurrency="USD" />
    )

    expect(
      await findByText('Ingresa el monto de ambas opciones para ver la comparativa instantánea.')
    ).toBeTruthy()
    expect(queryByTestId('card-verdict')).toBeNull()
  })

  it('calcula y muestra el veredicto cuando se ingresan ambos montos', async () => {
    const { findByTestId, findByText } = await render(
      <PaymentComparator rates={mockRates} baseCurrency="USD" />
    )

    const inputA = await findByTestId('input-monto-a')
    const inputB = await findByTestId('input-monto-b')

    // Opcion A: 1440 Bs (teclear 144000 centavos) -> 36 USD
    // Opcion B: 40 USDT (teclear 4000 centavos)
    await act(async () => {
      fireEvent.changeText(inputA, '144000')
      fireEvent.changeText(inputB, '4000')
    })

    expect(await findByTestId('card-verdict')).toBeTruthy()
    expect(await findByText(/Te conviene la Opción A/)).toBeTruthy()
  })

  it('permite intercambiar ofertas con el boton de swap', async () => {
    const { findByTestId, findByText } = await render(
      <PaymentComparator rates={mockRates} baseCurrency="USD" />
    )

    const inputA = await findByTestId('input-monto-a')
    const inputB = await findByTestId('input-monto-b')

    await act(async () => {
      fireEvent.changeText(inputA, '1000')
      fireEvent.changeText(inputB, '2000')
    })

    const swapBtn = await findByTestId('btn-swap-offers')
    await act(async () => {
      fireEvent.press(swapBtn)
    })

    // Tras el swap, se comprueba que el componente se mantiene estable
    expect(await findByTestId('card-verdict')).toBeTruthy()
  })

  it('permite limpiar montos con el boton de reset', async () => {
    const { findByTestId, queryByTestId } = await render(
      <PaymentComparator rates={mockRates} baseCurrency="USD" />
    )

    const inputA = await findByTestId('input-monto-a')
    await act(async () => {
      fireEvent.changeText(inputA, '5000')
    })

    const resetBtn = await findByTestId('btn-reset-comparator')
    await act(async () => {
      fireEvent.press(resetBtn)
    })

    expect(queryByTestId('card-verdict')).toBeNull()
  })
})
