/**
 * Pruebas unitarias del hook useIncomesScreen.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import { useIncomesScreen } from '@src/hooks/useIncomesScreen'
import { getExchangeRates } from '@src/services/rates'
import { loadSettings } from '@src/db/settings'
import { getIncomes } from '@src/db/incomes'
import { buildIncome, buildRates, buildSettings } from '../../helpers/factories'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() })
}))

jest.mock('@src/db/incomes', () => ({
  getIncomes: jest.fn(async () => []),
  insertIncome: jest.fn(),
  updateIncome: jest.fn(),
  deleteIncome: jest.fn()
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

const getIncomesMock = getIncomes as jest.Mock
const getExchangeRatesMock = getExchangeRates as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock

describe('useIncomesScreen', () => {
  const inc1 = buildIncome({ id: 'i-1', name: 'Nomina', amount: 1000 })

  beforeEach(() => {
    jest.clearAllMocks()
    getExchangeRatesMock.mockResolvedValue(buildRates())
    loadSettingsMock.mockResolvedValue(buildSettings())
    getIncomesMock.mockResolvedValue([inc1])
  })

  it('actualiza texto de busqueda y filtra', async () => {
    const { result } = await renderHook(() => useIncomesScreen())
    await waitFor(() => expect(result.current?.paginatedRows).toBeDefined())

    await act(async () => {
      result.current.handleSearchChange('Nomina')
    })

    expect(result.current.searchText).toBe('Nomina')
  })

  it('navega a nuevo ingreso con openCreateIncome', async () => {
    const { result } = await renderHook(() => useIncomesScreen())
    await waitFor(() => expect(result.current?.paginatedRows).toBeDefined())

    result.current.openCreateIncome()
    expect(mockPush).toHaveBeenCalledWith('/new-income')
  })

  it('navega a detalle con openIncomeDetail', async () => {
    const { result } = await renderHook(() => useIncomesScreen())
    await waitFor(() => expect(result.current?.paginatedRows).toBeDefined())

    result.current.openIncomeDetail('i-1')
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/income/[id]',
      params: { id: 'i-1' }
    })
  })
})
