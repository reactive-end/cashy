/**
 * Constantes del tema para modulos nativos y sistema de diseno
 * adaptable entre modo claro y modo oscuro.
 */

export type { ThemePreference } from '@src/types/domain'

/** Modos visuales soportados por la aplicacion */

export type ThemeMode = 'light' | 'dark'

/** Forma de la paleta semantica de Cashy */
export interface ThemeColors {
  paper: string
  card: string
  line: string
  ink: string
  muted: string
  faint: string
  accent: string
  accentSoft: string
  danger: string
  dangerSoft: string
  warn: string
  warnSoft: string
}

/** Paleta base en modo claro alineada con tailwind.config.js */
export const LIGHT_COLORS: ThemeColors = {
  paper: '#FAFAF7',
  card: '#FFFFFF',
  line: '#ECECE7',
  ink: '#1C1C1A',
  muted: '#6B6B66',
  faint: '#70706A',
  accent: '#2F6B4F',
  accentSoft: '#EDF3EF',
  danger: '#A63D3D',
  dangerSoft: '#F6ECEC',
  warn: '#7E6229',
  warnSoft: '#F5EFE2'
}

/** Paleta de modo oscuro inspirada en OpenCode (fondo negro profundo, bordes hairline y verde Cashy accesible) */
export const DARK_COLORS: ThemeColors = {
  paper: '#0A0A0A',
  card: '#141414',
  line: '#333333',
  ink: '#F4F4F0',
  muted: '#A3A39E',
  faint: '#858580',
  accent: '#3EB882',
  accentSoft: '#142B20',
  danger: '#F87171',
  dangerSoft: '#2A1515',
  warn: '#FBBF24',
  warnSoft: '#2B210C'
}

/** Paleta por defecto para compatibilidad con imports directos */
export const COLORS: ThemeColors = LIGHT_COLORS

/** Nombre del canal de notificaciones de Android */
export const REMINDERS_CHANNEL = 'reminders'
