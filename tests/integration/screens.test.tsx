/**
 * Pruebas de integracion de las tres pantallas principales.
 * Los servicios, la base de datos y el router llegan mockeados;
 * los hooks reales ejecutan su logica completa.
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native'

import { getExpenses } from '@src/db/expenses'
import { loadSettings, saveSettings } from '@src/db/settings'
import { __reiniciarCacheParaPruebas } from '@src/hooks/useSettings'
import { getExchangeRates } from '@src/services/rates'

import Expenses from '../../app/(tabs)/expenses'
import Home from '../../app/(tabs)/index'
import Settings from '../../app/(tabs)/settings'
import { wait } from '../helpers/wait'
import {
  buildFixedExpense,
  buildRates,
  buildSettings,
  buildUniqueExpense,
  isoEnDias
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
const saveSettingsMock = saveSettings as jest.Mock

/** Sembrado estandar para las pantallas */
function sembrar() {
  getExchangeRatesMock.mockResolvedValue(buildRates())
  loadSettingsMock.mockResolvedValue(buildSettings())
  const datos = [
    buildFixedExpense({
      id: 'fijo-1',
      name: 'Alquiler',
      amount: 300,
      nextDueDate: isoEnDias(1)
    }),
    buildUniqueExpense({ id: 'unico-1', name: 'Licuadora', amount: 250000 })
  ]
  getExpensesMock.mockImplementation(async () => datos)
}

describe('pantalla Inicio', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sembrar()
  })

  it('muestra saludo, tasas del dia y resumen convertido a la base', async () => {
    const { getByText } = await render(<Home />)

    await waitFor(() => expect(getByText('Tu panorama de hoy')).toBeTruthy())

    expect(getByText('Bs. 779,95')).toBeTruthy()
    expect(getByText('Bs. 912,01')).toBeTruthy()
  })

  it('muestra el saludo segun la hora del dispositivo', async () => {
    const { getByText } = await render(<Home />)
    await waitFor(() => expect(getByText('Tu panorama de hoy')).toBeTruthy())

    expect(
      ['Buenos dias', 'Buenas tardes', 'Buenas noches'].some((saludo) => {
        try {
          getByText(saludo)
          return true
        } catch {
          return false
        }
      })
    ).toBe(true)
  })

  it('lista pagos proximos dentro del horizonte semanal', async () => {
    const { getByText } = await render(<Home />)

    await waitFor(() => expect(getByText('Alquiler')).toBeTruthy())
    expect(getByText('Próximos pagos')).toBeTruthy()
  })
})

describe('pantalla Gastos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sembrar()
  })

  it('alterna entre fijos y unicos segun el segmento', async () => {
    const pantalla = await render(<Expenses />)
    await wait(250)

    expect(await pantalla.findByText('Alquiler')).toBeTruthy()

    fireEvent.press(pantalla.getByText('Unicos'))
    await wait(150)

    expect(await pantalla.findByText('Licuadora')).toBeTruthy()
    expect(pantalla.queryByText('Alquiler')).toBeNull()
  })

  it('ofrece crear el primer gasto cuando la lista esta vacia', async () => {
    getExpensesMock.mockResolvedValue([])
    const { getByText } = await render(<Expenses />)

    await waitFor(() => expect(getByText(/Sin gastos fijos todavia/)).toBeTruthy())

    fireEvent.press(getByText('Registrar gasto'))

    expect(mockPush).toHaveBeenCalledWith('/new-expense')
  })
})

describe('pantalla Ajustes', () => {
  beforeEach(() => {
    __reiniciarCacheParaPruebas()
    jest.clearAllMocks()
    getExchangeRatesMock.mockResolvedValue(buildRates())
    loadSettingsMock.mockResolvedValue(buildSettings())
    saveSettingsMock.mockResolvedValue(undefined)
  })

  it('cambia y persiste la moneda base del usuario', async () => {
    const { getByText } = await render(<Settings />)

    await waitFor(() => expect(loadSettingsMock).toHaveBeenCalledTimes(1))

    fireEvent.press(getByText('VES'))

    await waitFor(() =>
      expect(saveSettingsMock).toHaveBeenCalledWith(
        expect.objectContaining({ baseCurrency: 'VES' })
      )
    )
  })

  it('mantiene el aviso de privacidad local sin exponer fuentes tecnicas', async () => {
    const { getByText, queryByText } = await render(<Settings />)

    expect(getByText(/Tus datos viven solo en este dispositivo/)).toBeTruthy()
    expect(queryByText(/dolarapi/)).toBeNull()
    expect(queryByText(/criptoya/)).toBeNull()
  })
})

describe('pantalla Gastos con paginacion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sembrar()
  })

  it('pagina los unicos de ocho en ocho y reinicia al cambiar segmento', async () => {
    const fijos = [buildFixedExpense({ id: 'fijo-0', name: 'Alquiler', nextDueDate: isoEnDias(1) })]
    const muchos = Array.from({ length: 12 }, (_, i) =>
      buildUniqueExpense({ id: `unico-${i}`, name: `Gasto ${i}` })
    )
    getExpensesMock.mockResolvedValue([...fijos, ...muchos])

    const pantalla = await render(<Expenses />)
    await wait(250)

    // Segmento Fijos: solo 2 filas, paginador visible con botones deshabilitados.
    expect(await pantalla.findByText(/Página 1 de 1/)).toBeTruthy()
    expect(pantalla.getByText('Anterior')).toBeDisabled()
    expect(pantalla.getByText('Siguiente')).toBeDisabled()

    fireEvent.press(pantalla.getByText('Unicos'))
    await wait(250)

    expect(await pantalla.findByText('Gasto 0')).toBeTruthy()
    expect(await pantalla.findByText(/Página 1 de 2/)).toBeTruthy()
    expect(pantalla.queryByText('Gasto 11')).toBeNull()

    fireEvent.press(pantalla.getByText('Siguiente'))

    expect(await pantalla.findByText('Gasto 11')).toBeTruthy()

    fireEvent.press(pantalla.getByText('Fijos'))
    await wait(150)

    expect(pantalla.getByText('Alquiler')).toBeTruthy()
  })
})
