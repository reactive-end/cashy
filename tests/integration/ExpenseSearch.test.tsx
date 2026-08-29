/**
 * Pruebas de integracion de la barra de busqueda de la pantalla Gastos.
 * Verifica el filtro por nombre y categoria, la accion de crear y que
 * la paginacion permanezca visible con una sola pagina.
 */

import { fireEvent, render } from '@testing-library/react-native'

import ExpensesScreen from '../../app/expenses'
import { getExpenses } from '@src/db/expenses'
import { loadSettings } from '@src/db/settings'
import { getExchangeRates } from '@src/services/rates'
import { wait } from '../helpers/wait'
import {
  buildFixedExpense,
  buildRates,
  buildSettings,
  buildUniqueExpense
} from '../helpers/factories'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() })
}))

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
const getExpensesMock = getExpenses as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock

/** Sembrado de gastos fijos y unicos con nombres y categorias distinguibles */
function sembrar() {
  getExchangeRatesMock.mockResolvedValue(buildRates())
  loadSettingsMock.mockResolvedValue(buildSettings())
  const datos = [
    buildFixedExpense({ id: 'f-1', name: 'Alquiler', category: 'Hogar' }),
    buildFixedExpense({ id: 'f-2', name: 'Internet', category: 'Servicios' }),
    buildUniqueExpense({ id: 'u-1', name: 'Licuadora', category: 'Hogar' }),
    buildUniqueExpense({ id: 'u-2', name: 'Antojo de empanadas', category: 'Comida' }),
    buildUniqueExpense({ id: 'u-3', name: 'Cargador usb', category: 'Tecnologia' })
  ]
  getExpensesMock.mockImplementation(async () => datos)
}

describe('barra de busqueda en Gastos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sembrar()
  })

  it('filtra por nombre al pulsar el boton Buscar', async () => {
    const pantalla = await render(<ExpensesScreen />)
    await wait(250)

    fireEvent.press(pantalla.getByText('Unicos'))
    await wait(120)

    fireEvent.changeText(pantalla.getByPlaceholderText('Buscar gastos...'), 'antojo')
    await wait(30)
    fireEvent.press(pantalla.getByLabelText('Buscar'))
    await wait(120)

    expect(await pantalla.findByText('Antojo de empanadas')).toBeTruthy()
    expect(pantalla.queryByText('Licuadora')).toBeNull()
    expect(pantalla.queryByText('Cargador usb')).toBeNull()
  })

  it('filtra por categoria ademas del nombre', async () => {
    const pantalla = await render(<ExpensesScreen />)
    await wait(250)

    fireEvent.press(pantalla.getByText('Unicos'))
    await wait(120)

    fireEvent.changeText(pantalla.getByPlaceholderText('Buscar gastos...'), 'hogar')
    await wait(30)
    fireEvent.press(pantalla.getByLabelText('Buscar'))
    await wait(120)

    expect(await pantalla.findByText('Licuadora')).toBeTruthy()
    expect(pantalla.queryByText('Cargador usb')).toBeNull()
  })

  it('muestra estado vacio cuando la busqueda no arroja resultados', async () => {
    const pantalla = await render(<ExpensesScreen />)
    await wait(250)

    fireEvent.changeText(pantalla.getByPlaceholderText('Buscar gastos...'), 'zeppelin')
    await wait(30)
    fireEvent.press(pantalla.getByLabelText('Buscar'))
    await wait(120)

    expect(await pantalla.findByText('Sin resultados')).toBeTruthy()
  })

  it('navega a nuevo gasto desde el boton de icono agregar', async () => {
    const pantalla = await render(<ExpensesScreen />)
    await wait(250)

    fireEvent.press(pantalla.getByLabelText('Agregar gasto'))

    expect(mockPush).toHaveBeenCalledWith('/new-expense')
  })

  it('mantiene la paginacion visible con una sola pagina y botones deshabilitados', async () => {
    const pantalla = await render(<ExpensesScreen />)
    await wait(250)

    expect(await pantalla.findByText(/Página 1 de 1/)).toBeTruthy()
    expect(pantalla.getByText('Anterior')).toBeDisabled()
    expect(pantalla.getByText('Siguiente')).toBeDisabled()
  })
})
