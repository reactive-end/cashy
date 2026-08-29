/**
 * Pruebas unitarias del modulo de biometria y autenticacion local.
 */

import * as LocalAuthentication from 'expo-local-authentication'

import { authenticateWithBiometrics, isBiometricsAvailable } from '@src/lib/biometrics'

const hasHardwareMock = LocalAuthentication.hasHardwareAsync as jest.Mock
const isEnrolledMock = LocalAuthentication.isEnrolledAsync as jest.Mock
const authenticateMock = LocalAuthentication.authenticateAsync as jest.Mock

describe('isBiometricsAvailable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('devuelve false cuando el dispositivo no tiene hardware compatible', async () => {
    hasHardwareMock.mockResolvedValueOnce(false)

    const disponible = await isBiometricsAvailable()
    expect(disponible).toBe(false)
    expect(isEnrolledMock).not.toHaveBeenCalled()
  })

  it('devuelve false cuando hay hardware pero no hay biometria enrolada', async () => {
    hasHardwareMock.mockResolvedValueOnce(true)
    isEnrolledMock.mockResolvedValueOnce(false)

    const disponible = await isBiometricsAvailable()
    expect(disponible).toBe(false)
  })

  it('devuelve true cuando hay hardware y registros enrolados', async () => {
    hasHardwareMock.mockResolvedValueOnce(true)
    isEnrolledMock.mockResolvedValueOnce(true)

    const disponible = await isBiometricsAvailable()
    expect(disponible).toBe(true)
  })

  it('devuelve false ante cualquier excepcion inesperada', async () => {
    hasHardwareMock.mockRejectedValueOnce(new Error('Fallo del subsistema'))

    const disponible = await isBiometricsAvailable()
    expect(disponible).toBe(false)
  })
})

describe('authenticateWithBiometrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('devuelve true cuando el usuario se autentica con exito', async () => {
    authenticateMock.mockResolvedValueOnce({ success: true })

    const ok = await authenticateWithBiometrics()
    expect(ok).toBe(true)
    expect(authenticateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        promptMessage: expect.any(String),
        disableDeviceFallback: false
      })
    )
  })

  it('devuelve false cuando el usuario cancela o falla la autenticacion', async () => {
    authenticateMock.mockResolvedValueOnce({ success: false })

    const ok = await authenticateWithBiometrics()
    expect(ok).toBe(false)
  })

  it('devuelve false ante cualquier excepcion en la llamada nativa', async () => {
    authenticateMock.mockRejectedValueOnce(new Error('Dialogo cancelado'))

    const ok = await authenticateWithBiometrics()
    expect(ok).toBe(false)
  })
})
