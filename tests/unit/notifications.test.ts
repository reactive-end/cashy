/**
 * Pruebas unitarias de la libreria de notificaciones.
 * El modulo expo-notifications llega mockeado desde jest.setup;
 * aqui se valida la logica de decision y los identificadores.
 */

import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import * as dbExpenses from '@src/db/expenses'
import * as dbSettings from '@src/db/settings'
import {
  cancelAllReminders,
  cancelReminder,
  getBcvNoticeStatus,
  nextTriggerDate,
  scheduleReminder,
  setupNotifications,
  syncBcvNotice,
  syncReminders
} from '@src/lib/notifications'

import {
  NOW,
  buildFixedExpense,
  buildRates,
  buildSettings,
  buildUniqueExpense,
  isoDaysFromToday
} from '../helpers/factories'

/** Simula ejecucion en Android para cubrir el canal de notificaciones */
function mockAndroid(): void {
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true })
}

/** Restaura la plataforma simulada por defecto de jest-expo */
function restorePlatform(): void {
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
}

const scheduleMock = Notifications.scheduleNotificationAsync as jest.Mock
const cancelMock = Notifications.cancelScheduledNotificationAsync as jest.Mock
const getAllMock = Notifications.getAllScheduledNotificationsAsync as jest.Mock
const getExpensesMock = dbExpenses.getExpenses as jest.Mock
const updateExpenseMock = dbExpenses.updateExpense as jest.Mock
const loadSettingsMock = dbSettings.loadSettings as jest.Mock

jest.mock('@src/db/expenses', () => ({
  getExpenses: jest.fn(),
  updateExpense: jest.fn(async (id: string) => ({ id }))
}))

jest.mock('@src/db/settings', () => ({
  loadSettings: jest.fn()
}))

describe('scheduleReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ now: NOW })
    mockAndroid()
    loadSettingsMock.mockResolvedValue(buildSettings())
  })

  afterEach(() => {
    jest.useRealTimers()
    restorePlatform()
  })

  it('agenda con identificador determinista reminder-{id} y deep link al gasto', async () => {
    await scheduleReminder(buildFixedExpense(), 9)

    expect(scheduleMock).toHaveBeenCalledTimes(1)
    const peticion = scheduleMock.mock.calls[0][0]
    expect(peticion.identifier).toBe('reminder-gasto-fijo-1')
    expect(peticion.content.title).toBe('Recordatorio: Netflix')
    expect(peticion.content.data).toEqual({ expenseId: 'gasto-fijo-1' })
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

  it('respeta el minuto configurado al agendar el recordatorio', async () => {
    await scheduleReminder(buildFixedExpense({ nextDueDate: '2026-09-01' }), 9, 45)

    const disparo: Date = scheduleMock.mock.calls[0][0].trigger.date
    expect(disparo.getHours()).toBe(9)
    expect(disparo.getMinutes()).toBe(45)
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

  it('no agenda con los recordatorios apagados en ajustes', async () => {
    loadSettingsMock.mockResolvedValue(buildSettings({ remindersEnabled: false }))

    await scheduleReminder(buildFixedExpense(), 9)

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
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deriva el identificador del id del gasto', async () => {
    await cancelReminder('abc-123')

    expect(cancelMock).toHaveBeenCalledWith('reminder-abc-123')
  })
})

describe('cancelAllReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retira solo las notificaciones con prefijo reminder-', async () => {
    getAllMock.mockResolvedValueOnce([
      { identifier: 'reminder-gasto-fijo-1' },
      { identifier: 'bcv-diario' },
      { identifier: 'reminder-gasto-fijo-2' }
    ])

    await cancelAllReminders()

    expect(cancelMock).toHaveBeenCalledTimes(2)
    expect(cancelMock).toHaveBeenCalledWith('reminder-gasto-fijo-1')
    expect(cancelMock).toHaveBeenCalledWith('reminder-gasto-fijo-2')
    expect(cancelMock).not.toHaveBeenCalledWith('bcv-diario')
  })
})

describe('syncReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ now: NOW })
    mockAndroid()
    loadSettingsMock.mockResolvedValue(buildSettings())
  })

  afterEach(() => {
    jest.useRealTimers()
    restorePlatform()
  })

  it('avanza vencimientos vencidos y actualiza la base', async () => {
    const vencido = buildFixedExpense({
      nextDueDate: '2026-08-20',
      recurrence: 'weekly'
    })

    getExpensesMock.mockResolvedValueOnce([vencido])

    await syncReminders(buildSettings())

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

    await syncReminders(buildSettings())

    expect(updateExpenseMock).not.toHaveBeenCalled()
    expect(scheduleMock).not.toHaveBeenCalled()
  })

  it('con los recordatorios apagados actualiza vencimientos pero no agenda', async () => {
    const vencido = buildFixedExpense({
      nextDueDate: '2026-08-20',
      recurrence: 'weekly'
    })

    getExpensesMock.mockResolvedValueOnce([vencido])

    await syncReminders(buildSettings({ remindersEnabled: false }))

    expect(updateExpenseMock).toHaveBeenCalled()
    expect(scheduleMock).not.toHaveBeenCalled()
  })

  describe('permiso de notificaciones', () => {
    const getPermissionsMock = Notifications.getPermissionsAsync as jest.Mock

    beforeEach(() => {
      jest.clearAllMocks()
      jest.useFakeTimers({ now: NOW })
      mockAndroid()
      loadSettingsMock.mockResolvedValue(buildSettings())
    })

    afterEach(() => {
      jest.useRealTimers()
      restorePlatform()
    })

    it('solicita el permiso en el arranque sin agendar avisos por su cuenta', async () => {
      getPermissionsMock.mockResolvedValueOnce({ granted: false, canAskAgain: true })
      ;(Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: true
      })

      await setupNotifications()

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1)
      expect(scheduleMock).not.toHaveBeenCalled()
    })

    it('configura el canal de Android con importancia alta', async () => {
      await setupNotifications()

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'reminders',
        expect.objectContaining({ importance: 4 })
      )
    })

    it('syncReminders omite el agendado sin permiso pero actualiza vencimientos', async () => {
      const gasto = buildFixedExpense({ id: 'fijo-vencido', nextDueDate: isoDaysFromToday(-10) })
      getExpensesMock.mockResolvedValue([gasto])
      getPermissionsMock.mockResolvedValueOnce({ granted: false, canAskAgain: false })

      await syncReminders(buildSettings())

      expect(updateExpenseMock).toHaveBeenCalled()
      expect(scheduleMock).not.toHaveBeenCalled()
    })
  })
})

