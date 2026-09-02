/**
 * Pruebas unitarias del hook useFinancesScreen.
 */

import { renderHook, waitFor } from '@testing-library/react-native'

import { useFinancesScreen } from '@src/hooks/useFinancesScreen'
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

describe('useFinancesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getExchangeRatesMock.mockResolvedValue(buildRates())
    loadSettingsMock.mockResolvedValue(buildSettings())
    getExpensesMock.mockResolvedValue([])
    getIncomesMock.mockResolvedValue([])
  })

  it('inicializa y calcula subtitulos', async () => {
    const { result } = await renderHook(() => useFinancesScreen())
    await waitFor(() => expect(result.current?.expensesSubtitle).toBeDefined())

    expect(result.current.expensesSubtitle).toContain('registrados')
    expect(result.current.incomesSubtitle).toContain('fuentes')
  })

  it('navega a gastos con openExpenses', async () => {
    const { result } = await renderHook(() => useFinancesScreen())
    await waitFor(() => expect(result.current?.expensesSubtitle).toBeDefined())

    result.current.openExpenses()
    expect(mockPush).toHaveBeenCalledWith('/expenses')
  })

  it('navega a ingresos con openIncomes', async () => {
    const { result } = await renderHook(() => useFinancesScreen())
    await waitFor(() => expect(result.current?.incomesSubtitle).toBeDefined())

    result.current.openIncomes()
    expect(mockPush).toHaveBeenCalledWith('/incomes')
  })
})
