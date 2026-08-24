/**
 * Constantes crudas del tema para modulos nativos
 * que no entienden clases de Tailwind (notificaciones, splash, etc).
 */

/** Paleta base alineada con tailwind.config.js */
export const COLORS = {
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
} as const

/** Nombre del canal de notificaciones de Android */
export const REMINDERS_CHANNEL = 'reminders'
