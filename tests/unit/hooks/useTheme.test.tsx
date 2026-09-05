/**
 * Pruebas unitarias del hook useTheme y ThemeProvider.
 * Validan la resolucion automatica segun el esquema de sistema,
 * el forzado a claro u oscuro y la persistencia de la preferencia.
 */

import { act, renderHook } from '@testing-library/react-native'
import type { PropsWithChildren } from 'react'
import { Appearance } from 'react-native'

import { DARK_COLORS, LIGHT_COLORS } from '@src/constants/theme'
import { ThemeProvider, useTheme } from '@src/contexts/ThemeContext'
import * as settingsRepo from '@src/db/settings'
import { __resetCacheForTests } from '@src/hooks/useSettings'

import { buildSettings } from '../../helpers/factories'

const loadSettingsMock = settingsRepo.loadSettings as jest.Mock
const saveSettingsMock = settingsRepo.saveSettings as jest.Mock

jest.mock('@src/db/settings')

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __resetCacheForTests()
    loadSettingsMock.mockResolvedValue(buildSettings({ themePreference: 'system' }))
    saveSettingsMock.mockResolvedValue(undefined)
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('devuelve valores por defecto claros cuando se usa fuera de ThemeProvider', async () => {
    const { result } = await renderHook(() => useTheme())

    expect(result.current.mode).toBe('light')
    expect(result.current.isDark).toBe(false)
    expect(result.current.preference).toBe('system')
    expect(result.current.colors).toEqual(LIGHT_COLORS)
  })

  it('resuelve a modo oscuro cuando la preferencia es system y el SO esta en oscuro', async () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark')

    const wrapper = ({ children }: PropsWithChildren) => <ThemeProvider>{children}</ThemeProvider>
    const { result } = await renderHook(() => useTheme(), { wrapper })

    expect(result.current.mode).toBe('dark')
    expect(result.current.isDark).toBe(true)
    expect(result.current.preference).toBe('system')
    expect(result.current.colors).toEqual(DARK_COLORS)
  })

  it('resuelve a modo claro cuando la preferencia es system y el SO esta en claro', async () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light')

    const wrapper = ({ children }: PropsWithChildren) => <ThemeProvider>{children}</ThemeProvider>
    const { result } = await renderHook(() => useTheme(), { wrapper })

    expect(result.current.mode).toBe('light')
    expect(result.current.isDark).toBe(false)
    expect(result.current.preference).toBe('system')
    expect(result.current.colors).toEqual(LIGHT_COLORS)
  })

  it('fuerza modo oscuro cuando la preferencia guardada es dark', async () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light')
    loadSettingsMock.mockResolvedValue(buildSettings({ themePreference: 'dark' }))

    const wrapper = ({ children }: PropsWithChildren) => <ThemeProvider>{children}</ThemeProvider>
    const { result } = await renderHook(() => useTheme(), { wrapper })

    // Se actualiza tras la carga de ajustes
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.mode).toBe('dark')
    expect(result.current.isDark).toBe(true)
    expect(result.current.colors).toEqual(DARK_COLORS)
  })

  it('permite cambiar la preferencia a traves de setPreference', async () => {
    const wrapper = ({ children }: PropsWithChildren) => <ThemeProvider>{children}</ThemeProvider>
    const { result } = await renderHook(() => useTheme(), { wrapper })

    await act(async () => {
      await result.current.setPreference('dark')
    })

    expect(result.current.preference).toBe('dark')
    expect(result.current.mode).toBe('dark')
    expect(result.current.isDark).toBe(true)
    expect(result.current.colors).toEqual(DARK_COLORS)
  })
})
