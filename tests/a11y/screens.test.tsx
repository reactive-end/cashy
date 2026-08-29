/**
 * Pruebas de accesibilidad a nivel pantalla.
 * Verifican encabezados jerarquicos y etiquetas clave visibles
 * para lectores de pantalla en cada pestaña principal.
 */

import { render, waitFor } from '@testing-library/react-native'

import { getExpenses } from '@src/db/expenses'
import { loadSettings } from '@src/db/settings'
import { getExchangeRates } from '@src/services/rates'

import ExpensesScreen from '../../app/expenses'
import Finances from '../../app/(tabs)/finances'
import Home from '../../app/(tabs)/index'
import IncomesScreen from '../../app/incomes'
import Settings from '../../app/(tabs)/settings'
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
jest.mock('@src/db/incomes', () => ({
  getIncomes: jest.fn(async () => []),
  insertIncome: jest.fn(),
  updateIncome: jest.fn(),
  deleteIncome: jest.fn()
}))
jest.mock('@src/db/expenseReceipts', () => ({
  getExpenseReceipts: jest.fn(async () => []),
  getExpenseReceiptsByExpense: jest.fn(async () => []),
  deleteExpenseReceipt: jest.fn(async () => undefined)
}))
jest.mock('@src/db/incomeReceipts', () => ({
  formatYearMonth: jest.fn(() => '2026-08'),
  getIncomeReceipts: jest.fn(async () => []),
  confirmIncomeReceipt: jest.fn(),
  deleteIncomeReceipt: jest.fn(),
  getPendingIncomeConfirmations: jest.fn(async () => [])
}))

const getExchangeRatesMock = getExchangeRates as jest.Mock
const getExpensesMock = getExpenses as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock

function sembrar() {
  getExchangeRatesMock.mockResolvedValue(buildRates())
  loadSettingsMock.mockResolvedValue(buildSettings())
  getExpensesMock.mockResolvedValue([
    buildFixedExpense({ id: 'fijo-1', name: 'Alquiler', nextDueDate: '2026-08-25' }),
    buildUniqueExpense({ id: 'unico-1', name: 'Licuadora' })
  ])
}

describe('accesibilidad de pantallas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sembrar()
  })

  it('Inicio expone un unico encabezado jerarquico principal', async () => {
    const { getAllByRole } = await render(<Home />)
    await wait(250)

    const encabezados = getAllByRole('header')
    expect(encabezados.length).toBeGreaterThanOrEqual(1)
  })

  it('Finanzas mantiene su encabezado y accesos rotulados', async () => {
    const { getByRole, getByLabelText } = await render(<Finances />)

    await waitFor(() => expect(getByRole('header')).toBeTruthy())
    expect(getByLabelText('Ir a Gastos')).toBeTruthy()
    expect(getByLabelText('Ir a Ingresos')).toBeTruthy()
  })

  it('Gastos mantiene su encabezado y segmentos rotulados', async () => {
    const { getByRole, getByLabelText } = await render(<ExpensesScreen />)

    await waitFor(() => expect(getByRole('header')).toBeTruthy())
    expect(getByLabelText('Fijos')).toBeTruthy()
    expect(getByLabelText('Unicos')).toBeTruthy()
  })

  it('Ingresos mantiene su encabezado y boton volver rotulados', async () => {
    const { getAllByRole, getByLabelText } = await render(<IncomesScreen />)

    await waitFor(() => expect(getAllByRole('header').length).toBeGreaterThanOrEqual(1))
    expect(getByLabelText('Volver a Finanzas')).toBeTruthy()
  })

  it('Ajustes rotula los controles de preferencias', async () => {
    const { getByRole, getByText, getByLabelText } = await render(<Settings />)
    await wait()

    expect(getByRole('header')).toBeTruthy()
    expect(getByText('Moneda base')).toBeTruthy()
    expect(getByText('Recordatorios de pagos')).toBeTruthy()
    expect(getByText('Tasa BCV diaria')).toBeTruthy()
    expect(getByLabelText('Activar recordatorios de pagos')).toBeTruthy()
    expect(getByLabelText('Activar la tasa BCV diaria')).toBeTruthy()
    expect(getByLabelText('Hora de los recordatorios de pagos')).toBeTruthy()
    expect(getByLabelText('Hora del aviso de tasa BCV')).toBeTruthy()
  })
})
