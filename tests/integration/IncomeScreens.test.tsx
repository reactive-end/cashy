/**
 * Pruebas de integracion de las pantallas dedicadas de ingreso:
 * NewIncome (app/new-income.tsx) y EditIncome (app/edit-income/[id].tsx).
 * Verifica renderizado, cierre con boton de cabecera y boton cancelar,
 * validacion y guardado en SQLite con navegacion de retorno.
 */

import { fireEvent, render, userEvent } from '@testing-library/react-native'

import EditIncome from '../../app/edit-income/[id]'
import NewIncome from '../../app/new-income'
import * as incomesRepo from '@src/db/incomes'
import { loadSettings } from '@src/db/settings'
import { __resetCacheForTests } from '@src/hooks/useSettings'
import { getExchangeRates } from '@src/services/rates'
import { buildIncome, buildRates, buildSettings } from '../helpers/factories'

const mockBack = jest.fn()
const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useLocalSearchParams: () => ({ id: 'ingreso-1' })
}))

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
  getIncomeReceipts: jest.fn(async () => [])
}))

const getExchangeRatesMock = getExchangeRates as jest.Mock
const getIncomeMock = incomesRepo.getIncome as jest.Mock
const insertIncomeMock = incomesRepo.insertIncome as jest.Mock
const updateIncomeMock = incomesRepo.updateIncome as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock

describe('pantalla dedicada NewIncome', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __resetCacheForTests()
    getExchangeRatesMock.mockResolvedValue(buildRates())
    loadSettingsMock.mockResolvedValue(buildSettings())
  })

  it('renderiza la cabecera y permite cerrar con el boton de cierre', async () => {
    const pantalla = await render(<NewIncome />)

    expect(await pantalla.findByText('Nuevo ingreso')).toBeTruthy()
    fireEvent.press(pantalla.getByLabelText('Cerrar'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('permite cancelar el registro con el boton Cancelar', async () => {
    const pantalla = await render(<NewIncome />)

    expect(await pantalla.findByText('Nuevo ingreso')).toBeTruthy()
    fireEvent.press(pantalla.getByText('Cancelar'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('valida campos y registra el ingreso al presionar Guardar ingreso', async () => {
    insertIncomeMock.mockResolvedValue(buildIncome({ id: 'nuevo-1', name: 'Honorarios' }))
    const pantalla = await render(<NewIncome />)
    const user = userEvent.setup()

    await user.type(await pantalla.findByTestId('income-name'), 'Honorarios')
    await user.type(pantalla.getByTestId('income-amount'), '25000')
    await user.type(pantalla.getByTestId('income-day'), '15')

    const botonGuardar = pantalla.getByTestId('income-confirm')
    expect(botonGuardar.props.accessibilityState.disabled).toBe(false)
    await user.press(botonGuardar)

    expect(insertIncomeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Honorarios',
        amount: 250,
        currency: 'USD',
        paydayDay: 15
      }),
      expect.any(String)
    )
    expect(mockBack).toHaveBeenCalled()
  })
})

describe('pantalla dedicada EditIncome', () => {
  const ingresoPrueba = buildIncome({
    id: 'ingreso-1',
    name: 'Sueldo actual',
    amount: 1500,
    currency: 'USD',
    paydayDay: 1
  })

  beforeEach(() => {
    jest.clearAllMocks()
    __resetCacheForTests()
    getExchangeRatesMock.mockResolvedValue(buildRates())
    loadSettingsMock.mockResolvedValue(buildSettings())
    getIncomeMock.mockResolvedValue(ingresoPrueba)
  })

  it('precarga datos y permite cerrar', async () => {
    const pantalla = await render(<EditIncome />)

    expect(await pantalla.findByText('Editar ingreso')).toBeTruthy()
    fireEvent.press(pantalla.getByLabelText('Cerrar'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('guarda las modificaciones del ingreso al presionar Guardar cambios', async () => {
    updateIncomeMock.mockResolvedValue({ ...ingresoPrueba, name: 'Sueldo aumentado' })
    const pantalla = await render(<EditIncome />)
    const user = userEvent.setup()

    expect(await pantalla.findByText('Editar ingreso')).toBeTruthy()
    expect(await pantalla.findByTestId('income-name')).toBeTruthy()

    await user.clear(pantalla.getByTestId('income-name'))
    await user.type(pantalla.getByTestId('income-name'), 'Sueldo aumentado')

    await user.press(pantalla.getByTestId('income-confirm'))

    expect(updateIncomeMock).toHaveBeenCalledWith(
      'ingreso-1',
      expect.objectContaining({
        name: 'Sueldo aumentado'
      })
    )
    expect(mockBack).toHaveBeenCalled()
  })
})
