/**
 * Pruebas unitarias para el puente nativo de notificaciones bancarias.
 */

import * as nativeModule from '@modules/bank-notification-listener'
import {
  clearBankNotifications,
  drainNativeBankNotifications,
  getPendingBankNotifications,
  hasBankNotificationPermission,
  isBankNotificationListenerSupported,
  requestBankNotificationPermission,
  simulateBankNotification,
  subscribeToNativeBankNotifications
} from '@src/lib/bankNotifications'

jest.mock('@modules/bank-notification-listener', () => ({
  isNotificationListenerAvailable: jest.fn(() => true),
  isNotificationListenerPermissionGranted: jest.fn(() => true),
  requestNotificationListenerPermission: jest.fn(),
  getNativePendingBankNotifications: jest.fn(() => []),
  addBankNotificationListener: jest.fn((callback) => {
    return () => {}
  })
}))

const isAvailableMock = nativeModule.isNotificationListenerAvailable as jest.Mock
const isGrantedMock = nativeModule.isNotificationListenerPermissionGranted as jest.Mock
const requestPermissionMock = nativeModule.requestNotificationListenerPermission as jest.Mock
const getNativePendingMock = nativeModule.getNativePendingBankNotifications as jest.Mock
const addListenerMock = nativeModule.addBankNotificationListener as jest.Mock

describe('Puente nativo de notificaciones bancarias', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await clearBankNotifications()
  })

  it('consulta disponibilidad y permisos a traves del modulo nativo', () => {
    isAvailableMock.mockReturnValue(true)
    isGrantedMock.mockReturnValue(true)

    expect(isBankNotificationListenerSupported()).toBe(true)
    expect(hasBankNotificationPermission()).toBe(true)

    requestBankNotificationPermission()
    expect(requestPermissionMock).toHaveBeenCalled()
  })

  it('drena notificaciones nativas pendientes y las encola estructuradas', async () => {
    getNativePendingMock.mockReturnValue([
      {
        title: 'PAGO MOVIL RECIBIDO',
        body: 'BNC Pago Movil Recibido Bs. 10000,00 Telf. 0414***69..',
        packageName: 'com.bnc.app',
        timestamp: Date.now()
      },
      {
        title: 'Mensaje irrelevante',
        body: 'Texto sin transaccion',
        packageName: 'com.other.app',
        timestamp: Date.now()
      }
    ])

    const drained = await drainNativeBankNotifications()
    expect(drained).toHaveLength(1)
    expect(drained[0].amount).toBe(10000)

    const pending = await getPendingBankNotifications()
    expect(pending).toHaveLength(1)
    expect(pending[0].amount).toBe(10000)
  })

  it('suscribe el callback a notificaciones emitidas en tiempo real', async () => {
    let capturedListener: ((raw: nativeModule.RawNativeBankNotification) => void) | null = null
    addListenerMock.mockImplementation((listener) => {
      capturedListener = listener
      return () => {}
    })

    const onDetected = jest.fn()
    const unsubscribe = subscribeToNativeBankNotifications(onDetected)

    expect(capturedListener).not.toBeNull()

    // Disparar notificacion valida
    capturedListener!({
      title: 'PAGO MOVIL RECIBIDO',
      body: 'BNC Pago Movil Recibido Bs. 2500,00 Telf. 04120001122..',
      packageName: 'com.bnc.app',
      timestamp: Date.now()
    })

    // Esperar guardado asincrono
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(onDetected).toHaveBeenCalledWith(
      expect.objectContaining({
        bank: 'bnc',
        amount: 2500
      })
    )

    // Caso sin onDetected y caso con notificacion no bancaria
    const unsubscribeNoop = subscribeToNativeBankNotifications()
    capturedListener!({
      title: 'Noticia',
      body: 'Texto irrelevante',
      packageName: 'com.other',
      timestamp: Date.now()
    })
    capturedListener!({
      title: 'PAGO MOVIL RECIBIDO',
      body: 'BNC Pago Movil Recibido Bs. 300,00 Telf. 04140001122..',
      packageName: 'com.bnc.app',
      timestamp: Date.now()
    })
    await new Promise((resolve) => setTimeout(resolve, 50))
    unsubscribeNoop()

    unsubscribe()
  })

  it('permite simular una notificacion de prueba y la guarda en cola', async () => {
    const simulated = await simulateBankNotification(
      'PAGO MOVIL RECIBIDO',
      'BNC Pago Movil Recibido Bs. 750,00 Telf. 04147778899..'
    )

    expect(simulated).not.toBeNull()
    expect(simulated?.amount).toBe(750)

    const pending = await getPendingBankNotifications()
    expect(pending).toHaveLength(1)
    expect(pending[0].amount).toBe(750)

    const invalid = await simulateBankNotification('Aviso', 'Texto no bancario')
    expect(invalid).toBeNull()
  })
})
