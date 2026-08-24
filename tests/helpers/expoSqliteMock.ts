/**
 * Mock del modulo expo-sqlite respaldado por una base en memoria.
 * Registra cada sentencia ejecutada y sirve resultados encolados,
 * permitiendo probar repositorios y migraciones sin modulo nativo.
 */

/** Sentencia capturada con sus parametros */
export interface SentenciaEjecutada {
  sql: string
  params?: (string | number | null)[]
}

/** Fila generica devuelta por las consultas simuladas */
export type FilaSimulada = Record<string, string | number | null>

/**
 * Base de datos falsa con la superficie usada por los repositorios.
 * Los resultados se consumen en el orden en que se encolan.
 * No implementa SQLiteDatabase literalmente: el modulo entero se mockea.
 */
export class FakeDatabase {
  /** Historial completo de sentencias ejecutadas */
  sentencias: SentenciaEjecutada[] = []

  private colaFilas: FilaSimulada[][] = []

  /**
   * Encola filas que consumiran las siguientes consultas de lectura.
   * @param filas Filas a servir en orden FIFO
   */
  encolar(filas: FilaSimulada[]): void {
    this.colaFilas.push(filas)
  }

  async execAsync(sql: string): Promise<void> {
    this.registrar(sql)
  }

  async runAsync(sql: string, params?: (string | number | null)[]): Promise<void> {
    this.registrar(sql, params)
  }

  async getFirstAsync<T>(sql: string, params?: (string | number | null)[]): Promise<T | null> {
    this.registrar(sql, params)
    const grupo = this.colaFilas.shift()
    return (grupo?.[0] as T) ?? null
  }

  async getAllAsync<T>(sql: string, params?: (string | number | null)[]): Promise<T[]> {
    this.registrar(sql, params)
    const grupo = this.colaFilas.shift()
    return (grupo ?? []) as T[]
  }

  async closeAsync(): Promise<void> {
    this.instanciaCerrada = true
  }

  /** Marca dejada al cerrar; util para verificar liberacion */
  instanciaCerrada = false

  /**
   * Filtra el historial por un fragmento de SQL.
   * @param fragmento Texto contenido en el SQL buscado
   * @returns Sentencias coincidentes en orden de ejecucion
   */
  buscar(fragmento: string): SentenciaEjecutada[] {
    return this.sentencias.filter((s) => s.sql.includes(fragmento))
  }

  private registrar(sql: string, params?: (string | number | null)[]): void {
    this.sentencias.push(params ? { sql, params } : { sql })
  }
}

/** Instancia compartida entregada por openDatabaseAsync */
export const estadoSQLite: { instancia: FakeDatabase | null } = { instancia: null }

/**
 * Prepara una nueva base falsa para la prueba actual.
 * Debe llamarse en beforeEach ANTES de encolar filas de datos,
 * porque la primera apertura consume la fila de user_version.
 * @param userVersion Version PRAGMA que reportara la base
 * @returns La instancia recien creada y registrada
 */
export function iniciarBaseFalsa(userVersion = 3): FakeDatabase {
  const base = new FakeDatabase()
  base.encolar([{ user_version: userVersion }])
  estadoSQLite.instancia = base
  return base
}
