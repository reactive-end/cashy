/**
 * Pruebas unitarias de la libreria de notificaciones.
 * El modulo expo-notifications llega mockeado desde jest.setup;
 * aqui se valida la logica de decision y los identificadores.
 */

import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import * as dbExpenses from '@src/db/expenses'
import {
  cancelReminder,
  scheduleReminder,
  setupNotifications,
  syncReminders
} from '@src/lib/notifications'

import { AHORA, buildFixedExpense, buildUniqueExpense } from '../helpers/factories'

/** Simula ejecucion en Android para cubrir el canal de notificaciones */
function simularAndroid(): void {
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true })
}

/** Restaura la plataforma simulada por defecto de jest-expo */
function restaurarPlataforma(): void {
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
}

const scheduleMock = Notifications.scheduleNotificationAsync as jest.Mock
const cancelMock = Notifications.cancelScheduledNotificationAsync as jest.Mock
const getExpensesMock = dbExpenses.getExpenses as jest.Mock
const updateExpenseMock = dbExpenses.updateExpense as jest.Mock

jest.mock('@src/db/expenses', () => ({
  getExpenses: jest.fn(),
  updateExpense: jest.fn(async (id: string) => ({ id }))
}))

describe('scheduleReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ now: AHORA })
    simularAndroid()
  })

  afterEach(() => {
    jest.useRealTimers()
    restaurarPlataforma()
  })

  it('agenda con identificador determinista reminder-{id}', async () => {
    await scheduleReminder(buildFixedExpense(), 9)

    expect(scheduleMock).toHaveBeenCalledTimes(1)
    const peticion = scheduleMock.mock.calls[0][0]
    expect(peticion.identifier).toBe('reminder-gasto-fijo-1')
    expect(peticion.content.title).toBe('Recordatorio: Netflix')
    expect(peticion.trigger.channelId).toBe('reminders')
  })

  it('dispara un dia antes a la hora configurada', async () => {
    await scheduleReminder(buildFixedExpense({ nextDueDate: '2026-09-01' }), 9)

    const disparo: Date = scheduleMock.mock.calls[0][0].trigger.date
    expect(disparo.getFullYear()).toBe(2026)
    expect(disparo.getMonth()).toBe(7)
    expect(disparo.getDate()).toBe(31)
    expect(disparo.getHours()).toBe(9)
  })

  it('clampea la hora al rango 0-23', async () => {
    await scheduleReminder(buildFixedExpense(), 30)

    expect(scheduleMock.mock.calls[0][0].trigger.date.getHours()).toBe(23)
  })

  it('ignora gastos que no son fijos o estan inactivos', async () => {
    await scheduleReminder(buildUniqueExpense(), 9)
    await scheduleReminder(buildFixedExpense({ active: false }), 9)

    expect(scheduleMock).not.toHaveBeenCalled()
  })

  it('ignora vencimientos sin fecha o cuyo aviso ya paso', async () => {
    await scheduleReminder(buildFixedExpense({ nextDueDate: undefined }), 9)
    await scheduleReminder(buildFixedExpense({ nextDueDate: '2026-08-23' }), 9)

    expect(scheduleMock).not.toHaveBeenCalled()
  })

  it('cancela el recordatorio previo antes de reprogramar', async () => {
    await scheduleReminder(buildFixedExpense(), 12)

    expect(cancelMock).toHaveBeenCalledWith('reminder-gasto-fijo-1')
    expect(cancelMock.mock.invocationCallOrder[0]).toBeLessThan(
      scheduleMock.mock.invocationCallOrder[0]
    )
  })
})

describe('cancelReminder', () => {
  it('deriva el identificador del id del gasto', async () => {
    await cancelReminder('abc-123')

    expect(cancelMock).toHaveBeenCalledWith('reminder-abc-123')
  })
})

describe('syncReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ now: AHORA })
    simularAndroid()
  })

  afterEach(() => {
    jest.useRealTimers()
    restaurarPlataforma()
  })

  it('avanza vencimientos vencidos y actualiza la base', async () => {
    const vencido = buildFixedExpense({
      nextDueDate: '2026-08-20',
      recurrence: 'weekly'
    })

    getExpensesMock.mockResolvedValueOnce([vencido])

    await syncReminders(9)

    expect(updateExpenseMock).toHaveBeenCalledWith('gasto-fijo-1', {
      nextDueDate: '2026-08-27'
    })
    expect(scheduleMock).toHaveBeenCalled()
  })

  it('omite gastos sin recurrencia o inactivos', async () => {
    getExpensesMock.mockResolvedValueOnce([
      buildUniqueExpense(),
      buildFixedExpense({ active: false })
    ])

    await syncReminders(9)

    expect(updateExpenseMock).not.toHaveBeenCalled()
    expect(scheduleMock).not.toHaveBeenCalled()
  })

  describe('recordatorios BCV diarios', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      simularAndroid()
    })

    afterEach(() => {
      restaurarPlataforma()
    })

    it('setupNotifications agenda avisos a las 9 a.m. y 1 p.m. con repeticion diaria', async () => {
      await setupNotifications()

      const llamadasBcv = scheduleMock.mock.calls.filter(([peticion]) =>
        String(peticion.identifier).startsWith('bcv-')
      )

      expect(llamadasBcv).toHaveLength(2)
      expect(llamadasBcv[0][0].identifier).toBe('bcv-9am')
      expect(llamadasBcv[0][0].trigger.hour).toBe(9)
      expect(llamadasBcv[1][0].identifier).toBe('bcv-1pm')
      expect(llamadasBcv[1][0].trigger.hour).toBe(13)
      expect(llamadasBcv[0][0].trigger.repeats).toBe(true)
    })

    it('cancela los recordatorios BCV previos antes de reagendar', async () => {
      await setupNotifications()

      const cancelacionesBcv = cancelMock.mock.calls.filter(([id]) => String(id).startsWith('bcv-'))

      expect(cancelacionesBcv).toHaveLength(2)
    })
  })
})
