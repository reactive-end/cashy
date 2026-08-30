/**
 * Pruebas unitarias para la persistencia y gestion de cola de notificaciones bancarias.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  clearBankNotifications,
  dequeueBankNotification,
  enqueueBankNotification,
  getPendingBankNotifications
} from '@src/lib/bankNotifications/storage'
import type { ParsedBankNotification } from '@src/lib/bankNotifications/types'

const sampleNotification1: ParsedBankNotification = {
  bank: 'bnc',
  bankName: 'BNC',
  operationType: 'incoming_pago_movil',
  amount: 10000,
  amountCents: 1000000,
  currency: 'VES',
  sender: '0414***69',
  rawTitle: 'PAGO MOVIL RECIBIDO',
  rawBody: 'BNC Pago Movil Recibido Bs. 10000,00 Telf. 0414***69..',
  detectedAt: '2026-08-29T15:40:00.000Z'
}

const sampleNotification2: ParsedBankNotification = {
  bank: 'bnc',
  bankName: 'BNC',
  operationType: 'incoming_pago_movil',
  amount: 500,
  amountCents: 50000,
  currency: 'VES',
  sender: '0412***11',
  rawTitle: 'PAGO MOVIL RECIBIDO',
  rawBody: 'BNC Pago Movil Recibido Bs. 500,00 Telf. 0412***11..',
  detectedAt: '2026-08-29T15:45:00.000Z'
}

describe('Almacenamiento de notificaciones bancarias', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  it('devuelve arreglo vacio si no hay notificaciones guardadas', async () => {
    const list = await getPendingBankNotifications()
    expect(list).toEqual([])
  })

  it('devuelve arreglo vacio ante JSON corrupto en AsyncStorage', async () => {
    await AsyncStorage.setItem('cashy.pending-bank-notifications', 'invalido')
    const list = await getPendingBankNotifications()
    expect(list).toEqual([])
  })

  it('encola y recupera una notificacion exitosamente', async () => {
    const added = await enqueueBankNotification(sampleNotification1)
    expect(added).toBe(true)

    const list = await getPendingBankNotifications()
    expect(list).toHaveLength(1)
    expect(list[0]).toEqual(sampleNotification1)
  })

  it('evita encolar notificaciones duplicadas', async () => {
    await enqueueBankNotification(sampleNotification1)
    const duplicate = await enqueueBankNotification(sampleNotification1)

    expect(duplicate).toBe(false)
    const list = await getPendingBankNotifications()
    expect(list).toHaveLength(1)
  })

  it('limita el tamano de la cola al maximo configurado (10)', async () => {
    for (let i = 0; i < 12; i++) {
      await enqueueBankNotification({
        ...sampleNotification1,
        amount: (i + 1) * 100,
        amountCents: (i + 1) * 10000,
        rawBody: `BNC Pago Movil Recibido Bs. ${(i + 1) * 100},00 Telf. 0414***69..`,
        detectedAt: `2026-08-29T15:40:0${i}.000Z`
      })
    }

    const list = await getPendingBankNotifications()
    expect(list).toHaveLength(10)
    // La mas reciente debe estar al inicio
    expect(list[0].amount).toBe(1200)
  })

  it('desencola una notificacion especifica por su detectedAt', async () => {
    await enqueueBankNotification(sampleNotification1)
    await enqueueBankNotification(sampleNotification2)

    await dequeueBankNotification(sampleNotification1.detectedAt)

    const list = await getPendingBankNotifications()
    expect(list).toHaveLength(1)
    expect(list[0].detectedAt).toBe(sampleNotification2.detectedAt)
  })

  it('limpia todas las notificaciones pendientes con clearBankNotifications', async () => {
    await enqueueBankNotification(sampleNotification1)
    await enqueueBankNotification(sampleNotification2)

    await clearBankNotifications()

    const list = await getPendingBankNotifications()
    expect(list).toEqual([])
  })
})
