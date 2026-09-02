/**
 * Pruebas de red simulada del servicio de actualizaciones binarias.
 * Valida el parseo del ultimo release de GitHub, el filtro del asset
 * APK y la comparacion contra la version instalada.
 */

import {
  downloadApk,
  fetchLatestRelease,
  installApk,
  isUpdateAvailable
} from '@src/services/appUpdate'

import { installFetchMock } from '../helpers/networkMock'

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.0.1' } }
}))

/** Respuesta tipica de un release con APK adjunto */
function releaseValido(overrides: object = {}): object {
  return {
    tag_name: 'v1.2.0',
    body: 'Correcciones de estabilidad',
    assets: [
      { name: 'cashy-v1.2.0.apk', browser_download_url: 'https://github.com/x.apk' },
      { name: 'firmas.txt', browser_download_url: 'https://github.com/x.txt' }
    ],
    ...overrides
  }
}

describe('fetchLatestRelease', () => {
  let controlador: ReturnType<typeof installFetchMock>

  afterEach(() => {
    controlador.restore()
  })

  it('devuelve la version normalizada y la URL del asset APK', async () => {
    controlador = installFetchMock([
      {
        match: /api\.github\.com\/repos\/reactive-end\/cashy\/releases\/latest/,
        respond: () => ({ body: releaseValido() })
      }
    ])

    const release = await fetchLatestRelease()

    expect(release).toEqual({
      version: '1.2.0',
      apkUrl: 'https://github.com/x.apk',
      notes: 'Correcciones de estabilidad',
      sha256: undefined
    })
  })

  it('extrae el hash SHA-256 del cuerpo del release si esta presente', async () => {
    controlador = installFetchMock([
      {
        match: /releases\/latest/,
        respond: () => ({
          body: releaseValido({
            body: 'Release notes\nSHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
          })
        })
      }
    ])

    const release = await fetchLatestRelease()
    expect(release?.sha256).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('devuelve null cuando el release no trae asset APK', async () => {
    controlador = installFetchMock([
      {
        match: /releases\/latest/,
        respond: () => ({ body: releaseValido({ assets: [{ name: 'notas.md' }] }) })
      }
    ])

    await expect(fetchLatestRelease()).resolves.toBeNull()
  })

  it('devuelve null ante error de red o respuesta invalida', async () => {
    controlador = installFetchMock([
      { match: /releases\/latest/, respond: () => new Error('sin conexion') }
    ])

    await expect(fetchLatestRelease()).resolves.toBeNull()
  })

  it('devuelve null cuando GitHub responde sin exito', async () => {
    controlador = installFetchMock([
      {
        match: /releases\/latest/,
        respond: () => ({ status: 404, body: { message: 'Not Found' } })
      }
    ])

    await expect(fetchLatestRelease()).resolves.toBeNull()
  })

  it('devuelve null cuando el JSON no responde a la forma esperada', async () => {
    controlador = installFetchMock([
      { match: /releases\/latest/, respond: () => ({ body: { message: 'sin tag' } }) }
    ])

    await expect(fetchLatestRelease()).resolves.toBeNull()
  })
})

describe('isUpdateAvailable', () => {
  it('compara contra la version instalada de la configuracion', () => {
    expect(isUpdateAvailable({ version: '1.2.0', apkUrl: 'x', notes: '' })).toBe(true)
    expect(isUpdateAvailable({ version: '1.0.1', apkUrl: 'x', notes: '' })).toBe(false)
    expect(isUpdateAvailable({ version: '1.0.0', apkUrl: 'x', notes: '' })).toBe(false)
  })
})

describe('downloadApk and installApk', () => {
  it('descarga el APK y reporta el progreso', async () => {
    const onProgress = jest.fn()
    const file = await downloadApk('https://github.com/test.apk', onProgress)

    expect(file).toBeDefined()
    expect(onProgress).toHaveBeenCalledWith(1)
  })

  it('valida exitosamente el APK cuando coincide el hash SHA-256 esperado', async () => {
    // El mock de digest retorna [1, 2, 3, 4] -> hex '01020304'
    const file = await downloadApk('https://github.com/test.apk', undefined, '01020304')
    expect(file).toBeDefined()
  })

  it('lanza error y purga el archivo si el hash SHA-256 no coincide', async () => {
    await expect(
      downloadApk('https://github.com/test.apk', undefined, 'hash-invalido-1234')
    ).rejects.toThrow('Integrity check failed: APK SHA-256 does not match release checksum')
  })

  it('ejecuta la actividad del sistema para instalar el archivo', async () => {
    const file = await downloadApk('https://github.com/test.apk')
    await installApk(file)

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const launcher = require('expo-intent-launcher')
    expect(launcher.startActivityAsync).toHaveBeenCalledWith('android.intent.action.VIEW', {
      data: file.contentUri,
      flags: 268435457,
      type: 'application/vnd.android.package-archive'
    })
  })
})
