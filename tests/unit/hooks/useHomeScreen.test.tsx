/**
 * Pruebas unitarias del hook useHomeScreen.
 */

import { renderHook, waitFor } from '@testing-library/react-native'

import { useHomeScreen, greetingByTime } from '@src/hooks/useHomeScreen'
import { getExchangeRates } from '@src/services/rates'
import { loadSettings } from '@src/db/settings'
import { getExpenses } from '@src/db/expenses'
import { getIncomes } from '@src/db/incomes'
import { buildRates, buildSettings } from '../../helpers/factories'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() })
}))

jest.mock('@src/db/expenses', () => ({
  getExpenses: jest.fn(async () => []),
  insertExpense: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn()
}))

jest.mock('@src/db/incomes', () => ({
  getIncomes: jest.fn(async () => []),
  insertIncome: jest.fn(),
  updateIncome: jest.fn(),
  deleteIncome: jest.fn()
}))

jest.mock('@src/db/expenseReceipts', () => ({
  getExpenseReceipts: jest.fn(async () => []),
  getExpenseReceiptsByExpense: jest.fn(async () => []),
  confirmExpenseReceipt: jest.fn(),
  deleteExpenseReceipt: jest.fn()
}))

jest.mock('@src/db/incomeReceipts', () => ({
  formatYearMonth: jest.fn(() => '2026-08'),
  getIncomeReceipts: jest.fn(async () => []),
  confirmIncomeReceipt: jest.fn(),
  deleteIncomeReceipt: jest.fn()
}))

jest.mock('@src/services/rates', () => ({
  getExchangeRates: jest.fn()
}))

jest.mock('@src/db/settings', () => ({
  loadSettings: jest.fn()
}))

const getExpensesMock = getExpenses as jest.Mock
const getIncomesMock = getIncomes as jest.Mock
const getExchangeRatesMock = getExchangeRates as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock

describe('useHomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getExchangeRatesMock.mockResolvedValue(buildRates())
    loadSettingsMock.mockResolvedValue(buildSettings())
    getExpensesMock.mockResolvedValue([])
    getIncomesMock.mockResolvedValue([])
  })

  it('calcula el saludo correctamente segun la hora', () => {
    const greeting = greetingByTime()
    expect(['Buenos dias', 'Buenas tardes', 'Buenas noches']).toContain(greeting)
  })

  it('inicializa y expone navegacion hacia nuevo gasto', async () => {
    const { result } = await renderHook(() => useHomeScreen())
    await waitFor(() => expect(result.current?.greeting).toBeDefined())

    result.current.openNewExpense()
    expect(mockPush).toHaveBeenCalledWith('/new-expense')
  })

  it('navega a detalle del gasto con openExpenseDetail', async () => {
    const { result } = await renderHook(() => useHomeScreen())
    await waitFor(() => expect(result.current?.greeting).toBeDefined())

    result.current.openExpenseDetail('fijo-1')
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/expense/[id]',
      params: { id: 'fijo-1' }
    })
  })
})
