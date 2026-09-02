/**
 * Pruebas unitarias del hook useNewIncome.
 */

import { act, renderHook } from '@testing-library/react-native'

import { useNewIncome } from '@src/hooks/useNewIncome'
import { loadSettings } from '@src/db/settings'
import { getExchangeRates } from '@src/services/rates'
import { insertIncome } from '@src/db/incomes'
import { buildRates, buildSettings } from '../../helpers/factories'

const mockBack = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack })
}))

jest.mock('@src/db/incomes', () => ({
  getIncomes: jest.fn(async () => []),
  insertIncome: jest.fn(async () => ({ id: 'i-new' })),
  updateIncome: jest.fn(),
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
const insertIncomeMock = insertIncome as jest.Mock

describe('useNewIncome', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    loadSettingsMock.mockResolvedValue(buildSettings())
    getExchangeRatesMock.mockResolvedValue(buildRates())
  })

  it('inicializa con valores vacios y permite cerrar', async () => {
    const { result } = await renderHook(() => useNewIncome())

    expect(result.current.isValid).toBe(false)

    result.current.close()
    expect(mockBack).toHaveBeenCalled()
  })

  it('guarda ingreso cuando los valores son validos', async () => {
    const { result } = await renderHook(() => useNewIncome())

    await act(async () => {
      result.current.setValues({
        name: 'Freelance',
        amountCents: 15000,
        currency: 'USD',
        paydayDayText: '10',
        type: 'fixed',
        recurrence: 'monthly'
      })
    })

    expect(result.current.isValid).toBe(true)

    await act(async () => {
      await result.current.handleSave()
    })

    expect(insertIncomeMock).toHaveBeenCalled()
    expect(mockBack).toHaveBeenCalled()
  })

  it('guarda ingreso de tipo unique', async () => {
    const { result } = await renderHook(() => useNewIncome())

    await act(async () => {
      result.current.setValues({
        name: 'Venta',
        amountCents: 8000,
        currency: 'USD',
        paydayDayText: '12',
        type: 'unique'
      })
    })

    expect(result.current.isValid).toBe(true)

    await act(async () => {
      await result.current.handleSave()
    })

    expect(insertIncomeMock).toHaveBeenCalled()
    expect(mockBack).toHaveBeenCalled()
  })
})
