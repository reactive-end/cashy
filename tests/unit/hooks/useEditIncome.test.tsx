/**
 * Pruebas unitarias del hook useEditIncome.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import { useEditIncome } from '@src/hooks/useEditIncome'
import { loadSettings } from '@src/db/settings'
import { getExchangeRates } from '@src/services/rates'
import { getIncome, updateIncome } from '@src/db/incomes'
import { buildIncome, buildRates, buildSettings } from '../../helpers/factories'

const mockBack = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack })
}))

jest.mock('@src/db/incomes', () => ({
  getIncome: jest.fn(),
  getIncomes: jest.fn(async () => []),
  updateIncome: jest.fn(async () => undefined),
  deleteIncome: jest.fn()
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

const loadSettingsMock = loadSettings as jest.Mock
const getExchangeRatesMock = getExchangeRates as jest.Mock
const getIncomeMock = getIncome as jest.Mock
const updateIncomeMock = updateIncome as jest.Mock

describe('useEditIncome', () => {
  const existingIncome = buildIncome({
    id: 'inc-1',
    name: 'Sueldo',
    amount: 1200,
    currency: 'USD',
    paydayDay: 15
  })

  beforeEach(() => {
    jest.clearAllMocks()
    loadSettingsMock.mockResolvedValue(buildSettings())
    getExchangeRatesMock.mockResolvedValue(buildRates())
    getIncomeMock.mockResolvedValue(existingIncome)
  })

  it('precarga datos existentes en el borrador', async () => {
    const { result } = await renderHook(() => useEditIncome('inc-1'))
    await waitFor(() => expect(result.current?.loading).toBe(false))

    expect(result.current.values.name).toBe('Sueldo')
    expect(result.current.values.amountCents).toBe(120000)
    expect(result.current.values.paydayDayText).toBe('15')
    expect(result.current.isValid).toBe(true)
  })

  it('persiste las modificaciones al invocar handleSave', async () => {
    const { result } = await renderHook(() => useEditIncome('inc-1'))
    await waitFor(() => expect(result.current?.loading).toBe(false))

    await act(async () => {
      result.current.setValues((prev) => ({ ...prev, name: 'Sueldo actualizado' }))
    })

    await act(async () => {
      await result.current.handleSave()
    })

    expect(updateIncomeMock).toHaveBeenCalled()
    expect(mockBack).toHaveBeenCalled()
  })

  it('permite cerrar con close y maneja id undefined', async () => {
    const { result } = await renderHook(() => useEditIncome(undefined))
    expect(result.current.loading).toBe(true)

    result.current.close()
    expect(mockBack).toHaveBeenCalled()
  })

  it('persiste ingreso con tipo unique', async () => {
    const { result } = await renderHook(() => useEditIncome('inc-1'))
    await waitFor(() => expect(result.current?.loading).toBe(false))

    await act(async () => {
      result.current.setValues({
        name: 'Venta puntual',
        amountCents: 5000,
        currency: 'USD',
        paydayDayText: '20',
        type: 'unique'
      })
    })

    await act(async () => {
      await result.current.handleSave()
    })

    expect(updateIncomeMock).toHaveBeenCalled()
    expect(mockBack).toHaveBeenCalled()
  })
})
