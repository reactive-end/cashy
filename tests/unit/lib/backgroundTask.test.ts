/**
 * Pruebas unitarias de la tarea en background de sincronizacion.
 * Valida la orquestacion con repliegue de tasas, el registro en
 * WorkManager y el resultado del ejecutor registrado en TaskManager.
 */

import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'

import * as dbSettings from '@src/db/settings'
import { SYNC_TASK_NAME, registerBackgroundTask, runSynchronization } from '@src/lib/backgroundTask'
import * as notifications from '@src/lib/notifications'
import * as ratesService from '@src/services/rates'
import * as ratesCache from '@src/services/rates-cache'

import { buildRates, buildSettings } from '../../helpers/factories'

const loadSettingsMock = dbSettings.loadSettings as jest.Mock
const getExchangeRatesMock = ratesService.getExchangeRates as jest.Mock
const loadRatesMock = ratesCache.loadRates as jest.Mock
const sincronizarBcvMock = notifications.syncBcvNotice as jest.Mock
const syncRemindersMock = notifications.syncReminders as jest.Mock
const notificationsAvailableMock = notifications.notificationsAvailable as jest.Mock
const isTaskRegisteredMock = TaskManager.isTaskRegisteredAsync as jest.Mock
const registerTaskMock = BackgroundTask.registerTaskAsync as jest.Mock

jest.mock('@src/db/settings')
jest.mock('@src/lib/notifications')
jest.mock('@src/services/rates')
jest.mock('@src/services/rates-cache')

/** Ejecutor capturado al importarse el modulo (defineTask corre en carga) */
const ejecutorDefinido = (TaskManager.defineTask as jest.Mock).mock.calls[0]?.[1] as
  ((evento: object) => Promise<number>) | undefined

/** Argumentos de la llamada de registro capturada antes de cualquier limpieza */
const llamadaDefineTask = (TaskManager.defineTask as jest.Mock).mock.calls[0]

describe('runSynchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    loadSettingsMock.mockResolvedValue(buildSettings())
    sincronizarBcvMock.mockResolvedValue(undefined)
    syncRemindersMock.mockResolvedValue(undefined)
  })

  it('consulta tasas frescas a la red y orquesta ambos avisos', async () => {
    getExchangeRatesMock.mockResolvedValueOnce(buildRates())

    await runSynchronization()

    expect(getExchangeRatesMock).toHaveBeenCalledWith(true)
    expect(sincronizarBcvMock).toHaveBeenCalledWith(buildSettings(), buildRates())
    expect(syncRemindersMock).toHaveBeenCalledWith(buildSettings())
  })

  it('repliega al cache local cuando la red falla', async () => {
    getExchangeRatesMock.mockRejectedValueOnce(new Error('sin red'))
    loadRatesMock.mockResolvedValueOnce(buildRates({ bcvUsd: 1 }))

    await runSynchronization()

    expect(sincronizarBcvMock).toHaveBeenCalledWith(buildSettings(), buildRates({ bcvUsd: 1 }))
  })

  it('continua sin tasas cuando la red y el cache fallan', async () => {
    getExchangeRatesMock.mockRejectedValueOnce(new Error('sin red'))
    loadRatesMock.mockRejectedValueOnce(new Error('cache vacio'))

    await runSynchronization()

    expect(sincronizarBcvMock).toHaveBeenCalledWith(buildSettings(), undefined)
    expect(syncRemindersMock).toHaveBeenCalledWith(buildSettings())
  })
})

describe('registro de la tarea', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    loadSettingsMock.mockResolvedValue(buildSettings())
    sincronizarBcvMock.mockResolvedValue(undefined)
    syncRemindersMock.mockResolvedValue(undefined)
  })

  it('queda definida en TaskManager bajo su nombre al cargar el modulo', () => {
    expect(llamadaDefineTask?.[0]).toBe(SYNC_TASK_NAME)
    expect(typeof llamadaDefineTask?.[1]).toBe('function')
  })

  it('registra la tarea periodica con intervalo minimo de 4 horas', async () => {
    notificationsAvailableMock.mockReturnValue(true)
    isTaskRegisteredMock.mockResolvedValueOnce(false)

    await registerBackgroundTask()

    expect(registerTaskMock).toHaveBeenCalledWith(SYNC_TASK_NAME, {
      minimumInterval: 240
    })
  })

  it('no duplica el registro cuando ya esta registrada', async () => {
    notificationsAvailableMock.mockReturnValue(true)
    isTaskRegisteredMock.mockResolvedValueOnce(true)

    await registerBackgroundTask()

    expect(registerTaskMock).not.toHaveBeenCalled()
  })

  it('no se registra dentro de Expo Go', async () => {
    notificationsAvailableMock.mockReturnValue(false)

    await registerBackgroundTask()

    expect(isTaskRegisteredMock).not.toHaveBeenCalled()
    expect(registerTaskMock).not.toHaveBeenCalled()
  })

  it('el ejecutor definido devuelve Success al completar', async () => {
    getExchangeRatesMock.mockResolvedValueOnce(buildRates())

    await expect(ejecutorDefinido?.({})).resolves.toBe(BackgroundTask.BackgroundTaskResult.Success)
  })

  it('el ejecutor definido devuelve Failed ante un error', async () => {
    loadSettingsMock.mockRejectedValueOnce(new Error('db caida'))

    await expect(ejecutorDefinido?.({})).resolves.toBe(BackgroundTask.BackgroundTaskResult.Failed)
  })
})
