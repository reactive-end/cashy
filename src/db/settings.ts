/**
 * User settings repository over SQLite.
 * Persists key/value pairs with sensible defaults.
 */

import type { AppSettings, BaseCurrency } from '@src/types/domain'

import { openDatabase } from './base'

/** Clave bajo la que se guardan los ajustes serializados */
const SETTINGS_KEY = 'settings'

/** Ajustes por defecto para un usuario nuevo */
export const DEFAULT_SETTINGS: AppSettings = {
  baseCurrency: 'USD',
  reminderHour: 9,
  reminderMinute: 0,
  bcvHour: 9,
  bcvMinute: 0,
  remindersEnabled: true,
  bcvEnabled: true
}

/** Forma cruda de una fila de la tabla settings */
interface SettingsRow {
  value: string
}

/** Campos validos de moneda base usados al validar el JSON persistido */
const VALID_BASE_CURRENCIES: readonly BaseCurrency[] = ['VES', 'USD', 'USDT']

/**
 * Comprueba que un objeto responde a la forma base de los ajustes.
 * Los campos incorporados en versiones recientes se completan con
 * los valores por defecto para mantener compatibilidad con el JSON
 * persistido por instalaciones anteriores.
 * @param value Objeto sin tipo leido desde la base
 * @returns AppSettings completo o null cuando la base es invalida
 */
function parseAppSettings(value: object): AppSettings | null {
  const baseValid =
    'baseCurrency' in value &&
    typeof value.baseCurrency === 'string' &&
    VALID_BASE_CURRENCIES.includes(value.baseCurrency as BaseCurrency) &&
    'reminderHour' in value &&
    typeof value.reminderHour === 'number'

  if (!baseValid) return null

  const parsed = value as Partial<AppSettings>

  return {
    baseCurrency: parsed.baseCurrency as BaseCurrency,
    reminderHour: parsed.reminderHour as number,
    reminderMinute:
      typeof parsed.reminderMinute === 'number'
        ? parsed.reminderMinute
        : DEFAULT_SETTINGS.reminderMinute,
    bcvHour: typeof parsed.bcvHour === 'number' ? parsed.bcvHour : DEFAULT_SETTINGS.bcvHour,
    bcvMinute: typeof parsed.bcvMinute === 'number' ? parsed.bcvMinute : DEFAULT_SETTINGS.bcvMinute,
    remindersEnabled:
      typeof parsed.remindersEnabled === 'boolean'
        ? parsed.remindersEnabled
        : DEFAULT_SETTINGS.remindersEnabled,
    bcvEnabled:
      typeof parsed.bcvEnabled === 'boolean' ? parsed.bcvEnabled : DEFAULT_SETTINGS.bcvEnabled
  }
}

/**
 * Lee los ajustes del usuario; si no existen devuelve los predeterminados.
 * @returns Ajustes actuales o valores por defecto
 */
export async function loadSettings(): Promise<AppSettings> {
  const db = await openDatabase()
  const row = await db.getFirstAsync<SettingsRow>('SELECT value FROM settings WHERE key = ?', [
    SETTINGS_KEY
  ])

  if (!row) return DEFAULT_SETTINGS

  try {
    const parsed: object = JSON.parse(row.value)
    return parseAppSettings(parsed) ?? DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

/**
 * Guarda (o reemplaza) los ajustes completos del usuario.
 * @param settings Conjunto completo de preferencias a persistir
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await openDatabase()
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [SETTINGS_KEY, JSON.stringify(settings)]
  )
}
