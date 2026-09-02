/**
 * Pruebas unitarias del hook useNotificationsSettings.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import { useNotificationsSettings } from '@src/hooks/useNotificationsSettings'
import { loadSettings } from '@src/db/settings'
import { isNotificationPermissionGranted, getBcvNoticeStatus } from '@src/lib/notifications'
import { buildSettings } from '../../helpers/factories'

jest.mock('@src/db/settings', () => ({
  loadSettings: jest.fn(),
  saveSettings: jest.fn(async () => undefined)
}))

jest.mock('@src/lib/notifications', () => ({
  isNotificationPermissionGranted: jest.fn(async () => true),
  getBcvNoticeStatus: jest.fn(async () => ({
    scheduled: true,
    nextTrigger: '2026-09-03T09:00:00'
  })),
  notificationsAvailable: jest.fn(() => true),
  openExactAlarmSettings: jest.fn(async () => undefined),
  scheduleReminder: jest.fn(),
  cancelReminder: jest.fn(),
  cancelAllReminders: jest.fn(async () => undefined),
  syncAllReminders: jest.fn(async () => undefined),
  syncBcvDailyReminder: jest.fn(async () => undefined)
}))

const loadSettingsMock = loadSettings as jest.Mock

describe('useNotificationsSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    loadSettingsMock.mockResolvedValue(
      buildSettings({
        remindersEnabled: true,
        reminderHour: 10,
        reminderMinute: 30,
        bcvEnabled: false
      })
    )
  })

  it('carga estado de permisos y opciones de ajustes', async () => {
    const { result } = await renderHook(() => useNotificationsSettings())
    await waitFor(() => expect(result.current?.permissionGranted).toBe(true))

    expect(result.current.bcvStatus?.scheduled).toBe(true)
    expect(result.current.isExpoGo).toBe(false)
  })

  it('permite alternar recordatorios', async () => {
    const { result } = await renderHook(() => useNotificationsSettings())
    await waitFor(() => expect(result.current?.permissionGranted).toBe(true))

    await act(async () => {
      await result.current.handleToggleReminders(false)
    })
  })
})
