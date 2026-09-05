/**
 * Contexto de tema de Cashy.
 * Distribuye el modo visual activo (claro u oscuro), colores reactivos
 * y la preferencia persistida del usuario.
 */

import * as NavigationBar from 'expo-navigation-bar'
import { colorScheme } from 'nativewind'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react'
import { Appearance, Platform, useColorScheme as useRNColorScheme } from 'react-native'

import {
  DARK_COLORS,
  LIGHT_COLORS,
  type ThemeColors,
  type ThemeMode,
  type ThemePreference
} from '@src/constants/theme'
import { useSettings } from '@src/hooks/useSettings'

export interface ThemeContextValue {
  /** Colores del tema actualmente activo */
  colors: ThemeColors
  /** Modo resuelto ('light' o 'dark') */
  mode: ThemeMode
  /** Preferencia guardada ('system', 'light' o 'dark') */
  preference: ThemePreference
  /** Indica si el modo resuelto es oscuro */
  isDark: boolean
  /** Cambia la preferencia de tema y la persiste */
  setPreference: (preference: ThemePreference) => Promise<void>
}

export const DEFAULT_THEME_VALUE: ThemeContextValue = {
  colors: LIGHT_COLORS,
  mode: 'light',
  preference: 'system',
  isDark: false,
  setPreference: async () => undefined
}

export const ThemeContext = createContext<ThemeContextValue>(DEFAULT_THEME_VALUE)

/**
 * Proveedor del tema visual de la aplicacion.
 * Sincroniza la preferencia persistida con el esquema del sistema operativo
 * y actualiza NativeWind para alternar las clases CSS de Tailwind.
 * @param props Hijos envueltos en el contexto de tema
 * @returns Contexto montado con valores reactivos
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const { settings, changeThemePreference } = useSettings()
  const preference: ThemePreference = settings?.themePreference ?? 'system'

  const rnScheme = useRNColorScheme()
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(() =>
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  )

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: nextScheme }) => {
      setSystemScheme(nextScheme === 'dark' ? 'dark' : 'light')
    })
    return () => {
      subscription.remove()
    }
  }, [])

  // El modo efectivo es 'dark' si la preferencia es 'dark' o si es 'system' y el SO esta en oscuro
  const resolvedMode: ThemeMode =
    preference === 'dark'
      ? 'dark'
      : preference === 'light'
        ? 'light'
        : rnScheme === 'dark' || systemScheme === 'dark'
          ? 'dark'
          : 'light'

  // Sincronizar NativeWind
  useEffect(() => {
    try {
      colorScheme.set(preference === 'system' ? 'system' : resolvedMode)
    } catch {
      // Degrada defensivamente en entornos de prueba
    }
  }, [preference, resolvedMode])

  const setPreference = useCallback(
    async (nextPref: ThemePreference) => {
      await changeThemePreference(nextPref)
    },
    [changeThemePreference]
  )

  const isDark = resolvedMode === 'dark'
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  // Sincronizar barra de navegacion del sistema en Android
  useEffect(() => {
    if (Platform.OS !== 'android') return
    try {
      NavigationBar.setStyle(isDark ? 'dark' : 'light')
    } catch {
      // Degrada defensivamente en entornos de prueba o sin soporte
    }
  }, [isDark])

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      mode: resolvedMode,
      preference,
      isDark,
      setPreference
    }),
    [colors, resolvedMode, preference, isDark, setPreference]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hook de conveniencia para consumir el tema en cualquier componente.
 * Retorna valores claros por defecto si se usa fuera de ThemeProvider.
 * @returns Valores de tema y funciones de cambio
 */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
