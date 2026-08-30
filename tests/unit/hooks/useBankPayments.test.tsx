/**
 * Pruebas unitarias para el hook useBankPayments.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import * as incomesRepo from '@src/db/incomes'
import { useBankPayments } from '@src/hooks/useBankPayments'
import * as storage from '@src/lib/bankNotifications/storage'
import type { ParsedBankNotification } from '@src/lib/bankNotifications/types'
import { emit, subscribe } from '@src/lib/events'

const sampleNotification: ParsedBankNotification = {
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

jest.mock('@src/db/incomes', () => ({
  insertIncome: jest.fn(async () => ({
    id: 'inc-123',
    name: 'Pago Movil BNC',
    amount: 10000,
    currency: 'VES',
    type: 'unique',
    paydayDay: 29
  }))
}))

jest.mock('@src/lib/bankNotifications/storage', () => ({
  getPendingBankNotifications: jest.fn(async () => []),
  dequeueBankNotification: jest.fn(async () => undefined)
}))

jest.mock('@src/hooks/useSubscription', () => ({
  useSubscription: jest.fn(() => ({
    isPro: true,
    plan: 'pro',
    loading: false,
    subscription: null,
    refresh: jest.fn()
  }))
}))

const getPendingMock = storage.getPendingBankNotifications as jest.Mock
const dequeueMock = storage.dequeueBankNotification as jest.Mock
const insertIncomeMock = incomesRepo.insertIncome as jest.Mock

describe('useBankPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getPendingMock.mockResolvedValue([])
  })

  it('inicia con cola vacia si no hay notificaciones pendientes', async () => {
    const { result } = await renderHook(() => useBankPayments())

    await waitFor(() => expect(result.current.activeNotification).toBeNull())
    expect(result.current.pendingCount).toBe(0)
  })

  it('carga la notificacion pendiente en activeNotification', async () => {
    getPendingMock.mockResolvedValue([sampleNotification])

    const { result } = await renderHook(() => useBankPayments())

    await waitFor(() => expect(result.current.activeNotification).not.toBeNull())
    expect(result.current.activeNotification?.bank).toBe('bnc')
    expect(result.current.activeNotification?.amount).toBe(10000)
    expect(result.current.pendingCount).toBe(1)
  })

  it('confirma el registro guardando en incomes y removiendo de la cola', async () => {
    getPendingMock.mockResolvedValue([sampleNotification])

    const { result } = await renderHook(() => useBankPayments())
    await waitFor(() => expect(result.current.activeNotification).not.toBeNull())

    const events: string[] = []
    const unsubscribe = subscribe('incomes-changed', () => events.push('incomes'))

    // Al confirmar, la cola se vacia
    getPendingMock.mockResolvedValue([])

    let ok = false
    await act(async () => {
      ok = await result.current.confirm('Cobro freelance BNC')
    })

    unsubscribe()

    expect(ok).toBe(true)
    expect(insertIncomeMock).toHaveBeenCalledWith(
      {
        name: 'Cobro freelance BNC',
        amount: 10000,
        currency: 'VES',
        type: 'unique',
        paydayDay: expect.any(Number)
      },
      expect.any(String)
    )
    expect(dequeueMock).toHaveBeenCalledWith(sampleNotification.detectedAt)
    expect(events).toEqual(['incomes'])
  })

  it('descarta la notificacion removiendola sin guardar', async () => {
    getPendingMock.mockResolvedValue([sampleNotification])

    const { result } = await renderHook(() => useBankPayments())
    await waitFor(() => expect(result.current.activeNotification).not.toBeNull())

    getPendingMock.mockResolvedValue([])

    await act(async () => {
      await result.current.dismiss()
    })

    expect(insertIncomeMock).not.toHaveBeenCalled()
    expect(dequeueMock).toHaveBeenCalledWith(sampleNotification.detectedAt)
  })

  it('recarga la cola cuando se emite bank-notification-detected', async () => {
    const { result } = await renderHook(() => useBankPayments())
    await waitFor(() => expect(result.current.activeNotification).toBeNull())

    getPendingMock.mockResolvedValue([sampleNotification])

    await act(async () => {
      emit('bank-notification-detected')
    })

    await waitFor(() => expect(result.current.activeNotification).not.toBeNull())
    expect(result.current.activeNotification?.bankName).toBe('BNC')
  })

  it('no expone activeNotification si el usuario no tiene plan PRO', async () => {
    const { useSubscription } = require('@src/hooks/useSubscription')
    ;(useSubscription as jest.Mock).mockReturnValue({
      isPro: false,
      plan: 'free',
      loading: false,
      subscription: null,
      refresh: jest.fn()
    })

    getPendingMock.mockResolvedValue([sampleNotification])

    const { result } = await renderHook(() => useBankPayments())
    await waitFor(() => expect(result.current.activeNotification).toBeNull())
  })
})
