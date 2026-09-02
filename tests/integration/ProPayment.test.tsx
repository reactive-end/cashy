/**
 * Pruebas de integracion para la subpantalla de Pago Movil PRO.
 * Verifica la presentacion de datos del Banco BNC, precios mensuales,
 * la existencia del QR y los botones de copiado rapido.
 */

import { render, screen } from '@testing-library/react-native'

import ProPaymentSettings from '../../app/settings/pro-payment'

// Mock de expo-clipboard y react-native-qrcode-svg
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true)
}))

jest.mock('react-native-qrcode-svg', () => {
  const { View } = require('react-native')
  return function MockQRCode() {
    return <View testID="mock-qr-code" />
  }
})

describe('ProPaymentSettings', () => {
  it('renderiza correctamente el titulo, monto mensual y datos del Banco BNC', async () => {
    await render(<ProPaymentSettings />)

    expect(screen.getByText('Adquirir Cashy PRO')).toBeDefined()
    expect(screen.getByText('$2.00 USD / mes')).toBeDefined()
    expect(screen.getByText('0191 - BNC (Banco Nacional de Crédito)')).toBeDefined()
    expect(screen.getByText('V-28502328')).toBeDefined()
    expect(screen.getByText('0424-7413675')).toBeDefined()
    expect(screen.getByText('PISANI ALARCON RAFAEL ENRIQUE')).toBeDefined()
  })

  it('renderiza la advertencia de monto exacto y el codigo QR dinamico', async () => {
    await render(<ProPaymentSettings />)

    expect(screen.getByText('Monto exacto requerido')).toBeDefined()
    expect(screen.getByTestId('mock-qr-code')).toBeDefined()
  })

  it('renderiza el boton de copiado multilinea de un solo toque', async () => {
    await render(<ProPaymentSettings />)

    expect(screen.getByText('Copiar datos rápidos (0191 / Cédula / Teléfono)')).toBeDefined()
  })
})
