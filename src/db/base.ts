/**
 * Local SQLite database opening and schema.
 * Single connection entry point for every repository,
 * with a user_version based migration strategy.
 */

import * as SQLite from 'expo-sqlite'

/** Version actual del esquema; incrementar al cambiar tablas */
const SCHEMA_VERSION = 5

/** Conexion activa tras la primera apertura */
let instance: SQLite.SQLiteDatabase | null = null

/** Promesa compartida para evitar aperturas concurrentes duplicadas */
let openPromise: Promise<SQLite.SQLiteDatabase> | null = null

/** Indices de la version vigente; se recrean tras cualquier renombre */
const INDEXES_V3 = `
  CREATE INDEX IF NOT EXISTS index_expenses_type ON expenses (type);
  CREATE INDEX IF NOT EXISTS index_expenses_next_due ON expenses (next_due_date);
`

/**
 * Ejecuta la migracion desde esquemas previos.
 * v1 (nombres en espanol) se descarta; v2 -> v3 reconstruye la tabla
 * de gastos para ampliar el CHECK de moneda a EUR, preservando datos;
 * v4 incorpora las tablas de perfil e ingresos del onboarding;
 * v5 renombra las columnas de profile al ingles preservando datos.
 * @param db Conexion abierta de la base de datos
 */
async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  const currentVersion = row?.user_version ?? 0

  if (currentVersion >= SCHEMA_VERSION) return

  // v1: tablas en espanol sin datos de produccion; descarte directo.
  await db.execAsync(`
    DROP TABLE IF EXISTS gastos;
    DROP TABLE IF EXISTS ajustes;
    DROP TABLE IF EXISTS index_expenses_type;
    DROP TABLE IF EXISTS index_expenses_next_due;
  `)

  // v3: reconstruir expenses con EUR permitido, copiando filas de v2.
  await db.execAsync(`
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

  const expensesExists = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'expenses'"
  )

  if (expensesExists) {
    await db.execAsync(`
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

  await db.execAsync('ALTER TABLE expenses_nueva RENAME TO expenses;')
  await db.execAsync(INDEXES_V3)

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `)

  // v4: perfil unico e ingresos del onboarding.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS profile (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      correo TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS incomes (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL CHECK (currency IN ('VES', 'USD', 'USDT', 'EUR')),
      payday_day INTEGER NOT NULL CHECK (payday_day BETWEEN 1 AND 31),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  // v5: columnas de profile renombradas al ingles, preservando datos.
  const oldProfileExists = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'profile'"
  )

  if (oldProfileExists) {
    await db.execAsync(`
      DROP TABLE IF EXISTS profile_nueva;
      CREATE TABLE profile_nueva (
        id TEXT PRIMARY KEY NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO profile_nueva (id, first_name, last_name, email, created_at, updated_at)
        SELECT id, nombre, apellido, correo, created_at, updated_at FROM profile;
      DROP TABLE profile;
      ALTER TABLE profile_nueva RENAME TO profile;
    `)
  } else {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS profile (
        id TEXT PRIMARY KEY NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `)
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`)
}

/**
 * Abre (o reutiliza) la conexion a la base de datos cashy.db.
 * Garantiza que el esquema vigente exista antes de devolver la conexion.
 * @returns Instancia lista para ejecutar consultas
 * @throws Error si la apertura o el esquema fallan
 */
export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (instance) return instance

  if (!openPromise) {
    openPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('cashy.db')
      await migrate(db)
      instance = db

      return db
    })()
  }

  return openPromise
}

/**
 * Cierra la conexion actual. Pensado para pruebas;
 * la app normal mantiene una sola conexion abierta.
 */
export async function closeDatabase(): Promise<void> {
  if (!instance) return
  await instance.closeAsync()
  instance = null
  openPromise = null
}