describe('syncBcvNotice', () => {
  const getPermissionsMock = Notifications.getPermissionsAsync as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ now: NOW })
    mockAndroid()
  })

  afterEach(() => {
    jest.useRealTimers()
    restorePlatform()
  })

  it('agenda bcv-diario como disparo de fecha concreta hacia la hora configurada', async () => {
    await syncBcvNotice(buildSettings({ bcvHour: 7, bcvMinute: 30 }))

    expect(scheduleMock).toHaveBeenCalledTimes(1)
    const peticion = scheduleMock.mock.calls[0][0]
    expect(peticion.identifier).toBe('bcv-diario')

    const trigger = peticion.trigger
    expect(trigger.type).toBe('date')
    expect(trigger.channelId).toBe('reminders')
    expect(trigger.repeats).toBeUndefined()

    const disparo: Date = trigger.date
    expect(disparo.getHours()).toBe(7)
    expect(disparo.getMinutes()).toBe(30)
    // Siempre apunta a una ocurrencia futura de la hora pedida.
    expect(disparo.getTime()).toBeGreaterThan(NOW.getTime())
  })

  it('incluye las tasas consultadas en el cuerpo del aviso', async () => {
    await syncBcvNotice(buildSettings(), buildRates())

    expect(scheduleMock.mock.calls[0][0].content.body).toBe('USD 779,95 · EUR 911,21')
  })

  it('usa un texto de respaldo cuando no hay tasas disponibles', async () => {
    await syncBcvNotice(buildSettings())

    expect(scheduleMock.mock.calls[0][0].content.body).toContain('Consulta el valor oficial')
  })

  it('cancela siempre los identificadores legados de 9 a.m. y 1 p.m.', async () => {
    await syncBcvNotice(buildSettings())

    expect(cancelMock).toHaveBeenCalledWith('bcv-9am')
    expect(cancelMock).toHaveBeenCalledWith('bcv-1pm')
  })

  it('apagado retira la programacion vigente sin agendar de nuevo', async () => {
    await syncBcvNotice(buildSettings({ bcvEnabled: false }))

    expect(cancelMock).toHaveBeenCalledWith('bcv-diario')
    expect(scheduleMock).not.toHaveBeenCalled()
  })

  it('no agenda sin permiso concedido', async () => {
    getPermissionsMock.mockResolvedValueOnce({ granted: false, canAskAgain: false })

    await syncBcvNotice(buildSettings())

    expect(scheduleMock).not.toHaveBeenCalled()
  })
})

describe('nextTriggerDate', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('devuelve hoy a la hora pedida cuando aun no ocurre', () => {
    const disparo = nextTriggerDate(19, 0)

    expect(disparo.getHours()).toBe(19)
    expect(disparo.getMinutes()).toBe(0)
    expect(disparo.getTime()).toBeGreaterThan(NOW.getTime())
  })

  it('cae manana cuando la hora ya paso en el dia actual', () => {
    const disparo = nextTriggerDate(7, 30)

    expect(disparo.getHours()).toBe(7)
    expect(disparo.getMinutes()).toBe(30)
    expect(disparo.getTime()).toBeGreaterThan(NOW.getTime())
  })

  it('acota horas y minutos fuera de rango', () => {
    const disparo = nextTriggerDate(99, -5)

    expect(disparo.getHours()).toBe(23)
    expect(disparo.getMinutes()).toBe(0)
    expect(disparo.getSeconds()).toBe(0)
    expect(disparo.getMilliseconds()).toBe(0)
  })
})

describe('getBcvNoticeStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reporta agendado con su fecha cuando el aviso existe', async () => {
    getAllMock.mockResolvedValueOnce([
      { identifier: 'reminder-gasto-fijo-1' },
      {
        identifier: 'bcv-diario',
        trigger: { type: 'date', date: '2026-08-24T23:00:00.000Z' }
      }
    ])

    await expect(getBcvNoticeStatus()).resolves.toEqual({
      scheduled: true,
      nextTrigger: new Date('2026-08-24T23:00:00.000Z')
    })
  })

  it('reporta no agendado cuando no hay programacion del aviso', async () => {
    getAllMock.mockResolvedValueOnce([{ identifier: 'reminder-gasto-fijo-1' }])

    await expect(getBcvNoticeStatus()).resolves.toEqual({
      scheduled: false,
      nextTrigger: null
    })
  })

  it('tolera triggers sin fecha interpretable manteniendo la bandera', async () => {
    getAllMock.mockResolvedValueOnce([{ identifier: 'bcv-diario', trigger: { type: 'date' } }])

    await expect(getBcvNoticeStatus()).resolves.toEqual({
      scheduled: true,
      nextTrigger: null
    })
  })
})
