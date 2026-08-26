/**
 * Pruebas de integracion de la pantalla de detalle de ingreso (app/income/[id].tsx).
 * Verifica la vista completa del ingreso, el cambio de estado de cobro,
 * la edicion con modal y el flujo de eliminacion con dialogo de confirmacion.
 */

import { fireEvent, render } from '@testing-library/react-native'

import IncomeDetail from '../../app/income/[id]'
import * as receiptsRepo from '@src/db/incomeReceipts'
import * as incomesRepo from '@src/db/incomes'
import { loadSettings } from '@src/db/settings'
import { __resetCacheForTests } from '@src/hooks/useSettings'
import { getExchangeRates } from '@src/services/rates'
import type { Income } from '@src/types/domain'
import { wait } from '../helpers/wait'
import { buildIncome, buildRates, buildSettings } from '../helpers/factories'

const mockBack = jest.fn()
const mockPush = jest.fn()

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react')

  return {
    Stack: { Screen: () => null },
    useRouter: () => ({ back: mockBack, push: mockPush }),
    useLocalSearchParams: () => ({ id: 'ingreso-1' }),
    useFocusEffect: (callback: () => void) => {
      useEffect(callback, [callback])
    }
  }
})

jest.mock('@src/services/rates')
jest.mock('@src/db/settings')
jest.mock('@src/db/incomes', () => ({
  getIncome: jest.fn(async () => null),
  getIncomes: jest.fn(async () => []),
  insertIncome: jest.fn(async () => undefined),
  updateIncome: jest.fn(async () => undefined),
  deleteIncome: jest.fn(async () => undefined)
}))
jest.mock('@src/db/incomeReceipts', () => ({
  formatYearMonth: jest.fn(() => '2026-08'),
  getIncomeReceipts: jest.fn(async () => []),
  confirmIncomeReceipt: jest.fn(async () => undefined),
  deleteIncomeReceipt: jest.fn(async () => undefined),
  getPendingIncomeConfirmations: jest.fn(async () => [])
}))

const getExchangeRatesMock = getExchangeRates as jest.Mock
const getIncomeMock = incomesRepo.getIncome as jest.Mock
const getIncomesMock = incomesRepo.getIncomes as jest.Mock
const updateIncomeMock = incomesRepo.updateIncome as jest.Mock
const deleteIncomeMock = incomesRepo.deleteIncome as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock
const confirmIncomeReceiptMock = receiptsRepo.confirmIncomeReceipt as jest.Mock
const getIncomeReceiptsMock = receiptsRepo.getIncomeReceipts as jest.Mock

function sembrar(ingreso: Income) {
  __resetCacheForTests()
  getExchangeRatesMock.mockResolvedValue(buildRates())
  loadSettingsMock.mockResolvedValue(buildSettings())
  getIncomeMock.mockResolvedValue(ingreso)
  getIncomesMock.mockResolvedValue([ingreso])
  getIncomeReceiptsMock.mockResolvedValue([])
  deleteIncomeMock.mockResolvedValue(undefined)
}

describe('pantalla de detalle del ingreso', () => {
  const ingresoPrueba = buildIncome({
    id: 'ingreso-1',
    name: 'Nomina Principal',
    amount: 1200,
    currency: 'USD',
    paydayDay: 5
  })

  beforeEach(() => {
    jest.clearAllMocks()
    sembrar(ingresoPrueba)
  })

  it('muestra los datos del ingreso y el estado de cobro pendiente', async () => {
    const pantalla = await render(<IncomeDetail />)
    await wait(200)

    expect(await pantalla.findByText('Detalle del ingreso')).toBeTruthy()
    expect(pantalla.getAllByText('Nomina Principal').length).toBeGreaterThan(0)
    expect(pantalla.getByText('$ 1.200,00')).toBeTruthy()
    expect(pantalla.getByText('Dia 5 de cada mes')).toBeTruthy()
    expect(pantalla.getByText('Pendiente de cobro')).toBeTruthy()
    expect(pantalla.getByText('Marcar como recibido')).toBeTruthy()
  })

  it('permite marcar el ingreso como recibido', async () => {
    const pantalla = await render(<IncomeDetail />)
    await wait(200)

    const botonRecibido = await pantalla.findByText('Marcar como recibido')
    fireEvent.press(botonRecibido)
    await wait(100)

    expect(confirmIncomeReceiptMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ingreso-1',
        amount: 1200
      }),
      '2026-08',
      expect.any(String)
    )
  })

  it('permite editar el ingreso desde el modal', async () => {
    updateIncomeMock.mockResolvedValue({
      ...ingresoPrueba,
      name: 'Nomina Actualizada',
      amount: 1200
    })

    const pantalla = await render(<IncomeDetail />)
    await wait(200)

    fireEvent.press(await pantalla.findByText('Editar'))
    await wait(50)

    expect(pantalla.getByText('Editar ingreso')).toBeTruthy()
    fireEvent.changeText(pantalla.getByTestId('income-sheet-name'), 'Nomina Actualizada')
    await wait(50)

    fireEvent.press(pantalla.getByTestId('income-sheet-confirm'))
    await wait(100)

    expect(updateIncomeMock).toHaveBeenCalledWith(
      'ingreso-1',
      expect.objectContaining({ name: 'Nomina Actualizada' })
    )
  })

  it('elimina el ingreso tras confirmar en el dialogo', async () => {
    const pantalla = await render(<IncomeDetail />)
    await wait(200)

    const botonEliminar = await pantalla.findByText('Eliminar')
    fireEvent.press(botonEliminar)
    await wait(60)

    const botonesEliminar = pantalla.getAllByText('Eliminar')
    fireEvent.press(botonesEliminar[botonesEliminar.length - 1])
    await wait(150)

    expect(deleteIncomeMock).toHaveBeenCalledWith('ingreso-1')
    expect(mockBack).toHaveBeenCalled()
  })
})
