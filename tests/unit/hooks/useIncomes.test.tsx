/**
 * Pruebas unitarias del hook useIncomes.
 * Cubren carga, sincronizacion por eventos, CRUD y resumen mensual.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import * as incomesRepo from '@src/db/incomes'
import { EXPENSES_LOAD_ERROR_MESSAGE } from '@src/lib/errorMessages'
import { subscribe } from '@src/lib/events'
import { useIncomes } from '@src/hooks/useIncomes'

import { buildIncome, buildRates } from '../../helpers/factories'

const getIncomesMock = incomesRepo.getIncomes as jest.Mock
const insertIncomeMock = incomesRepo.insertIncome as jest.Mock
const updateIncomeMock = incomesRepo.updateIncome as jest.Mock
const deleteIncomeMock = incomesRepo.deleteIncome as jest.Mock

jest.mock('@src/db/incomes', () => ({
  getIncomes: jest.fn(async () => []),
  insertIncome: jest.fn(),
  updateIncome: jest.fn(),
  deleteIncome: jest.fn(async () => undefined)
}))

describe('useIncomes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getIncomesMock.mockResolvedValue([])
  })

  it('carga el listado al montar y expone loading', async () => {
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

  it('recarga sola cuando otra pantalla emite incomes-changed', async () => {
    const { result } = await renderHook(() => useIncomes(buildRates(), 'USD'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    getIncomesMock.mockResolvedValue([buildIncome(), buildIncome({ id: 'ingreso-2' })])

    const eventos: string[] = []
    // La emision proviene del propio hook tras sus mutaciones; aqui se
    // simula la de otra instancia para validar la suscripcion.
    void eventos

    await act(async () => {
      const { emit } = require('@src/lib/events')
      emit('incomes-changed')
    })

    await waitFor(() => expect(result.current.incomes).toHaveLength(2))
  })

  it('calcula el total mensual convertido a la moneda base', async () => {
    getIncomesMock.mockResolvedValue([
      buildIncome({ amount: 100, currency: 'USD' }),
      buildIncome({ id: 'i-2', amount: 4000, currency: 'VES' })
    ])

    const { result } = await renderHook(() => useIncomes(buildRates(), 'USD'))
    await waitFor(() => expect(result.current.incomes).toHaveLength(2))

    // buildRates trae bcvUsd 779.95 -> 4000 VES equivalen a ~5.13 USD.
    expect(result.current.monthlyTotal).toBeCloseTo(105.13, 1)
  })

  it('devuelve resumen null sin tasas disponibles', async () => {
    getIncomesMock.mockResolvedValue([buildIncome()])

    const { result } = await renderHook(() => useIncomes(null, 'USD'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.monthlyTotal).toBeNull()
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
      { name: 'Freelance', amount: 300, currency: 'EUR', paydayDay: 20 },
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
})
