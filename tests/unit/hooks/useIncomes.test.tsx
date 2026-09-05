/**
 * Pruebas unitarias del hook useIncomes.
 * Cubren carga, sincronizacion por eventos, CRUD, resumen mensual
 * y confirmacion de recibos de cobro.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import * as incomeReceiptsRepo from '@src/db/incomeReceipts'
import * as incomesRepo from '@src/db/incomes'
import { EXPENSES_LOAD_ERROR_MESSAGE } from '@src/lib/errorMessages'
import { subscribe } from '@src/lib/events'
import { useIncomes, type UseIncomesResult } from '@src/hooks/useIncomes'
import type { ExchangeRates } from '@src/types/domain'

import { buildIncome, buildRates } from '../../helpers/factories'

const getIncomesMock = incomesRepo.getIncomes as jest.Mock
const insertIncomeMock = incomesRepo.insertIncome as jest.Mock
const updateIncomeMock = incomesRepo.updateIncome as jest.Mock
const deleteIncomeMock = incomesRepo.deleteIncome as jest.Mock
const getIncomeReceiptsMock = incomeReceiptsRepo.getIncomeReceipts as jest.Mock
const confirmIncomeReceiptMock = incomeReceiptsRepo.confirmIncomeReceipt as jest.Mock
const deleteIncomeReceiptMock = incomeReceiptsRepo.deleteIncomeReceipt as jest.Mock

jest.mock('@src/db/incomes', () => ({
  getIncomes: jest.fn(async () => []),
  insertIncome: jest.fn(),
  updateIncome: jest.fn(),
  deleteIncome: jest.fn(async () => undefined)
}))

jest.mock('@src/db/incomeReceipts', () => ({
  formatYearMonth: jest.fn(() => '2026-08'),
  getIncomeReceipts: jest.fn(async () => []),
  confirmIncomeReceipt: jest.fn(async (income, yearMonth, id) => ({
    id,
    incomeId: income.id,
    yearMonth,
    amount: income.amount,
    currency: income.currency,
    confirmedAt: '2026-08-26T00:00:00.000Z',
    createdAt: '2026-08-26T00:00:00.000Z',
    updatedAt: '2026-08-26T00:00:00.000Z'
  })),
  deleteIncomeReceipt: jest.fn(async () => undefined)
}))

describe('useIncomes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getIncomesMock.mockResolvedValue([])
    getIncomeReceiptsMock.mockResolvedValue([])
  })

  it('carga el listado y recibos al montar y expone loading', async () => {
    getIncomesMock.mockResolvedValue([buildIncome()])

    const { result } = await renderHook(() => useIncomes(buildRates(), 'USD'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.incomes).toHaveLength(1)
    expect(result.current.error).toBeNull()
  })

  it('reporta mensaje amigable cuando la lectura falla', async () => {
    getIncomesMock.mockRejectedValueOnce(new Error('db bloqueada'))

    const { result } = await renderHook(() => useIncomes(buildRates(), 'USD'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(EXPENSES_LOAD_ERROR_MESSAGE)
  })

  it('recarga sola cuando otra pantalla emite incomes-changed o income-receipts-changed', async () => {
    const { result } = await renderHook(() => useIncomes(buildRates(), 'USD'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    getIncomesMock.mockResolvedValue([buildIncome(), buildIncome({ id: 'ingreso-2' })])

    await act(async () => {
      const { emit } = require('@src/lib/events')
      emit('incomes-changed')
    })

    await waitFor(() => expect(result.current.incomes).toHaveLength(2))
  })

  it('calcula el total mensual y el total confirmado convertidos a la moneda base', async () => {
    getIncomesMock.mockResolvedValue([
      buildIncome({ id: 'i-1', amount: 100, currency: 'USD', paydayDay: 5 }),
      buildIncome({ id: 'i-2', amount: 4000, currency: 'VES', paydayDay: 20 })
    ])
    getIncomeReceiptsMock.mockResolvedValue([
      {
        id: 'r-1',
        incomeId: 'i-1',
        yearMonth: '2026-08',
        amount: 100,
        currency: 'USD',
        confirmedAt: '2026-08-05T00:00:00.000Z',
        createdAt: '2026-08-05T00:00:00.000Z',
        updatedAt: '2026-08-05T00:00:00.000Z'
      }
    ])

    const { result } = await renderHook(() => useIncomes(buildRates(), 'USD'))
    await waitFor(() => expect(result.current.incomes).toHaveLength(2))

    // Total estimado: 100 + 4000/779.95 ~ 105.13 USD
    expect(result.current.monthlyTotal).toBeCloseTo(105.13, 1)
    // Total confirmado: 100 USD
    expect(result.current.confirmedTotal).toBe(100)
    expect(result.current.isConfirmedThisMonth('i-1')).toBe(true)
    expect(result.current.isConfirmedThisMonth('i-2')).toBe(false)
  })

  it('confirma el cobro de un ingreso y emite el evento', async () => {
    const income = buildIncome({ id: 'i-1', amount: 200, currency: 'USD' })
    getIncomesMock.mockResolvedValue([income])

    const { result } = await renderHook(() => useIncomes(buildRates(), 'USD'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const eventos: string[] = []
    const desuscribir = subscribe('income-receipts-changed', () => eventos.push('recibo'))

    await act(async () => {
      await result.current.confirmReceipt(income)
    })

    desuscribir()

    expect(confirmIncomeReceiptMock).toHaveBeenCalledWith(
      income,
      '2026-08',
      expect.any(String),
      expect.any(Number),
      'USD'
    )
    expect(eventos).toEqual(['recibo'])
  })

  it('calcula monthlyTotal considerando ingresos unicos y factores de recurrencia', async () => {
    getIncomesMock.mockResolvedValue([
      buildIncome({
        id: 'f-1',
        amount: 100,
        currency: 'USD',
        type: 'fixed',
        recurrence: 'biweekly'
      }),
      buildIncome({ id: 'u-1', amount: 50, currency: 'USD', type: 'unique' })
    ])

    const { result } = await renderHook(() => useIncomes(buildRates(), 'USD'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // biweekly: 100 * 2 = 200, unique: 50 * 1 = 50 => 250
    expect(result.current.monthlyTotal).toBe(250)
  })

  it('rerevierte o elimina la confirmacion de un ingreso y emite el evento', async () => {
    const { result } = await renderHook(() => useIncomes(buildRates(), 'USD'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const eventos: string[] = []
    const desuscribir = subscribe('income-receipts-changed', () => eventos.push('eliminado'))

    await act(async () => {
      await result.current.unconfirmReceipt('i-1')
    })

    desuscribir()

    expect(deleteIncomeReceiptMock).toHaveBeenCalledWith('i-1', '2026-08')
    expect(eventos).toEqual(['eliminado'])
  })

  it('devuelve resumen null sin tasas disponibles', async () => {
    getIncomesMock.mockResolvedValue([buildIncome()])

    const { result } = await renderHook(() => useIncomes(null, 'USD'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.monthlyTotal).toBeNull()
    expect(result.current.confirmedTotal).toBeNull()
  })

  it('crear persiste con id nuevo y emite el evento', async () => {
    insertIncomeMock.mockResolvedValue(buildIncome())
    const { result } = await renderHook(() => useIncomes(buildRates(), 'USD'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const recibidos: string[] = []
    const desuscribir = subscribe('incomes-changed', () => recibidos.push('emitido'))

    await act(async () => {
      await result.current.create({
        name: 'Freelance',
        amount: 300,
        currency: 'EUR',
        paydayDay: 20
      })
    })

    desuscribir()

    expect(insertIncomeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Freelance',
        amount: 300,
        currency: 'EUR',
        paydayDay: 20,
        baseAmount: expect.any(Number),
        baseCurrency: 'USD'
      }),
      expect.any(String)
    )
    expect(recibidos).toEqual(['emitido'])
  })

  it('editar delega en el repositorio y emite', async () => {
    updateIncomeMock.mockResolvedValue(buildIncome())
    const { result } = await renderHook(() => useIncomes(null, 'USD'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.edit('ingreso-1', { amount: 900 })
    })

    expect(updateIncomeMock).toHaveBeenCalledWith('ingreso-1', { amount: 900 })
  })

  it('quitar elimina por identificador y emite', async () => {
    const { result } = await renderHook(() => useIncomes(null, 'USD'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const recibidos: string[] = []
    const desuscribir = subscribe('incomes-changed', () => recibidos.push('emitido'))

    await act(async () => {
      await result.current.remove('ingreso-9')
    })

    desuscribir()

    expect(deleteIncomeMock).toHaveBeenCalledWith('ingreso-9')
    expect(recibidos).toEqual(['emitido'])
  })

  it('calcula pendingConfirmations acotando el dia 31 al largo del mes y excluyendo unicos', async () => {
    jest.useFakeTimers({ now: new Date('2026-04-30T12:00:00.000Z') })

    getIncomesMock.mockResolvedValue([
      buildIncome({ id: 'inc-31', amount: 500, paydayDay: 31, type: 'fixed' }),
      buildIncome({ id: 'inc-unico', amount: 300, paydayDay: 15, type: 'unique' })
    ])
    getIncomeReceiptsMock.mockResolvedValue([])

    const { result } = await renderHook(() => useIncomes(buildRates(), 'USD'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.pendingConfirmations).toHaveLength(1)
    expect(result.current.pendingConfirmations[0].id).toBe('inc-31')

    jest.useRealTimers()
  })

  it('omite ingresos creados en un mes futuro respecto al evaluado', async () => {
    getIncomesMock.mockResolvedValue([
      buildIncome({
        id: 'inc-futuro',
        amount: 800,
        currency: 'USD',
        type: 'unique',
        createdAt: '2026-09-01T00:00:00.000Z'
      })
    ])
    getIncomeReceiptsMock.mockResolvedValue([])

    // Evaluando agosto 2026
    const { result } = await renderHook(() => useIncomes(buildRates(), 'USD', '2026-08'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.monthlyTotal).toBe(0)
  })

  it('mantiene inmutable el monto de ingresos confirmados usando el snapshot aunque cambien las tasas', async () => {
    getIncomesMock.mockResolvedValue([
      buildIncome({
        id: 'inc-1',
        amount: 1000,
        currency: 'VES',
        type: 'fixed'
      })
    ])
    getIncomeReceiptsMock.mockResolvedValue([
      {
        id: 'rec-inc-1',
        incomeId: 'inc-1',
        yearMonth: '2026-08',
        amount: 1000,
        currency: 'VES',
        baseAmount: 27.77,
        baseCurrency: 'USD',
        confirmedAt: '2026-08-05T00:00:00.000Z',
        createdAt: '2026-08-05T00:00:00.000Z',
        updatedAt: '2026-08-05T00:00:00.000Z'
      }
    ])

    const ratesIniciales = buildRates()
    const { result, rerender } = await renderHook<
      UseIncomesResult,
      { rates: ExchangeRates | null }
    >(({ rates }: { rates: ExchangeRates | null }) => useIncomes(rates, 'USD', '2026-08'), {
      initialProps: { rates: ratesIniciales }
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.confirmedTotal).toBe(27.77)
    expect(result.current.monthlyTotal).toBe(27.77)

    // Tasa se devalua drasticamente
    const ratesDevaluadas = {
      ...ratesIniciales,
      bcvUsd: 1000
    }
    rerender({ rates: ratesDevaluadas })

    // El total confirmado se mantiene inmutable en 27.77
    expect(result.current.confirmedTotal).toBe(27.77)
    expect(result.current.monthlyTotal).toBe(27.77)
  })
})
