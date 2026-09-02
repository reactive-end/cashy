/**
 * Pruebas unitarias del hook useEditExpense.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import { useEditExpense } from '@src/hooks/useEditExpense'
import { getExpense, updateExpense, deleteExpense } from '@src/db/expenses'
import { loadSettings } from '@src/db/settings'
import { getExchangeRates } from '@src/services/rates'
import { buildFixedExpense, buildRates, buildSettings } from '../../helpers/factories'

const mockBack = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack })
}))

jest.mock('@src/db/expenses', () => ({
  getExpense: jest.fn(),
  getExpenses: jest.fn(async () => []),
  updateExpense: jest.fn(async (_id, changes) => ({
    id: 'f-1',
    type: 'fixed',
    active: true,
    ...changes
  })),
  deleteExpense: jest.fn(async () => undefined)
}))

jest.mock('@src/db/expenseReceipts', () => ({
  getExpenseReceipts: jest.fn(async () => []),
  getExpenseReceiptsByExpense: jest.fn(async () => [])
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

jest.mock('@src/lib/notifications', () => ({
  scheduleReminder: jest.fn(async () => undefined),
  cancelReminder: jest.fn(async () => undefined)
}))

const getExpenseMock = getExpense as jest.Mock
const updateExpenseMock = updateExpense as jest.Mock
const deleteExpenseMock = deleteExpense as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock
const getExchangeRatesMock = getExchangeRates as jest.Mock

describe('useEditExpense', () => {
  const expense = buildFixedExpense({ id: 'f-1', name: 'Internet' })

  beforeEach(() => {
    jest.clearAllMocks()
    loadSettingsMock.mockResolvedValue(buildSettings())
    getExchangeRatesMock.mockResolvedValue(buildRates())
    getExpenseMock.mockResolvedValue(expense)
  })

  it('carga el gasto existente', async () => {
    const { result } = await renderHook(() => useEditExpense('f-1'))
    await waitFor(() => expect(result.current?.loading).toBe(false))

    expect(result.current.expense).toEqual(expense)
  })

  it('guarda cambios y regresa al invocar handleSave', async () => {
    const { result } = await renderHook(() => useEditExpense('f-1'))
    await waitFor(() => expect(result.current?.loading).toBe(false))

    await act(async () => {
      await result.current.handleSave({
        name: 'Internet Fibra',
        amount: 30,
        currency: 'USD',
        category: 'Servicios',
        type: 'fixed',
        dueDay: 5
      })
    })

    expect(updateExpenseMock).toHaveBeenCalled()
    expect(mockBack).toHaveBeenCalled()
  })

  it('elimina el gasto y regresa al invocar handleDelete', async () => {
    const { result } = await renderHook(() => useEditExpense('f-1'))
    await waitFor(() => expect(result.current?.loading).toBe(false))

    await act(async () => {
      await result.current.handleDelete()
    })

    expect(deleteExpenseMock).toHaveBeenCalled()
    expect(mockBack).toHaveBeenCalled()
  })
})
