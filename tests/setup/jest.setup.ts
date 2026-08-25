/**
 * Mocks globales registrados para todos los archivos de prueba.
 * Mantiene los modulos nativos fuera del camino de Jest.
 */

import type { PropsWithChildren } from 'react'

/** Requerido por React 19 para que las actualizaciones de estado
 * se ejecuten dentro del entorno act de testing-library. */
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** Mock global de expo-sqlite respaldado por la base falsa en memoria.
 * El require diferido evita dependencias ciclicas en tiempo de hoisting. */
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('../helpers/expoSqliteMock') as typeof import('../helpers/expoSqliteMock'))
      .estadoSQLite.instancia
}))

/** Insets fijos que simulan un dispositivo Android estandar */
const INSETS_FIJOS = { top: 47, left: 0, right: 0, bottom: 34 }

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => INSETS_FIJOS,
  SafeAreaProvider: ({ children }: PropsWithChildren) => children,
  SafeAreaView: ({ children }: PropsWithChildren) => children
}))

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => undefined),
  setOptions: jest.fn()
}))

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  scheduleNotificationAsync: jest.fn(async () => 'notificacion-falsa'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  getLastNotificationResponse: jest.fn(() => null),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  SchedulableTriggerInputTypes: {
    CALENDAR: 'calendar',
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval'
  },
  AndroidImportance: { DEFAULT: 3, HIGH: 4, MAX: 5 }
}))

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(async () => false)
}))

jest.mock('expo-background-task', () => ({
  registerTaskAsync: jest.fn(async () => undefined),
  unregisterTaskAsync: jest.fn(async () => undefined),
  getStatusAsync: jest.fn(async () => 2),
  BackgroundTaskResult: { Success: 1, Failed: 2 },
  BackgroundTaskStatus: { Restricted: 1, Available: 2 }
}))

jest.mock('expo-intent-launcher', () => ({
  startActivityAsync: jest.fn(async () => ({ result: -1 })),
  ActivityAction: {
    REQUEST_SCHEDULE_EXACT_ALARM: 'android.settings.REQUEST_SCHEDULE_EXACT_ALARM'
  }
}))

jest.mock('expo-updates', () => ({
  isEnabled: false,
  channel: null,
  runtimeVersion: null,
  checkForUpdateAsync: jest.fn(async () => ({ isAvailable: false })),
  fetchUpdateAsync: jest.fn(async () => ({ isNew: false })),
  reloadAsync: jest.fn(async () => undefined),
  useUpdates: jest.fn(() => ({ currentlyRunning: {}, isUpdateAvailable: false }))
}))

jest.mock('expo-file-system', () => {
  class ArchivoFalso {
    static createDownloadTask = jest.fn()
    static downloadFileAsync = jest.fn(async () => new ArchivoFalso())
    contentUri = 'content://archivo-falso'
    uri = 'file:///cache/actualizaciones/cashy.apk'
  }

  class CarpetaFalsa {
    create(): void {}
  }

  return {
    File: ArchivoFalso,
    Directory: CarpetaFalsa,
    Paths: { cache: 'file:///cache', document: 'file:///documentos', bundle: 'file:///bundle' }
  }
})
