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
    (require('../helpers/expoSqliteMock') as typeof import('../helpers/expoSqliteMock')).sqliteState
      .instance
}))

/** Insets fijos que simulan un dispositivo Android estandar */
const FIXED_INSETS = { top: 47, left: 0, right: 0, bottom: 34 }

/** Componente nominal para que css-interop pueda registrar los wrappers */
function mockPlainView({ children }: PropsWithChildren) {
  return children
}

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => FIXED_INSETS,
  SafeAreaProvider: Object.assign(mockPlainView, { displayName: 'SafeAreaProvider' }),
  SafeAreaView: Object.assign(mockPlainView, { displayName: 'SafeAreaView' }),
  SafeAreaConsumer: Object.assign(mockPlainView, { displayName: 'SafeAreaConsumer' }),
  initialWindowMetrics: {
    frame: { x: 0, y: 0, width: 0, height: 0 },
    insets: FIXED_INSETS
  }
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
  class FakeFile {
    static createDownloadTask = jest.fn(
      (
        _url: string,
        _folder: unknown,
        options?: { onProgress?: (p: { bytesWritten: number; totalBytes: number }) => void }
      ) => ({
        downloadAsync: jest.fn(async () => {
          if (options?.onProgress) options.onProgress({ bytesWritten: 100, totalBytes: 100 })
          return new FakeFile()
        })
      })
    )
    static downloadFileAsync = jest.fn(async () => new FakeFile())
    contentUri = 'content://archivo-falso'
    uri = 'file:///cache/actualizaciones/cashy.apk'
    arrayBuffer = jest.fn(async () => new Uint8Array([1, 2, 3, 4]).buffer)
    delete = jest.fn()
  }

  class FakeDirectory {
    create(): void {}
  }

  return {
    File: FakeFile,
    Directory: FakeDirectory,
    Paths: { cache: 'file:///cache', document: 'file:///documentos', bundle: 'file:///bundle' }
  }
})

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
  getStringAsync: jest.fn(async () => ''),
  hasStringAsync: jest.fn(async () => true)
}))

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: {
    SHA1: 'SHA-1',
    SHA256: 'SHA-256',
    SHA384: 'SHA-384',
    SHA512: 'SHA-512',
    MD5: 'MD5'
  },
  digest: jest.fn(async () => new Uint8Array([1, 2, 3, 4]).buffer),
  digestStringAsync: jest.fn(async () => 'fake-hash'),
  getRandomBytes: jest.fn((count: number) => new Uint8Array(count)),
  randomUUID: jest.fn(() => 'fake-uuid')
}))

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  supportedAuthenticationTypesAsync: jest.fn(async () => [1, 2]),
  authenticateAsync: jest.fn(async () => ({ success: true })),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3
  }
}))

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(async () => ({ type: 'cancel' })),
  maybeCompleteAuthSession: jest.fn()
}))

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({
      type: 'success' as const,
      data: {
        idToken: 'mock-id-token',
        scopes: [],
        serverAuthCode: null,
        user: {
          id: 'google-uid-123',
          name: 'Alex Developer',
          email: 'alex@example.com',
          photo: 'https://example.com/photo.png',
          familyName: 'Developer',
          givenName: 'Alex'
        }
      }
    })),
    signOut: jest.fn(async () => undefined)
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE'
  }
}))
