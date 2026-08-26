/**
 * Mock del modulo expo-sqlite respaldado por una base en memoria.
 * Registra cada sentencia ejecutada y sirve resultados encolados,
 * permitiendo probar repositorios y migraciones sin modulo nativo.
 */

/** Sentencia capturada con sus parametros */
export interface ExecutedStatement {
  sql: string
  params?: (string | number | null)[]
}

/** Fila generica devuelta por las consultas simuladas */
export type SimulatedRow = Record<string, string | number | null>

/**
 * Base de datos falsa con la superficie usada por los repositorios.
 * Los resultados se consumen en el orden en que se encolan.
 * No implementa SQLiteDatabase literalmente: el modulo entero se mockea.
 */
export class FakeDatabase {
  /** Historial completo de sentencias ejecutadas */
  statements: ExecutedStatement[] = []

  private queuedRows: SimulatedRow[][] = []

  /**
   * Encola filas que consumiran las siguientes consultas de lectura.
   * @param rows Filas a servir en orden FIFO
   */
  queue(rows: SimulatedRow[]): void {
    this.queuedRows.push(rows)
  }

  async execAsync(sql: string): Promise<void> {
    this.record(sql)
  }

  async runAsync(sql: string, params?: (string | number | null)[]): Promise<void> {
    this.record(sql, params)
  }

  async getFirstAsync<T>(sql: string, params?: (string | number | null)[]): Promise<T | null> {
    this.record(sql, params)
    const group = this.queuedRows.shift()
    return (group?.[0] as T) ?? null
  }

  async getAllAsync<T>(sql: string, params?: (string | number | null)[]): Promise<T[]> {
    this.record(sql, params)
    const group = this.queuedRows.shift()
    return (group ?? []) as T[]
  }

  async closeAsync(): Promise<void> {
    this.instanceClosed = true
  }

  /**
   * Ejecuta un bloque dentro de una transaccion simulada,
   * registrando el BEGIN/COMMIT en el historial de sentencias.
   * @param block Funcion cuyo cuerpo queda dentro de la transaccion
   */
  async withTransactionAsync(block: () => Promise<void>): Promise<void> {
    this.record('BEGIN TRANSACTION')
    await block()
    this.record('COMMIT')
  }

  /** Marca dejada al cerrar; util para verificar liberacion */
  instanceClosed = false

  /**
   * Filtra el historial por un fragmento de SQL.
   * @param fragment Texto contenido en el SQL buscado
   * @returns Sentencias coincidentes en orden de ejecucion
   */
  findByFragment(fragment: string): ExecutedStatement[] {
    return this.statements.filter((s) => s.sql.includes(fragment))
  }

  private record(sql: string, params?: (string | number | null)[]): void {
    this.statements.push(params ? { sql, params } : { sql })
  }
}

/** Instancia compartida entregada por openDatabaseAsync */
export const sqliteState: { instance: FakeDatabase | null } = { instance: null }

/**
 * Prepara una nueva base falsa para la prueba actual.
 * Debe llamarse en beforeEach ANTES de encolar filas de datos,
 * porque la primera apertura consume la fila de user_version.
 * Por defecto reporta el esquema vigente para saltar la migracion;
 * pasar 3 (o menor) ejercita el bloque de migracion completo.
 * @param userVersion Version PRAGMA que reportara la base
 * @returns La instancia recien creada y registrada
 */
export function initFakeDatabase(userVersion = 5): FakeDatabase {
  const db = new FakeDatabase()
  db.queue([{ user_version: userVersion }])
  sqliteState.instance = db
  return db
}
