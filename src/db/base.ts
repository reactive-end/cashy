/**
 * Local SQLite database opening and schema.
 * Single connection entry point for every repository,
 * with a user_version based migration strategy.
 */

import * as SQLite from 'expo-sqlite'

/** Version actual del esquema; incrementar al cambiar tablas */
const SCHEMA_VERSION = 3

/** Conexion activa tras la primera apertura */
let instancia: SQLite.SQLiteDatabase | null = null

/** Promedio compartido para evitar aperturas concurrentes duplicadas */
let promesaApertura: Promise<SQLite.SQLiteDatabase> | null = null

/** Indices de la version vigente; se recrean tras cualquier renombre */
const INDICES_V3 = `
  CREATE INDEX IF NOT EXISTS index_expenses_type ON expenses (type);
  CREATE INDEX IF NOT EXISTS index_expenses_next_due ON expenses (next_due_date);
`

/**
 * Ejecuta la migracion desde esquemas previos.
 * v1 (nombres en espanol) se descarta; v2 -> v3 reconstruye la tabla
 * de gastos para ampliar el CHECK de moneda a EUR, preservando datos.
 * @param bd Conexion abierta de la base de datos
 */
async function migrar(bd: SQLite.SQLiteDatabase): Promise<void> {
  const fila = await bd.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  const versionActual = fila?.user_version ?? 0

  if (versionActual >= SCHEMA_VERSION) return

  // v1: tablas en espanol sin datos de produccion; descarte directo.
  await bd.execAsync(`
    DROP TABLE IF EXISTS gastos;
    DROP TABLE IF EXISTS ajustes;
    DROP TABLE IF EXISTS index_expenses_type;
    DROP TABLE IF EXISTS index_expenses_next_due;
  `)

  // v3: reconstruir expenses con EUR permitido, copiando filas de v2.
  await bd.execAsync(`
    DROP TABLE IF EXISTS expenses_nueva;
    CREATE TABLE expenses_nueva (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL CHECK (currency IN ('VES', 'USD', 'USDT', 'EUR')),
      type TEXT NOT NULL CHECK (type IN ('fixed', 'unique')),
      category TEXT,
      note TEXT,
      recurrence TEXT CHECK (recurrence IN ('weekly', 'biweekly', 'monthly', 'yearly')),
      next_due_date TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  const existeExpenses = await bd.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'expenses'"
  )

  if (existeExpenses) {
    await bd.execAsync(`
      INSERT INTO expenses_nueva (
        id, name, amount, currency, type, category, note,
        recurrence, next_due_date, active, created_at, updated_at
      )
      SELECT
        id, name, amount, currency, type, category, note,
        recurrence, next_due_date, active, created_at, updated_at
      FROM expenses;
      DROP TABLE expenses;
    `)
  }

  await bd.execAsync('ALTER TABLE expenses_nueva RENAME TO expenses;')
  await bd.execAsync(INDICES_V3)

  await bd.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `)

  await bd.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`)
}

/**
 * Abre (o reutiliza) la conexion a la base de datos cashy.db.
 * Garantiza que el esquema vigente exista antes de devolver la conexion.
 * @returns Instancia lista para ejecutar consultas
 * @throws Error si la apertura o el esquema fallan
 */
export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (instancia) return instancia

  if (!promesaApertura) {
    promesaApertura = (async () => {
      const db = await SQLite.openDatabaseAsync('cashy.db')
      await migrar(db)
      instancia = db
      return db
    })()
  }

  return promesaApertura
}

/**
 * Cierra la conexion actual. Pensado para pruebas;
 * la app normal mantiene una sola conexion abierta.
 */
export async function closeDatabase(): Promise<void> {
  if (!instancia) return
  await instancia.closeAsync()
  instancia = null
  promesaApertura = null
}
