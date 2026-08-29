/**
 * Pruebas de integracion de la pantalla dedicada de Ingresos (app/incomes.tsx).
 * Cubren la visualizacion de las fuentes de ingreso, busqueda, paginacion,
 * confirmacion directa de cobros pendientes y navegacion al detalle.
 */

import { render, userEvent, waitFor } from '@testing-library/react-native'

import IncomesScreen from '../../app/incomes'
import * as receiptsRepo from '@src/db/incomeReceipts'
import * as incomesRepo from '@src/db/incomes'
import * as ratesService from '@src/services/rates'
import { __resetCacheForTests } from '@src/hooks/useSettings'
import { buildIncome, buildRates } from '../helpers/factories'

const mockBack = jest.fn()
const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush })
}))

const getExchangeRatesMock = ratesService.getExchangeRates as jest.Mock
const getIncomesMock = incomesRepo.getIncomes as jest.Mock
const insertIncomeMock = incomesRepo.insertIncome as jest.Mock
const confirmIncomeReceiptMock = receiptsRepo.confirmIncomeReceipt as jest.Mock

jest.mock('@src/services/rates')
jest.mock('@src/db/settings')
jest.mock('@src/db/incomes', () => ({
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

function sembrar() {
  getExchangeRatesMock.mockResolvedValue(buildRates())
  __resetCacheForTests()
}

describe('pantalla de Ingresos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sembrar()
    getIncomesMock.mockReset()
    getIncomesMock.mockResolvedValue([])
  })

  it('muestra el encabezado y las fuentes de ingreso', async () => {
    getIncomesMock.mockResolvedValue([
      buildIncome({ name: 'Salario', amount: 500, paydayDay: 15 }),
      buildIncome({ id: 'i-2', name: 'Freelance', amount: 300, paydayDay: 20 })
    ])
    const pantalla = await render(<IncomesScreen />)

    expect(await pantalla.findByText('Ingresos')).toBeTruthy()
    expect(pantalla.getAllByText('Salario').length).toBeGreaterThan(0)
    expect(pantalla.getAllByText('Freelance').length).toBeGreaterThan(0)
  })

  it('retrocede al pulsar el boton de volver', async () => {
    const pantalla = await render(<IncomesScreen />)
    const usuario = userEvent.setup()

    const botonVolver = await pantalla.findByLabelText('Volver a Finanzas')
    await usuario.press(botonVolver)

    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('muestra el estado vacio accionable sin ingresos', async () => {
    const pantalla = await render(<IncomesScreen />)

    expect(await pantalla.findByText('Sin ingresos todavia')).toBeTruthy()
    expect(pantalla.getAllByText('Agregar ingreso').length).toBeGreaterThan(0)
  })

  it('navega a la pantalla dedicada de nuevo ingreso', async () => {
    const pantalla = await render(<IncomesScreen />)
    const usuario = userEvent.setup()

    const botonAgregar = (await pantalla.findAllByText('Agregar ingreso'))[0]
    await usuario.press(botonAgregar)

    expect(mockPush).toHaveBeenCalledWith('/new-income')
  })

  it('filtra los ingresos mediante la barra de busqueda', async () => {
    getIncomesMock.mockResolvedValue([
      buildIncome({ id: 'i-1', name: 'Nomina Principal', amount: 800 }),
      buildIncome({ id: 'i-2', name: 'Alquiler Cochera', amount: 150 })
    ])

    const pantalla = await render(<IncomesScreen />)
    const usuario = userEvent.setup()

    expect((await pantalla.findAllByText('Nomina Principal')).length).toBeGreaterThan(0)
    expect(pantalla.getAllByText('Alquiler Cochera').length).toBeGreaterThan(0)

    const inputBusqueda = pantalla.getByPlaceholderText('Buscar ingresos...')
    await usuario.type(inputBusqueda, 'Cochera')
    await usuario.press(pantalla.getByLabelText('Buscar'))

    expect(pantalla.queryByText('Nomina Principal')).toBeNull()
    expect(pantalla.getAllByText('Alquiler Cochera').length).toBeGreaterThan(0)
  })

  it('navega al detalle del ingreso al presionar la tarjeta', async () => {
    getIncomesMock.mockResolvedValue([buildIncome({ id: 'i-10', name: 'Bono', amount: 100 })])

    const pantalla = await render(<IncomesScreen />)
    const usuario = userEvent.setup()

    const itemBono = await pantalla.findByTestId('income-item-i-10')
    await usuario.press(itemBono)

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/income/[id]',
      params: { id: 'i-10' }
    })
  })
})
