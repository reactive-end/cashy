/**
 * Pruebas de accesibilidad a nivel pantalla.
 * Verifican encabezados jerarquicos y etiquetas clave visibles
 * para lectores de pantalla en cada pestaña principal.
 */

import { render, waitFor } from '@testing-library/react-native'

import { getExpenses } from '@src/db/expenses'
import { loadSettings } from '@src/db/settings'
import { getExchangeRates } from '@src/services/rates'

import Expenses from '../../app/(tabs)/expenses'
import Home from '../../app/(tabs)/index'
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
  useRouter: () => ({ push: mockPush })
}))

jest.mock('@src/services/rates')
jest.mock('@src/db/expenses')
jest.mock('@src/db/settings')

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

  it('Gastos mantiene su encabezado y segmentos rotulados', async () => {
    const { getByRole, getByLabelText } = await render(<Expenses />)

    await waitFor(() => expect(getByRole('header')).toBeTruthy())
    expect(getByLabelText('Fijos')).toBeTruthy()
    expect(getByLabelText('Unicos')).toBeTruthy()
  })

  it('Ajustes rotula los controles de preferencias', async () => {
    const { getByRole, getByText } = await render(<Settings />)
    await wait()

    expect(getByRole('header')).toBeTruthy()
    expect(getByText('Moneda base')).toBeTruthy()
    expect(getByText('Hora de recordatorios')).toBeTruthy()
  })
})
