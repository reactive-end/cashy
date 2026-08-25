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
  bcvHour: 9,
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
  const baseValida =
    'baseCurrency' in value &&
    typeof value.baseCurrency === 'string' &&
    VALID_BASE_CURRENCIES.includes(value.baseCurrency as BaseCurrency) &&
    'reminderHour' in value &&
    typeof value.reminderHour === 'number'

  if (!baseValida) return null

  const leidos = value as Partial<AppSettings>

  return {
    baseCurrency: leidos.baseCurrency as BaseCurrency,
    reminderHour: leidos.reminderHour as number,
    bcvHour: typeof leidos.bcvHour === 'number' ? leidos.bcvHour : DEFAULT_SETTINGS.bcvHour,
    remindersEnabled:
      typeof leidos.remindersEnabled === 'boolean'
        ? leidos.remindersEnabled
        : DEFAULT_SETTINGS.remindersEnabled,
    bcvEnabled:
      typeof leidos.bcvEnabled === 'boolean' ? leidos.bcvEnabled : DEFAULT_SETTINGS.bcvEnabled
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
