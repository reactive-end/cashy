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
  reminderHour: 9
}

/** Forma cruda de una fila de la tabla settings */
interface SettingsRow {
  value: string
}

/** Campos validos de moneda base usados al validar el JSON persistido */
const VALID_BASE_CURRENCIES: readonly BaseCurrency[] = ['VES', 'USD', 'USDT']

/**
 * Comprueba que un objeto responde a la forma de los ajustes.
 * @param value Objeto sin tipo leido desde la base
 * @returns true si el objeto es un AppSettings valido
 */
function isAppSettings(value: object): value is AppSettings {
  return (
    'baseCurrency' in value &&
    typeof value.baseCurrency === 'string' &&
    VALID_BASE_CURRENCIES.includes(value.baseCurrency as BaseCurrency) &&
    'reminderHour' in value &&
    typeof value.reminderHour === 'number'
  )
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
    return isAppSettings(parsed) ? parsed : DEFAULT_SETTINGS
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
