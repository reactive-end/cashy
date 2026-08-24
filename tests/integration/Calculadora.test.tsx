/**
 * Pruebas de integracion de la pestaña Calculadora.
 * Verifica la equivalencia de un monto con el resto de las divisas
 * gestionadas y el cambio de moneda de origen.
 */

import { fireEvent, render } from '@testing-library/react-native'

import { loadSettings } from '@src/db/settings'
import { getExchangeRates } from '@src/services/rates'

import Calculator from '../../app/(tabs)/calculator'
import { wait } from '../helpers/wait'
import { buildRates, buildSettings } from '../helpers/factories'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() })
}))

jest.mock('@src/services/rates')
jest.mock('@src/db/settings')

const getExchangeRatesMock = getExchangeRates as jest.Mock
const loadSettingsMock = loadSettings as jest.Mock

describe('pantalla Calculadora', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getExchangeRatesMock.mockResolvedValue(buildRates())
    loadSettingsMock.mockResolvedValue(buildSettings())
  })

  it('muestra la equivalencia de 50 dolares en las otras tres divisas', async () => {
    const pantalla = await render(<Calculator />)
    await wait(200)

    await pantalla.findByText('Monto a convertir')

    // El campo nace prerellenado con 0.00 guiando la captura cents-first
    expect(pantalla.getByTestId('input-monto').props.value).toBe('0.00')

    // 5000 digitados empujan desde los decimales hasta 50.00
    fireEvent.changeText(pantalla.getByTestId('input-monto'), '5000')
    await wait(60)

    expect(await pantalla.findByText('$ 50,00')).toBeTruthy()
    expect(pantalla.getByText('Bs. 38.997,50')).toBeTruthy()
    expect(pantalla.getByText('€ 42,80')).toBeTruthy()
    expect(pantalla.getByText('USDT 42,76')).toBeTruthy()
  })

  it('convierte desde bolivares al cambiar la moneda de origen', async () => {
    const pantalla = await render(<Calculator />)
    await wait(200)

    await pantalla.findByText('Monto a convertir')

    fireEvent.press(pantalla.getByLabelText('Bs.'))
    await wait(60)
    // Captura cents-first: 779950 digitados = 7.799,50
    fireEvent.changeText(pantalla.getByTestId('input-monto'), '779950')
    await wait(60)

    expect(await pantalla.findByText('Bs. 7.799,50')).toBeTruthy()
    expect(pantalla.getByText('$ 10,00')).toBeTruthy()
    expect(pantalla.getByText('€ 8,56')).toBeTruthy()
    expect(pantalla.getByText('USDT 8,55')).toBeTruthy()
  })

  it('permite corregir solo los decimales con el separador', async () => {
    const pantalla = await render(<Calculator />)
    await wait(200)

    await pantalla.findByText('Monto a convertir')
    const campo = pantalla.getByTestId('input-monto')

    // Tecleo progresivo real: cada tecla parte del texto vigente
    const teclear = async (teclas: string) => {
      for (const tecla of teclas.split('')) {
        const actual = campo.props.value as string

        fireEvent.changeText(campo, actual + tecla)
        await wait(15)
      }
    }

    await teclear('1000')

    expect(await pantalla.findByText('$ 10,00')).toBeTruthy()

    // El punto abre la edicion de decimales sin alterar el entero
    await teclear('.')

    expect(await pantalla.findByText('$ 10,00')).toBeTruthy()

    // "3" llena los centavos y "6" desplaza a los decimos: 10.36
    await teclear('3')

    expect(await pantalla.findByText('$ 10,03')).toBeTruthy()

    await teclear('6')

    expect(await pantalla.findByText('$ 10,36')).toBeTruthy()
    expect((campo.props.value as string).endsWith('.36')).toBe(true)
  })

  it('limpia el campo con el boton X y reinicia las conversiones', async () => {
    const pantalla = await render(<Calculator />)
    await wait(200)

    await pantalla.findByText('Monto a convertir')

    fireEvent.changeText(pantalla.getByTestId('input-monto'), '5000')
    await wait(60)

    expect(await pantalla.findByText('$ 50,00')).toBeTruthy()

    fireEvent.press(pantalla.getByLabelText('Limpiar monto'))
    await wait(60)

    expect(await pantalla.findByText('$ 0,00')).toBeTruthy()
    expect(pantalla.getByTestId('input-monto').props.value as string).toBe('0.00')
    expect(pantalla.queryByLabelText('Limpiar monto')).toBeNull()
  })

  it('muestra aviso de carga mientras las tasas no estan disponibles', async () => {
    getExchangeRatesMock.mockReturnValue(new Promise(() => undefined))

    const pantalla = await render(<Calculator />)
    await wait(120)

    expect(await pantalla.findByText('Cargando tasas del dia...')).toBeTruthy()
    expect(pantalla.queryByText('Bolivares')).toBeNull()
  })
})
