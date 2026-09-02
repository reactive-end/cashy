/**
 * Pruebas de integracion de la pantalla de detalle de gasto.
 * Verifica la vista de solo lectura, la navegacion a edicion y el
 * flujo de borrado con confirmacion.
 */

import { fireEvent, render } from '@testing-library/react-native'

import { deleteExpense, getExpense, getExpenses } from '@src/db/expenses'
import { loadSettings } from '@src/db/settings'
import { getExchangeRates } from '@src/services/rates'
import type { Expense } from '@src/types/domain'

import ExpenseDetail from '../../app/expense/[id]'
import { wait } from '../helpers/wait'
import { buildFixedExpense, buildRates, buildSettings } from '../helpers/factories'

const mockBack = jest.fn()
const mockPush = jest.fn()

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react')

  return {
    Stack: { Screen: () => null },
    useRouter: () => ({ back: mockBack, push: mockPush }),
    useLocalSearchParams: () => ({ id: 'fijo-1' }),
    useFocusEffect: (callback: () => void) => {
      useEffect(callback, [callback])
    }
  }
})

jest.mock('@src/services/rates')
jest.mock('@src/db/expenses')
jest.mock('@src/db/settings')
jest.mock('@src/db/expenseReceipts', () => ({
  getExpenseReceipts: jest.fn(async () => []),
  getExpenseReceiptsByExpense: jest.fn(async () => []),
  deleteExpenseReceipt: jest.fn(async () => undefined)
}))
jest.mock('@src/db/incomeReceipts', () => ({
  formatYearMonth: jest.fn(() => '2026-08'),
  getIncomeReceipts: jest.fn(async () => [])
}))

const getExchangeRatesMock = getExchangeRates as jest.Mock
const getExpenseMock = getExpense as jest.Mock
const getExpensesMock = getExpenses as jest.Mock
const deleteExpenseMock = deleteExpense as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock

/** Sembrado estandar para el detalle */
function sembrar(gasto: Expense) {
  getExchangeRatesMock.mockResolvedValue(buildRates())
  loadSettingsMock.mockResolvedValue(buildSettings())
  getExpenseMock.mockResolvedValue(gasto)
  getExpensesMock.mockResolvedValue([gasto])
  deleteExpenseMock.mockResolvedValue(undefined)
}

describe('pantalla de detalle del gasto', () => {
  const gastoFijo = buildFixedExpense({
    id: 'fijo-1',
    name: 'Alquiler',
    amount: 300,
    category: 'Hogar',
    note: 'Apartamento centro'
  })

  beforeEach(() => {
    jest.clearAllMocks()
    sembrar(gastoFijo)
  })

  it('muestra los datos del gasto en modo solo lectura', async () => {
    const pantalla = await render(<ExpenseDetail />)
    await wait(200)

    expect(await pantalla.findByText('Alquiler')).toBeTruthy()
    expect(pantalla.getByText('Detalle del gasto')).toBeTruthy()
    expect(pantalla.getByText('$ 300,00')).toBeTruthy()
    expect(pantalla.getByText('Gasto fijo')).toBeTruthy()
    expect(pantalla.getByText('Hogar')).toBeTruthy()
    expect(pantalla.getByText('Apartamento centro')).toBeTruthy()
  })

  it('navega a la pantalla de edicion con el boton Editar', async () => {
    const pantalla = await render(<ExpenseDetail />)
    await wait(200)

    await pantalla.findByText('Editar')
    fireEvent.press(pantalla.getByText('Editar'))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/edit-expense/[id]',
      params: { id: 'fijo-1' }
    })
  })

  it('elimina el gasto tras confirmar en el dialogo', async () => {
    const pantalla = await render(<ExpenseDetail />)
    await wait(200)

    await pantalla.findByText('Eliminar')
    fireEvent.press(pantalla.getByText('Eliminar'))
    await wait(60)

    const botonesEliminar = pantalla.getAllByText('Eliminar')
    fireEvent.press(botonesEliminar[botonesEliminar.length - 1])
    await wait(150)

    expect(deleteExpenseMock).toHaveBeenCalledWith('fijo-1')
    expect(mockBack).toHaveBeenCalled()
  })

  it('muestra la seccion de historial de pagos en gastos fijos', async () => {
    const pantalla = await render(<ExpenseDetail />)
    await wait(200)

    expect(await pantalla.findByText('Historial de pagos')).toBeTruthy()
    expect(pantalla.getByText('Aun no hay pagos registrados para este gasto.')).toBeTruthy()
  })

  it('muestra el boton Marcar como pagado cuando el gasto fijo no esta pagado este mes', async () => {
    const pantalla = await render(<ExpenseDetail />)
    await wait(200)

    expect(await pantalla.findByText('Marcar como pagado')).toBeTruthy()
  })
})
