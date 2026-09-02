/**
 * Pruebas unitarias del hook useIncomeDetail.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import { getIncome } from '@src/db/incomes'
import { useIncomeDetail } from '@src/hooks/useIncomeDetail'
import { getExchangeRates } from '@src/services/rates'
import { loadSettings } from '@src/db/settings'
import { buildIncome, buildRates, buildSettings } from '../../helpers/factories'

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

jest.mock('@src/db/incomes', () => ({
  getIncome: jest.fn(),
  getIncomes: jest.fn(async () => []),
  deleteIncome: jest.fn(async () => undefined)
}))

jest.mock('@src/db/incomeReceipts', () => ({
  formatYearMonth: jest.fn(() => '2026-08'),
  getIncomeReceipts: jest.fn(async () => []),
  confirmIncomeReceipt: jest.fn(async () => undefined),
  deleteIncomeReceipt: jest.fn(async () => undefined)
}))

jest.mock('@src/services/rates', () => ({
  getExchangeRates: jest.fn()
}))

jest.mock('@src/db/settings', () => ({
  loadSettings: jest.fn()
}))

const getIncomeMock = getIncome as jest.Mock
const getExchangeRatesMock = getExchangeRates as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock

describe('useIncomeDetail', () => {
  const sampleIncome = buildIncome({
    id: 'ing-1',
    name: 'Sueldo',
    amount: 1500,
    currency: 'USD',
    paydayDay: 15
  })

  beforeEach(() => {
    jest.clearAllMocks()
    getExchangeRatesMock.mockResolvedValue(buildRates())
    loadSettingsMock.mockResolvedValue(buildSettings())
    getIncomeMock.mockResolvedValue(sampleIncome)
  })

  it('carga el ingreso y genera detailRows', async () => {
    const { result } = await renderHook(() => useIncomeDetail('ing-1'))
    await waitFor(() => expect(result.current?.loading).toBe(false))

    expect(result.current.income).toEqual(sampleIncome)
    expect(result.current.detailRows.some((r) => r.label === 'Concepto')).toBe(true)
    expect(result.current.detailRows.some((r) => r.label === 'Dia de cobro')).toBe(true)
  })

  it('navega a edicion con openEdit', async () => {
    const { result } = await renderHook(() => useIncomeDetail('ing-1'))
    await waitFor(() => expect(result.current?.loading).toBe(false))

    result.current.openEdit()

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/edit-income/[id]',
      params: { id: 'ing-1' }
    })
  })

  it('ejecuta el borrado del ingreso', async () => {
    const { result } = await renderHook(() => useIncomeDetail('ing-1'))
    await waitFor(() => expect(result.current?.loading).toBe(false))

    await act(async () => {
      await result.current.handleConfirmDelete()
    })

    expect(mockBack).toHaveBeenCalled()
  })
})
