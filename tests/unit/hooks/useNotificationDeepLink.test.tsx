/**
 * Pruebas unitarias del hook useNotificationDeepLink.
 * Valida la navegacion al detalle del gasto desde la respuesta
 * inicial y desde interacciones con la app abierta, y el no-op
 * en Expo Go.
 */

import { renderHook } from '@testing-library/react-native'

import { useNotificationDeepLink } from '@src/hooks/useNotificationDeepLink'
import * as notificationsLib from '@src/lib/notifications'

import type { NotificationResponse } from 'expo-notifications'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  router: { push: (url: unknown) => mockPush(url) }
}))

jest.mock('@src/lib/notifications', () => ({
  notificationsAvailable: jest.fn(() => true)
}))

const getLastResponseMock = notificacionesMock().getLastNotificationResponse as jest.Mock
const addListenerMock = notificacionesMock().addNotificationResponseReceivedListener as jest.Mock
const notificationsAvailableMock = notificationsLib.notificationsAvailable as jest.Mock

/** Acceso al modulo expo-notificaciones mockeado globalmente */
function notificacionesMock(): Record<string, jest.Mock> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as Record<string, jest.Mock>
}

/** Construye una respuesta de notificacion con datos arbitrarios */
function respuestaConData(data: Record<string, string>): NotificationResponse {
  return {
    notification: { request: { content: { data } } }
  } as NotificationResponse
}

describe('useNotificationDeepLink', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    notificationsAvailableMock.mockReturnValue(true)
    getLastResponseMock.mockReturnValue(null)
  })

  it('navega al detalle del gasto de la respuesta inicial (arranque desde aviso)', async () => {
    getLastResponseMock.mockReturnValueOnce(respuestaConData({ expenseId: 'gasto-9' }))

    await renderHook(() => useNotificationDeepLink())

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/expense/[id]', params: { id: 'gasto-9' } })
  })

  it('navega al tocar una notificacion con la app abierta', async () => {
    await renderHook(() => useNotificationDeepLink())

    const oyente = addListenerMock.mock.calls[0][0] as (respuesta: NotificationResponse) => void
    oyente(respuestaConData({ expenseId: 'gasto-2' }))

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/expense/[id]', params: { id: 'gasto-2' } })
  })

  it('ignora respuestas sin identificador de gasto', async () => {
    getLastResponseMock.mockReturnValueOnce(respuestaConData({ otro: 'dato' }))

    await renderHook(() => useNotificationDeepLink())

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('queda inactivo dentro de Expo Go', async () => {
    notificationsAvailableMock.mockReturnValue(false)

    await renderHook(() => useNotificationDeepLink())

    expect(addListenerMock).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
