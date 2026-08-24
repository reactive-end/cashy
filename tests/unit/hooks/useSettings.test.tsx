/**
 * Pruebas unitarias del hook useSettings con store compartido.
 * Verifica carga unica, propagacion instantanea entre consumidores,
 * persistencia inmediata y clamp de la hora de recordatorio.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import * as settingsRepo from '@src/db/settings'
import { __reiniciarCacheParaPruebas, useSettings } from '@src/hooks/useSettings'

import { buildSettings } from '../../helpers/factories'

const loadSettingsMock = settingsRepo.loadSettings as jest.Mock
const saveSettingsMock = settingsRepo.saveSettings as jest.Mock

jest.mock('@src/db/settings')

describe('useSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __reiniciarCacheParaPruebas()
    loadSettingsMock.mockResolvedValue(buildSettings())
    saveSettingsMock.mockResolvedValue(undefined)
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
    expect(saveSettingsMock).toHaveBeenCalledWith({
      baseCurrency: 'VES',
      reminderHour: 9
    })
  })

  it('clampea la hora de recordatorio al rango 0-23', async () => {
    const { result } = await renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).not.toBeNull())

    await act(async () => {
      await result.current.changeReminderHour(30)
    })
    expect(result.current.settings?.reminderHour).toBe(23)

    await act(async () => {
      await result.current.changeReminderHour(-5)
    })
    expect(result.current.settings?.reminderHour).toBe(0)
  })

  it('permite recuperar la lectura si el primer intento falla', async () => {
    loadSettingsMock.mockRejectedValueOnce(new Error('db caida'))

    const { result } = await renderHook(() => useSettings())
    expect(result.current.settings).toBeNull()

    await act(async () => {
      // Un cambio de preferencia tras el fallo recarga y persiste igual.
      await result.current.changeBaseCurrency('USDT')
    })

    expect(result.current.settings).toEqual({
      baseCurrency: 'USDT',
      reminderHour: 9
    })
  })
})
