/**
 * Pruebas de integracion de la pantalla dedicada de Mercado (app/market.tsx).
 * Verifica renderizado de cabecera, navegacion de cierre y persistencia
 * del total acumulado como gasto unico en SQLite.
 */

import { fireEvent, render } from '@testing-library/react-native'

import * as expensesRepo from '@src/db/expenses'
import { loadSettings } from '@src/db/settings'
import { __resetCacheForTests } from '@src/hooks/useSettings'
import { getExchangeRates } from '@src/services/rates'

import MarketScreen from '../../app/market'
import { buildRates, buildSettings } from '../helpers/factories'
import { wait } from '../helpers/wait'

const mockBack = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack })
}))

jest.mock('@src/services/rates')
jest.mock('@src/db/settings')
jest.mock('@src/db/expenses', () => ({
  getExpenses: jest.fn(async () => []),
  insertExpense: jest.fn(async (input, id) => ({
    id,
    ...input,
    active: true,
    createdAt: '2026-08-29T12:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  }))
}))
jest.mock('@src/db/incomeReceipts', () => ({
  formatYearMonth: jest.fn(() => '2026-08'),
  getIncomeReceipts: jest.fn(async () => [])
}))
jest.mock('@src/db/expenseReceipts', () => ({
  getExpenseReceipts: jest.fn(async () => [])
}))

const getExchangeRatesMock = getExchangeRates as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock
const insertExpenseMock = expensesRepo.insertExpense as jest.Mock

describe('pantalla dedicada MarketScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __resetCacheForTests()
    getExchangeRatesMock.mockResolvedValue(buildRates())
    loadSettingsMock.mockResolvedValue(buildSettings())
  })

  it('renderiza la cabecera con titulo Mercado y permite regresar', async () => {
    const pantalla = await render(<MarketScreen />)
    await wait(100)

    expect(pantalla.getByText('Mercado')).toBeTruthy()

    fireEvent.press(pantalla.getByTestId('btn-close-market'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('suma productos y registra el gasto unico en el repositorio de gastos', async () => {
    const pantalla = await render(<MarketScreen />)
    await wait(200)

    // Sumar 1 producto
    fireEvent.changeText(pantalla.getByTestId('input-item-name'), 'Frutas y verduras')
    await wait(60)
    fireEvent.changeText(pantalla.getByTestId('input-item-amount'), '1850') // $ 18.50
    await wait(60)
    fireEvent.press(pantalla.getByTestId('btn-add-item'))
    await wait(60)

    expect(pantalla.getByText('Frutas y verduras')).toBeTruthy()
    expect(pantalla.getByTestId('total-mercado').props.children).toBe('$ 18,50')

    // Abrir modal de registrar gasto (Paso 1: Costo adicional)
    fireEvent.press(pantalla.getByTestId('btn-open-register-expense'))
    await wait(60)

    // Omitir costo adicional para avanzar al Paso 2
    fireEvent.press(pantalla.getByTestId('btn-skip-extra-cost'))
    await wait(60)

    // Confirmar guardado
    fireEvent.press(pantalla.getByTestId('btn-confirm-save-expense'))
    await wait(60)

    expect(pantalla.getByText('Gasto registrado')).toBeTruthy()
    expect(insertExpenseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mercado',
        amount: 18.5,
        currency: 'USD',
        category: 'Compras',
        type: 'unique'
      }),
      expect.any(String)
    )
  })
})
