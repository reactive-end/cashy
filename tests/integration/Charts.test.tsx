/**
 * Pruebas de integracion de la pestaña de graficas.
 * Verifica el desglose por categoria en barras, el resumen mensual
 * y el estado vacio sin registros.
 */

import { render } from '@testing-library/react-native'

import { getExpenses } from '@src/db/expenses'
import { loadSettings } from '@src/db/settings'
import { getExchangeRates } from '@src/services/rates'

import Charts from '../../app/(tabs)/charts'
import { wait } from '../helpers/wait'
import {
  buildFixedExpense,
  buildRates,
  buildSettings,
  buildUniqueExpense
} from '../helpers/factories'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() })
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

/** Sembrado con categorias de pesos distintos para las barras */
function sembrarConDatos() {
  getExchangeRatesMock.mockResolvedValue(buildRates())
  loadSettingsMock.mockResolvedValue(buildSettings())
  const datos = [
    buildFixedExpense({
      id: 'f-1',
      name: 'Alquiler',
      category: 'Hogar',
      amount: 300,
      currency: 'USD'
    }),
    buildFixedExpense({
      id: 'f-2',
      name: 'Internet',
      category: 'Hogar',
      amount: 50,
      currency: 'USD'
    }),
    buildUniqueExpense({
      id: 'u-1',
      name: 'Taxi',
      category: 'Transporte',
      amount: 10,
      currency: 'USD'
    })
  ]
  getExpensesMock.mockImplementation(async () => datos)
}

describe('pantalla de graficas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('desglosa los gastos por categoria ordenados por peso', async () => {
    sembrarConDatos()

    const pantalla = await render(<Charts />)
    await wait(250)

    expect(await pantalla.findByText('Desglose por categoria')).toBeTruthy()
    expect(pantalla.getByText('Hogar')).toBeTruthy()
    expect(pantalla.getByText('Transporte')).toBeTruthy()

    const hogar = pantalla.getByText('Hogar')
    const transporte = pantalla.getByText('Transporte')
    const indiceHogar = hogar.props.parent?.index ?? 0
    const indiceTransporte = transporte.props.parent?.index ?? 1

    expect(indiceHogar).toBeLessThan(indiceTransporte)
  })

  it('muestra indicadores contables y mayores gastos del mes', async () => {
    sembrarConDatos()

    const pantalla = await render(<Charts />)
    await wait(250)

    expect(await pantalla.findByText('Indicadores del mes')).toBeTruthy()
    expect(pantalla.getByText('Promedio diario (unicos)')).toBeTruthy()
    expect(pantalla.getByText('Mayores gastos unicos')).toBeTruthy()
  })

  it('muestra el resumen del mes junto al desglose', async () => {
    sembrarConDatos()

    const pantalla = await render(<Charts />)
    await wait(250)

    expect(await pantalla.findByText('$ 360,00')).toBeTruthy()
    expect(pantalla.queryByText('Sin datos para graficar')).toBeNull()
  })

  it('muestra el estado vacio cuando no hay gastos registrados', async () => {
    getExchangeRatesMock.mockResolvedValue(buildRates())
    loadSettingsMock.mockResolvedValue(buildSettings())
    getExpensesMock.mockResolvedValue([])

    const pantalla = await render(<Charts />)
    await wait(250)

    expect(await pantalla.findByText('Sin datos para resumir')).toBeTruthy()
    expect(pantalla.queryByText('Desglose por categoria')).toBeNull()
  })
})
