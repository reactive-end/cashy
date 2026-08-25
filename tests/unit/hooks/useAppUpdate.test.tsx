/**
 * Pruebas unitarias del hook useAppUpdate.
 * Valida el gate por canal de distribucion, la deteccion del release,
 * el descarte persistente y el flujo de descarga e instalacion.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Updates from 'expo-updates'

import { useAppUpdate } from '@src/hooks/useAppUpdate'
import * as appUpdate from '@src/services/appUpdate'

jest.mock('expo-updates', () => ({
  isEnabled: true,
  channel: 'github'
}))

jest.mock('@src/services/appUpdate', () => ({
  consultarUltimoRelease: jest.fn(),
  hayActualizacionDisponible: jest.fn(),
  descargarApk: jest.fn(),
  instalarApk: jest.fn()
}))

const consultarMock = appUpdate.consultarUltimoRelease as jest.Mock
const disponibleMock = appUpdate.hayActualizacionDisponible as jest.Mock
const descargarMock = appUpdate.descargarApk as jest.Mock
const instalarMock = appUpdate.instalarApk as jest.Mock

const RELEASE = { version: '1.2.0', urlApk: 'https://github.com/cashy.apk', notas: 'Mejoras' }

describe('useAppUpdate', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
    consultarMock.mockResolvedValue(RELEASE)
    disponibleMock.mockReturnValue(true)
    descargarMock.mockResolvedValue({})
    instalarMock.mockResolvedValue(undefined)
  })

  it('no consulta releases fuera del canal de distribucion por GitHub', async () => {
    ;(Updates as { channel: string }).channel = 'play'

    await renderHook(() => useAppUpdate())

    expect(consultarMock).not.toHaveBeenCalled()

    ;(Updates as { channel: string }).channel = 'github'
  })

  it('expone el release nuevo cuando hay version mayor no descartada', async () => {
    const { result } = await renderHook(() => useAppUpdate())

    await waitFor(() => expect(result.current.disponible).toEqual(RELEASE))
  })

  it('no muestra el aviso cuando la version fue descartada antes', async () => {
    await AsyncStorage.setItem('cashy.update-descartada', RELEASE.version)

    const { result } = await renderHook(() => useAppUpdate())

    await waitFor(() => expect(consultarMock).toHaveBeenCalled())
    expect(result.current.disponible).toBeNull()
  })

  it('no muestra el aviso cuando no hay version mas nueva', async () => {
    disponibleMock.mockReturnValue(false)

    const { result } = await renderHook(() => useAppUpdate())

    await waitFor(() => expect(consultarMock).toHaveBeenCalled())
    expect(result.current.disponible).toBeNull()
  })

  it('confirmar descarga el APK e inicia el instalador', async () => {
    const { result } = await renderHook(() => useAppUpdate())
    await waitFor(() => expect(result.current.disponible).toEqual(RELEASE))

    await act(async () => {
      await result.current.confirmar()
    })

    expect(descargarMock).toHaveBeenCalledWith(RELEASE.urlApk, expect.any(Function))
    expect(instalarMock).toHaveBeenCalledTimes(1)
    expect(result.current.descargando).toBe(false)
  })

  it('confirmar con descarga fallida no lanza el instalador', async () => {
    descargarMock.mockRejectedValue(new Error('sin conexion'))

    const { result } = await renderHook(() => useAppUpdate())
    await waitFor(() => expect(result.current.disponible).toEqual(RELEASE))

    await act(async () => {
      await result.current.confirmar()
    })

    expect(instalarMock).not.toHaveBeenCalled()
    expect(result.current.descargando).toBe(false)
    expect(result.current.disponible).toEqual(RELEASE)
  })

  it('descartar persiste la version y cierra el aviso', async () => {
    const { result } = await renderHook(() => useAppUpdate())
    await waitFor(() => expect(result.current.disponible).toEqual(RELEASE))

    await act(async () => {
      await result.current.descartar()
    })

    expect(await AsyncStorage.getItem('cashy.update-descartada')).toBe(RELEASE.version)
    expect(result.current.disponible).toBeNull()
  })
})
