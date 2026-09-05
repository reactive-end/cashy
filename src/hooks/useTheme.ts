/**
 * Hook useTheme: acceso a la paleta reactiva y control del modo visual.
 */

import { useContext } from 'react'

import { ThemeContext, type ThemeContextValue } from '@src/contexts/ThemeContext'

export type { ThemeContextValue }

/**
 * Retorna la configuracion actual del tema visual, colores reactivos
 * y metodos para alternar la preferencia.
 * @returns Contexto de tema activo
 */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
