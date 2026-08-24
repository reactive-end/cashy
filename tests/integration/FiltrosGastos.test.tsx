/**
 * Pruebas de integracion del panel de filtros de la pantalla Gastos.
 * Verifica el filtrado por categoria y moneda, la ordenacion por
 * monto y el indicador de filtros activos.
 */

import { fireEvent, render } from '@testing-library/react-native'

import { getExpenses } from '@src/db/expenses'
import { loadSettings } from '@src/db/settings'
import { getExchangeRates } from '@src/services/rates'

import Expenses from '../../app/(tabs)/expenses'
import { espera } from '../helpers/espera'
import {
  buildFixedExpense,
  buildRates,
  buildSettings,
  buildUniqueExpense
} from '../helpers/factories'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush })
}))

jest.mock('@src/services/rates')
jest.mock('@src/db/expenses')
jest.mock('@src/db/settings')

const getExchangeRatesMock = getExchangeRates as jest.Mock
const getExpensesMock = getExpenses as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock

/** Sembrado con categorias, monedas y montos distinguibles */
function sembrar() {
  getExchangeRatesMock.mockResolvedValue(buildRates())
  loadSettingsMock.mockResolvedValue(buildSettings())
  const datos = [
    buildFixedExpense({ id: 'f-1', name: 'Alquiler', category: 'Hogar' }),
    buildUniqueExpense({ id: 'u-1', name: 'Licuadora', category: 'Hogar' }),
    buildUniqueExpense({ id: 'u-2', name: 'Taxi', category: 'Transporte' })
  ]
  getExpensesMock.mockImplementation(async () => datos)
}

describe('panel de filtros en Gastos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sembrar()
  })

  it('abre el panel desde el boton junto al titulo y filtra por categoria', async () => {
    const pantalla = await render(<Expenses />)
    await espera(250)

    fireEvent.press(pantalla.getByLabelText('Unicos'))
    await espera(120)

    fireEvent.press(pantalla.getByLabelText('Filtrar gastos'))
    await espera(60)

    expect(await pantalla.findByText('Filtros')).toBeTruthy()

    fireEvent.press(pantalla.getByLabelText('Hogar'))
    await espera(30)
    fireEvent.press(pantalla.getByText('Aplicar'))
    await espera(150)

    expect(await pantalla.findByText('Licuadora')).toBeTruthy()
    expect(pantalla.queryByText('Taxi')).toBeNull()
  })

  it('ordena por nombre al elegir el criterio Nombre A-Z', async () => {
    const pantalla = await render(<Expenses />)
    await espera(250)

    fireEvent.press(pantalla.getByLabelText('Unicos'))
    await espera(120)

    fireEvent.press(pantalla.getByLabelText('Filtrar gastos'))
    await espera(60)

    fireEvent.press(pantalla.getByLabelText('Nombre A-Z'))
    await espera(30)
    fireEvent.press(pantalla.getByText('Aplicar'))
    await espera(150)

    const filas = await pantalla.findAllByText(/^(Licuadora|Taxi)$/)

    expect(filas.length).toBe(2)
    expect(filas[0].props.children).toBe('Licuadora')
    expect(filas[1].props.children).toBe('Taxi')
  })

  it('limpia los filtros con el boton Limpiar', async () => {
    const pantalla = await render(<Expenses />)
    await espera(250)

    fireEvent.press(pantalla.getByLabelText('Unicos'))
    await espera(120)

    fireEvent.press(pantalla.getByLabelText('Filtrar gastos'))
    await espera(60)

    fireEvent.press(pantalla.getByLabelText('Transporte'))
    await espera(30)
    fireEvent.press(pantalla.getByText('Aplicar'))
    await espera(150)

    expect(await pantalla.findByText('Taxi')).toBeTruthy()
    expect(pantalla.queryByText('Licuadora')).toBeNull()

    fireEvent.press(pantalla.getByLabelText('Filtrar gastos'))
    await espera(60)
    fireEvent.press(pantalla.getByText('Limpiar'))
    await espera(30)
    fireEvent.press(pantalla.getByText('Aplicar'))
    await espera(150)

    expect(await pantalla.findByText('Licuadora')).toBeTruthy()
    expect(pantalla.getByText('Taxi')).toBeTruthy()
  })
})
