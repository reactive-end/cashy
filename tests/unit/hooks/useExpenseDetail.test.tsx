/**
 * Pruebas unitarias del hook useExpenseDetail.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import { getExpenseReceiptsByExpense } from '@src/db/expenseReceipts'
import { getExpense } from '@src/db/expenses'
import { useExpenseDetail } from '@src/hooks/useExpenseDetail'
import { buildFixedExpense, buildRates, buildSettings } from '../../helpers/factories'

const mockPush = jest.fn()
const mockBack = jest.fn()

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react')
  return {
    useRouter: () => ({ push: mockPush, back: mockBack }),
    useFocusEffect: (callback: () => void) => {
      useEffect(callback, [callback])
    }
  }
})

jest.mock('@src/db/expenses', () => ({
  getExpense: jest.fn(),
  getExpenses: jest.fn(async () => []),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(async () => undefined)
}))

jest.mock('@src/db/expenseReceipts', () => ({
  getExpenseReceipts: jest.fn(async () => []),
  getExpenseReceiptsByExpense: jest.fn(async () => []),
  confirmExpenseReceipt: jest.fn(async () => undefined),
  deleteExpenseReceipt: jest.fn(async () => undefined)
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

import { getExchangeRates } from '@src/services/rates'
import { loadSettings } from '@src/db/settings'

const getExpenseMock = getExpense as jest.Mock
const getExpenseReceiptsByExpenseMock = getExpenseReceiptsByExpense as jest.Mock
const getExchangeRatesMock = getExchangeRates as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock

describe('useExpenseDetail', () => {
  const sampleExpense = buildFixedExpense({
    id: 'fijo-1',
    name: 'Alquiler',
    amount: 300,
    currency: 'USD',
    dueDay: 5,
    note: 'Nota mensual'
  })

  beforeEach(() => {
    jest.clearAllMocks()
    getExchangeRatesMock.mockResolvedValue(buildRates())
    loadSettingsMock.mockResolvedValue(buildSettings())
    getExpenseMock.mockResolvedValue(sampleExpense)
    getExpenseReceiptsByExpenseMock.mockResolvedValue([])
  })

  it('carga el gasto y construye las filas de detalle', async () => {
    const { result } = await renderHook(() => useExpenseDetail('fijo-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.expense).toEqual(sampleExpense)
    expect(result.current.detailRows.some((r) => r.label === 'Tipo')).toBe(true)
    expect(result.current.detailRows.some((r) => r.label === 'Dia de cobro mensual')).toBe(true)
  })

  it('navega a edicion con openEdit', async () => {
    const { result } = await renderHook(() => useExpenseDetail('fijo-1'))
    await waitFor(() => expect(result.current?.loading).toBe(false))

    result.current.openEdit()

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/edit-expense/[id]',
      params: { id: 'fijo-1' }
    })
  })

  it('ejecuta el borrado y regresa a la pantalla previa', async () => {
    const { result } = await renderHook(() => useExpenseDetail('fijo-1'))
    await waitFor(() => expect(result.current?.loading).toBe(false))

    await act(async () => {
      await result.current.handleConfirmDelete()
    })

    expect(mockBack).toHaveBeenCalled()
  })
})
