/**
 * Pruebas unitarias del componente MonthNavigator.
 */

import { fireEvent, render } from '@testing-library/react-native'

import { MonthNavigator } from '@src/components/molecules/MonthNavigator'

jest.mock('@src/db/incomeReceipts', () => ({
  formatYearMonth: jest.fn(() => '2026-08')
}))

describe('MonthNavigator', () => {
  it('renderiza el mes actual y no muestra el boton volver a mes actual', async () => {
    const onMonthChange = jest.fn()
    const screen = await render(
      <MonthNavigator currentYearMonth="2026-08" onMonthChange={onMonthChange} />
    )

    expect(screen.getByText('Agosto 2026')).toBeTruthy()
    expect(screen.queryByTestId('month-navigator-current-btn')).toBeNull()
  })

  it('permite retroceder al mes anterior', async () => {
    const onMonthChange = jest.fn()
    const screen = await render(
      <MonthNavigator currentYearMonth="2026-08" onMonthChange={onMonthChange} />
    )

    fireEvent.press(screen.getByTestId('month-navigator-prev'))
    expect(onMonthChange).toHaveBeenCalledWith('2026-07')
  })

  it('permite avanzar al mes siguiente', async () => {
    const onMonthChange = jest.fn()
    const screen = await render(
      <MonthNavigator currentYearMonth="2026-08" onMonthChange={onMonthChange} />
    )

    fireEvent.press(screen.getByTestId('month-navigator-next'))
    expect(onMonthChange).toHaveBeenCalledWith('2026-09')
  })

  it('muestra el boton para volver al mes actual cuando se consulta un mes pasado', async () => {
    const onMonthChange = jest.fn()
    const screen = await render(
      <MonthNavigator currentYearMonth="2026-06" onMonthChange={onMonthChange} />
    )

    expect(screen.getByText('Junio 2026')).toBeTruthy()
    const currentBtn = screen.getByTestId('month-navigator-current-btn')
    expect(currentBtn).toBeTruthy()

    fireEvent.press(currentBtn)
    expect(onMonthChange).toHaveBeenCalledWith('2026-08')
  })

  it('respeta maxYearMonth deshabilitando el avance', async () => {
    const onMonthChange = jest.fn()
    const screen = await render(
      <MonthNavigator
        currentYearMonth="2026-08"
        maxYearMonth="2026-08"
        onMonthChange={onMonthChange}
      />
    )

    fireEvent.press(screen.getByTestId('month-navigator-next'))
    expect(onMonthChange).not.toHaveBeenCalled()
  })
})
