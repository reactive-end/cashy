/**
 * Pruebas unitarias del hook useSettings con store compartido.
 * Verifica carga unica, propagacion instantanea entre consumidores,
 * persistencia inmediata, clamp de horas y aplicacion inmediata de
 * los cambios sobre las notificaciones.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import * as settingsRepo from '@src/db/settings'
import { __resetCacheForTests, useSettings } from '@src/hooks/useSettings'
import * as notifications from '@src/lib/notifications'
import * as ratesService from '@src/services/rates'

import { buildRates, buildSettings } from '../../helpers/factories'

const loadSettingsMock = settingsRepo.loadSettings as jest.Mock
const saveSettingsMock = settingsRepo.saveSettings as jest.Mock
const sincronizarBcvMock = notifications.syncBcvNotice as jest.Mock
const syncRemindersMock = notifications.syncReminders as jest.Mock
const cancelarTodosMock = notifications.cancelAllReminders as jest.Mock
const getExchangeRatesMock = ratesService.getExchangeRates as jest.Mock

jest.mock('@src/db/settings')
jest.mock('@src/lib/notifications')
jest.mock('@src/services/rates')

describe('useSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __resetCacheForTests()
    loadSettingsMock.mockResolvedValue(buildSettings())
    saveSettingsMock.mockResolvedValue(undefined)
    getExchangeRatesMock.mockResolvedValue(buildRates())
    sincronizarBcvMock.mockResolvedValue(undefined)
    syncRemindersMock.mockResolvedValue(undefined)
    cancelarTodosMock.mockResolvedValue(undefined)
  })

  it('carga los ajustes una sola vez aunque haya varios consumidores', async () => {
    const primero = await renderHook(() => useSettings())
    await waitFor(() => expect(primero.result.current.settings).toEqual(buildSettings()))

    const segundo = await renderHook(() => useSettings())

    expect(segundo.result.current.settings).toEqual(buildSettings())
    expect(loadSettingsMock).toHaveBeenCalledTimes(1)
  })

  it('propaga el cambio de moneda base al instante a otros consumidores', async () => {
    const ajustes = await renderHook(() => useSettings())
    await waitFor(() => expect(ajustes.result.current.settings).not.toBeNull())

    const otroConsumidor = await renderHook(() => useSettings())

    await act(async () => {
      await ajustes.result.current.changeBaseCurrency('VES')
    })

    expect(otroConsumidor.result.current.settings?.baseCurrency).toBe('VES')
    expect(saveSettingsMock).toHaveBeenCalledWith(buildSettings({ baseCurrency: 'VES' }))
  })

  it('clampea hora y minuto de recordatorio, persiste y reagenda', async () => {
    const { result } = await renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).not.toBeNull())

    await act(async () => {
      await result.current.changeReminderTime(30, 70)
    })
    expect(result.current.settings?.reminderHour).toBe(23)
    expect(result.current.settings?.reminderMinute).toBe(59)
    expect(syncRemindersMock).toHaveBeenCalledWith(
      buildSettings({ reminderHour: 23, reminderMinute: 59 })
    )

    await act(async () => {
      await result.current.changeReminderTime(-5, -1)
    })
    expect(result.current.settings?.reminderHour).toBe(0)
    expect(result.current.settings?.reminderMinute).toBe(0)
    expect(syncRemindersMock).toHaveBeenCalledWith(
      buildSettings({ reminderHour: 0, reminderMinute: 0 })
    )
  })

  it('clampea hora y minuto del aviso BCV, persiste y reagenda con las tasas vigentes', async () => {
    const { result } = await renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).not.toBeNull())

    await act(async () => {
      await result.current.changeBcvTime(19, 30)
    })

    expect(result.current.settings?.bcvHour).toBe(19)
    expect(result.current.settings?.bcvMinute).toBe(30)
    expect(saveSettingsMock).toHaveBeenCalledWith(buildSettings({ bcvHour: 19, bcvMinute: 30 }))
    expect(sincronizarBcvMock).toHaveBeenCalledWith(
      buildSettings({ bcvHour: 19, bcvMinute: 30 }),
      buildRates()
    )
  })

  it('al apagar los recordatorios retira todas las notificaciones agendadas', async () => {
    const { result } = await renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).not.toBeNull())

    await act(async () => {
      await result.current.setRemindersEnabled(false)
    })

    expect(saveSettingsMock).toHaveBeenCalledWith(buildSettings({ remindersEnabled: false }))
    expect(cancelarTodosMock).toHaveBeenCalledTimes(1)
    expect(syncRemindersMock).not.toHaveBeenCalled()
  })

  it('al encender los recordatorios reagenda de inmediato', async () => {
    const { result } = await renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).not.toBeNull())

    await act(async () => {
      await result.current.setRemindersEnabled(true)
    })

    expect(syncRemindersMock).toHaveBeenCalledWith(buildSettings({ remindersEnabled: true }))
    expect(cancelarTodosMock).not.toHaveBeenCalled()
  })

  it('al apagar el aviso BCV cancela sin consultar tasas', async () => {
    const { result } = await renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).not.toBeNull())

    await act(async () => {
      await result.current.setBcvEnabled(false)
    })

    expect(saveSettingsMock).toHaveBeenCalledWith(buildSettings({ bcvEnabled: false }))
    expect(sincronizarBcvMock).toHaveBeenCalledWith(buildSettings({ bcvEnabled: false }))
    expect(getExchangeRatesMock).not.toHaveBeenCalled()
  })

  it('al encender el aviso BCV reagenda con las tasas disponibles', async () => {
    const { result } = await renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).not.toBeNull())

    await act(async () => {
      await result.current.setBcvEnabled(true)
    })

    expect(sincronizarBcvMock).toHaveBeenCalledWith(
      buildSettings({ bcvEnabled: true }),
      buildRates()
    )
  })

  it('permite recuperar la lectura si el primer intento falla', async () => {
    loadSettingsMock.mockRejectedValueOnce(new Error('db caida'))

    const { result } = await renderHook(() => useSettings())
    expect(result.current.settings).toBeNull()

    await act(async () => {
      // Un cambio de preferencia tras el fallo recarga y persiste igual.
      await result.current.changeBaseCurrency('USDT')
    })

    expect(result.current.settings).toEqual(buildSettings({ baseCurrency: 'USDT' }))
  })

  it('permite cambiar y persistir biometricsEnabled', async () => {
    const { result } = await renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).not.toBeNull())

    await act(async () => {
      await result.current.setBiometricsEnabled(true)
    })

    expect(result.current.settings?.biometricsEnabled).toBe(true)
    expect(saveSettingsMock).toHaveBeenCalledWith(
      expect.objectContaining({ biometricsEnabled: true })
    )
  })
})
