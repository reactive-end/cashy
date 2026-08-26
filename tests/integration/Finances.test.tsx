/**
 * Pruebas de integracion del Hub de Finanzas.
 * Cubren la visualizacion de las tarjetas de navegacion (Gastos e Ingresos),
 * las metricas previas y la redireccion a las pantallas dedicadas.
 */

import { render, userEvent } from '@testing-library/react-native'

import Finances from '../../app/(tabs)/finances'
import * as expensesRepo from '@src/db/expenses'
import * as receiptsRepo from '@src/db/incomeReceipts'
import * as incomesRepo from '@src/db/incomes'
import * as ratesService from '@src/services/rates'
import { __resetCacheForTests } from '@src/hooks/useSettings'
import { buildFixedExpense, buildIncome, buildRates } from '../helpers/factories'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush })
}))

const getExchangeRatesMock = ratesService.getExchangeRates as jest.Mock
const getExpensesMock = expensesRepo.getExpenses as jest.Mock
const getIncomesMock = incomesRepo.getIncomes as jest.Mock

jest.mock('@src/services/rates')
jest.mock('@src/db/expenses', () => ({
  getExpenses: jest.fn(async () => []),
  updateExpense: jest.fn()
}))
jest.mock('@src/db/settings')
jest.mock('@src/db/incomes', () => ({
  getIncomes: jest.fn(async () => []),
  insertIncome: jest.fn(async () => undefined),
  updateIncome: jest.fn(async () => undefined),
  deleteIncome: jest.fn(async () => undefined)
}))
jest.mock('@src/db/incomeReceipts', () => ({
  formatYearMonth: jest.fn(() => '2026-08'),
  getIncomeReceipts: jest.fn(async () => []),
  confirmIncomeReceipt: jest.fn(async () => undefined),
  deleteIncomeReceipt: jest.fn(async () => undefined)
}))

/** Sembrado comun: tasas vigentes, ajustes y datos base */
function sembrar() {
  getExchangeRatesMock.mockResolvedValue(buildRates())
  __resetCacheForTests()
}

describe('Hub de Finanzas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sembrar()
    getIncomesMock.mockReset()
    getIncomesMock.mockResolvedValue([])
    getExpensesMock.mockReset()
    getExpensesMock.mockResolvedValue([])
  })

  it('muestra el encabezado y las tarjetas principales de Gastos e Ingresos', async () => {
    getExpensesMock.mockResolvedValue([buildFixedExpense({ name: 'Alquiler', amount: 300 })])
    getIncomesMock.mockResolvedValue([buildIncome({ name: 'Salario', amount: 1000 })])

    const pantalla = await render(<Finances />)

    expect(await pantalla.findByText('Finanzas')).toBeTruthy()
    expect(pantalla.getByText('Gastos')).toBeTruthy()
    expect(pantalla.getByText('Ingresos')).toBeTruthy()
    expect(pantalla.getByText('Balance de este mes')).toBeTruthy()
    expect(pantalla.getByLabelText('Ir a Gastos')).toBeTruthy()
    expect(pantalla.getByLabelText('Ir a Ingresos')).toBeTruthy()
  })

  it('navega a la pantalla dedicada de Gastos al tocar su tarjeta', async () => {
    const pantalla = await render(<Finances />)
    const usuario = userEvent.setup()

    const cardGastos = await pantalla.findByLabelText('Ir a Gastos')
    await usuario.press(cardGastos)

    expect(mockPush).toHaveBeenCalledWith('/expenses')
  })

  it('navega a la pantalla dedicada de Ingresos al tocar su tarjeta', async () => {
    const pantalla = await render(<Finances />)
    const usuario = userEvent.setup()

    const cardIngresos = await pantalla.findByLabelText('Ir a Ingresos')
    await usuario.press(cardIngresos)

    expect(mockPush).toHaveBeenCalledWith('/incomes')
  })
})
