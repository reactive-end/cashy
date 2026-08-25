/**
 * Pruebas de red simulada del servicio de actualizaciones binarias.
 * Valida el parseo del ultimo release de GitHub, el filtro del asset
 * APK y la comparacion contra la version instalada.
 */

import { consultarUltimoRelease, hayActualizacionDisponible } from '@src/services/appUpdate'

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

describe('consultarUltimoRelease', () => {
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

    const release = await consultarUltimoRelease()

    expect(release).toEqual({
      version: '1.2.0',
      urlApk: 'https://github.com/x.apk',
      notas: 'Correcciones de estabilidad'
    })
  })

  it('devuelve null cuando el release no trae asset APK', async () => {
    controlador = installFetchMock([
      {
        match: /releases\/latest/,
        respond: () => ({ body: releaseValido({ assets: [{ name: 'notas.md' }] }) })
      }
    ])

    await expect(consultarUltimoRelease()).resolves.toBeNull()
  })

  it('devuelve null ante error de red o respuesta invalida', async () => {
    controlador = installFetchMock([
      { match: /releases\/latest/, respond: () => new Error('sin conexion') }
    ])

    await expect(consultarUltimoRelease()).resolves.toBeNull()
  })

  it('devuelve null cuando GitHub responde sin exito', async () => {
    controlador = installFetchMock([
      {
        match: /releases\/latest/,
        respond: () => ({ status: 404, body: { message: 'Not Found' } })
      }
    ])

    await expect(consultarUltimoRelease()).resolves.toBeNull()
  })

  it('devuelve null cuando el JSON no responde a la forma esperada', async () => {
    controlador = installFetchMock([
      { match: /releases\/latest/, respond: () => ({ body: { message: 'sin tag' } }) }
    ])

    await expect(consultarUltimoRelease()).resolves.toBeNull()
  })
})

describe('hayActualizacionDisponible', () => {
  it('compara contra la version instalada de la configuracion', () => {
    expect(hayActualizacionDisponible({ version: '1.2.0', urlApk: 'x', notas: '' })).toBe(true)
    expect(hayActualizacionDisponible({ version: '1.0.1', urlApk: 'x', notas: '' })).toBe(false)
    expect(hayActualizacionDisponible({ version: '1.0.0', urlApk: 'x', notas: '' })).toBe(false)
  })
})
