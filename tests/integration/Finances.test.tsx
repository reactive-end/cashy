/**
 * Pruebas de integracion de la pestana Finanzas.
 * Cubren el segmento Gastos/Ingresos, el panel de ingresos con su
 * resumen y el flujo completo de alta mediante la hoja modal.
 */

import { render, userEvent, waitFor } from '@testing-library/react-native'

import Finances from '../../app/(tabs)/finances'
import * as expensesRepo from '@src/db/expenses'
import * as incomesRepo from '@src/db/incomes'
import * as ratesService from '@src/services/rates'
import { __resetCacheForTests } from '@src/hooks/useSettings'
import { buildFixedExpense, buildIncome, buildRates, buildSettings } from '../helpers/factories'

const getExchangeRatesMock = ratesService.getExchangeRates as jest.Mock
const getExpensesMock = expensesRepo.getExpenses as jest.Mock
const getIncomesMock = incomesRepo.getIncomes as jest.Mock
const insertIncomeMock = incomesRepo.insertIncome as jest.Mock

jest.mock('@src/services/rates')
jest.mock('@src/db/expenses', () => ({
  getExpenses: jest.fn(async () => []),
  updateExpense: jest.fn()
}))
jest.mock('@src/db/settings')
jest.mock('@src/db/incomes', () => ({
  getIncomes: jest.fn(async () => []),
  insertIncome: jest.fn(async () => undefined),
  updateIncome: jest.fn(async () => undefined),
  deleteIncome: jest.fn(async () => undefined)
}))

/** Sembrado comun: tasas vigentes, ajustes y datos base */
function sembrar() {
  getExchangeRatesMock.mockResolvedValue(buildRates())
  __resetCacheForTests()
}

describe('pestana Finanzas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sembrar()
    getIncomesMock.mockReset()
    getIncomesMock.mockResolvedValue([])
  })

  it('muestra por defecto la seccion Gastos intacta', async () => {
    getExpensesMock.mockResolvedValue([buildFixedExpense()])
    const pantalla = await render(<Finances />)

    expect(await pantalla.findByText('Mis gastos')).toBeTruthy()
    expect(pantalla.getByLabelText('Filtrar gastos')).toBeTruthy()
  })

  it('el segmento Ingresos muestra el resumen y las fuentes', async () => {
    getIncomesMock.mockResolvedValue([
      buildIncome({ name: 'Salario', amount: 500 }),
      buildIncome({ id: 'i-2', name: 'Freelance', amount: 300 })
    ])
    const pantalla = await render(<Finances />)
    const usuario = userEvent.setup()

    await usuario.press(await pantalla.findByText('Ingresos'))

    expect(await pantalla.findByText('Ingreso mensual estimado')).toBeTruthy()
    expect(pantalla.getByText('Salario')).toBeTruthy()
    expect(pantalla.getByText('Freelance')).toBeTruthy()
    expect(pantalla.getByText(/2 fuentes/)).toBeTruthy()
    // Sin gastos visibles en esta vista.
    expect(pantalla.queryByText('Mis gastos')).toBeNull()
  })

  it('muestra el estado vacio accionable sin ingresos', async () => {
    const pantalla = await render(<Finances />)
    const usuario = userEvent.setup()

    await usuario.press(await pantalla.findByText('Ingresos'))

    expect(await pantalla.findByText('Sin ingresos todavia')).toBeTruthy()
    expect(pantalla.getAllByText('Agregar ingreso').length).toBeGreaterThan(0)
  })

  it('agrega un ingreso desde la hoja modal y lo lista al cerrarse', async () => {
    getIncomesMock
      .mockResolvedValueOnce([])
      .mockResolvedValue([buildIncome({ id: 'nuevo-1', name: 'Freelance', amount: 300 })])
    insertIncomeMock.mockResolvedValue(undefined)

    const pantalla = await render(<Finances />)
    const usuario = userEvent.setup()

    await usuario.press(await pantalla.findByText('Ingresos'))

    const botonAgregar = await pantalla.findByText('Agregar ingreso')
    await usuario.press(botonAgregar)

    await pantalla.findByTestId('income-sheet-name')
    await usuario.type(pantalla.getByLabelText('Concepto'), 'Freelance')
    await usuario.type(pantalla.getByTestId('income-sheet-amount'), '30000')
    await usuario.type(pantalla.getByLabelText('Dia de cobro (1-31)'), '20')

    const confirmar = pantalla.getByTestId('income-sheet-confirm')
    await waitFor(() => expect(confirmar.props.accessibilityState.disabled).toBe(false))
    await usuario.press(confirmar)

    expect(insertIncomeMock).toHaveBeenCalledWith(
      { name: 'Freelance', amount: 300, currency: 'USD', paydayDay: 20 },
      expect.any(String)
    )
    expect(await pantalla.findByText('Freelance')).toBeTruthy()
  })

  it('impide confirmar la hoja con campos invalidos', async () => {
    const pantalla = await render(<Finances />)
    const usuario = userEvent.setup()

    await usuario.press(await pantalla.findByText('Ingresos'))

    const botonAgregar = await pantalla.findByText('Agregar ingreso')
    await usuario.press(botonAgregar)
    await pantalla.findByTestId('income-sheet-name')

    const confirmar = pantalla.getByTestId('income-sheet-confirm')
    expect(confirmar.props.accessibilityState.disabled).toBe(true)
    expect(insertIncomeMock).not.toHaveBeenCalled()
  })
})
