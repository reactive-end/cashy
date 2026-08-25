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
  cancelReminder,
  cancelarTodosRecordatorios,
  scheduleReminder,
  setupNotifications,
  sincronizarAvisosBcv,
  syncReminders
} from '@src/lib/notifications'

import {
  AHORA,
  buildFixedExpense,
  buildRates,
  buildSettings,
  buildUniqueExpense,
  isoEnDias
} from '../helpers/factories'

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
    jest.useFakeTimers({ now: AHORA })
    simularAndroid()
    loadSettingsMock.mockResolvedValue(buildSettings())
  })

  afterEach(() => {
    jest.useRealTimers()
    restaurarPlataforma()
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

describe('cancelarTodosRecordatorios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retira solo las notificaciones con prefijo reminder-', async () => {
    getAllMock.mockResolvedValueOnce([
      { identifier: 'reminder-gasto-fijo-1' },
      { identifier: 'bcv-diario' },
      { identifier: 'reminder-gasto-fijo-2' }
    ])

    await cancelarTodosRecordatorios()

    expect(cancelMock).toHaveBeenCalledTimes(2)
    expect(cancelMock).toHaveBeenCalledWith('reminder-gasto-fijo-1')
    expect(cancelMock).toHaveBeenCalledWith('reminder-gasto-fijo-2')
    expect(cancelMock).not.toHaveBeenCalledWith('bcv-diario')
  })
})

describe('syncReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ now: AHORA })
    simularAndroid()
    loadSettingsMock.mockResolvedValue(buildSettings())
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
      jest.useFakeTimers({ now: AHORA })
      simularAndroid()
      loadSettingsMock.mockResolvedValue(buildSettings())
    })

    afterEach(() => {
      jest.useRealTimers()
      restaurarPlataforma()
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
      const gasto = buildFixedExpense({ id: 'fijo-vencido', nextDueDate: isoEnDias(-10) })
      getExpensesMock.mockResolvedValue([gasto])
      getPermissionsMock.mockResolvedValueOnce({ granted: false, canAskAgain: false })

      await syncReminders(buildSettings())

      expect(updateExpenseMock).toHaveBeenCalled()
      expect(scheduleMock).not.toHaveBeenCalled()
    })
  })
})

describe('sincronizarAvisosBcv', () => {
  const getPermissionsMock = Notifications.getPermissionsAsync as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    simularAndroid()
  })

  afterEach(() => {
    restaurarPlataforma()
  })

  it('agenda un unico aviso bcv-diario a la hora configurada con repeticion diaria', async () => {
    await sincronizarAvisosBcv(buildSettings({ bcvHour: 7 }))

    expect(scheduleMock).toHaveBeenCalledTimes(1)
    const peticion = scheduleMock.mock.calls[0][0]
    expect(peticion.identifier).toBe('bcv-diario')
    expect(peticion.trigger.hour).toBe(7)
    expect(peticion.trigger.minute).toBe(0)
    expect(peticion.trigger.repeats).toBe(true)
    expect(peticion.trigger.channelId).toBe('reminders')
  })

  it('incluye las tasas consultadas en el cuerpo del aviso', async () => {
    await sincronizarAvisosBcv(buildSettings(), buildRates())

    expect(scheduleMock.mock.calls[0][0].content.body).toBe('USD 779,95 · EUR 911,21')
  })

  it('usa un texto de respaldo cuando no hay tasas disponibles', async () => {
    await sincronizarAvisosBcv(buildSettings())

    expect(scheduleMock.mock.calls[0][0].content.body).toContain('Consulta el valor oficial')
  })

  it('cancela siempre los identificadores legados de 9 a.m. y 1 p.m.', async () => {
    await sincronizarAvisosBcv(buildSettings())

    expect(cancelMock).toHaveBeenCalledWith('bcv-9am')
    expect(cancelMock).toHaveBeenCalledWith('bcv-1pm')
  })

  it('apagado retira la programacion vigente sin agendar de nuevo', async () => {
    await sincronizarAvisosBcv(buildSettings({ bcvEnabled: false }))

    expect(cancelMock).toHaveBeenCalledWith('bcv-diario')
    expect(scheduleMock).not.toHaveBeenCalled()
  })

  it('no agenda sin permiso concedido', async () => {
    getPermissionsMock.mockResolvedValueOnce({ granted: false, canAskAgain: false })

    await sincronizarAvisosBcv(buildSettings())

    expect(scheduleMock).not.toHaveBeenCalled()
  })
})
