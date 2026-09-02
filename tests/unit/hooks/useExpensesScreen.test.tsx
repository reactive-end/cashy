/**
 * Pruebas unitarias del hook useExpensesScreen.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import { useExpensesScreen } from '@src/hooks/useExpensesScreen'
import { getExchangeRates } from '@src/services/rates'
import { loadSettings } from '@src/db/settings'
import { getExpenses } from '@src/db/expenses'
import {
  buildFixedExpense,
  buildRates,
  buildSettings,
  buildUniqueExpense
} from '../../helpers/factories'

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

jest.mock('@src/db/expenseReceipts', () => ({
  getExpenseReceipts: jest.fn(async () => []),
  getExpenseReceiptsByExpense: jest.fn(async () => []),
  confirmExpenseReceipt: jest.fn(),
  deleteExpenseReceipt: jest.fn()
}))

jest.mock('@src/db/incomeReceipts', () => ({
  formatYearMonth: jest.fn(() => '2026-08'),
  getIncomeReceipts: jest.fn(async () => [])
}))

jest.mock('@src/services/rates', () => ({
  getExchangeRates: jest.fn()
}))

jest.mock('@src/db/settings', () => ({
  loadSettings: jest.fn()
}))

const getExpensesMock = getExpenses as jest.Mock
const getExchangeRatesMock = getExchangeRates as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock

describe('useExpensesScreen', () => {
  const fixed1 = buildFixedExpense({ id: 'f-1', name: 'Alquiler', amount: 500, category: 'Hogar' })
  const unique1 = buildUniqueExpense({
    id: 'u-1',
    name: 'Supermercado',
    amount: 80,
    category: 'Comida'
  })

  beforeEach(() => {
    jest.clearAllMocks()
    getExchangeRatesMock.mockResolvedValue(buildRates())
    loadSettingsMock.mockResolvedValue(buildSettings())
    getExpensesMock.mockResolvedValue([fixed1, unique1])
  })

  it('inicializa con segmento fijo y actualiza texto de busqueda', async () => {
    const { result } = await renderHook(() => useExpensesScreen())
    await waitFor(() => expect(result.current?.segment).toBe('fixed'))

    await act(async () => {
      result.current.handleSearchChange('alquiler')
    })

    expect(result.current.searchText).toBe('alquiler')
  })

  it('cambia de segmento con handleSegmentChange', async () => {
    const { result } = await renderHook(() => useExpensesScreen())
    await waitFor(() => expect(result.current?.segment).toBe('fixed'))

    await act(async () => {
      result.current.handleSegmentChange('unique')
    })

    expect(result.current.segment).toBe('unique')
  })

  it('abre la pantalla de creacion de gasto', async () => {
    const { result } = await renderHook(() => useExpensesScreen())
    await waitFor(() => expect(result.current?.segment).toBe('fixed'))

    result.current.openCreateExpense()
    expect(mockPush).toHaveBeenCalledWith('/new-expense')
  })
})
