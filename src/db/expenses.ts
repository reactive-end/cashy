/**
 * Expenses repository over SQLite.
 * Translates between snake_case database rows
 * and the Expense domain objects (camelCase).
 */

import type {
  BaseCurrency,
  Currency,
  Expense,
  ExpenseInput,
  ExpenseType,
  Recurrence
} from '@src/types/domain'

import { openDatabase } from './base'

/** Forma cruda de una fila de la tabla expenses */
interface ExpenseRow {
  id: string
  name: string
  amount: number
  currency: string
  base_amount: number | null
  base_currency: string | null
  type: string
  category: string | null
  note: string | null
  recurrence: string | null
  next_due_date: string | null
  due_day: number | null
  active: number
  created_at: string
  updated_at: string
}

/** Columnas leidas en cada consulta de listado */
const COLUMNS =
  'id, name, amount, currency, base_amount, base_currency, type, category, note, recurrence, next_due_date, due_day, active, created_at, updated_at'

/**
 * Convierte una fila cruda al objeto de dominio.
 * @param row Fila leida desde SQLite
 * @returns Expense tipado del dominio
 */
function mapRowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    currency: row.currency as Currency,
    baseAmount: row.base_amount ?? undefined,
    baseCurrency: (row.base_currency as BaseCurrency | null) ?? undefined,
    type: row.type as ExpenseType,
    category: row.category ?? undefined,
    note: row.note ?? undefined,
    recurrence: (row.recurrence as Recurrence | null) ?? undefined,
    nextDueDate: row.next_due_date ?? undefined,
    dueDay: row.due_day ?? undefined,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * Lista todos los gastos ordenados por fecha de creacion descendente.
 * @returns Arreglo completo de gastos guardados
 */
export async function getExpenses(): Promise<Expense[]> {
  const db = await openDatabase()
  const rows = await db.getAllAsync<ExpenseRow>(
    `SELECT ${COLUMNS} FROM expenses ORDER BY created_at DESC`
  )
  return rows.map(mapRowToExpense)
}

/**
 * Parametros de filtrado, busqueda y ordenamiento para consultas paginadas nativas.
 */
export interface ExpenseQueryParams {
  /** Tipo de gasto a filtrar: fijo o unico */
  type?: ExpenseType
  /** Categoria unica o listado de categorias */
  category?: string
  categories?: readonly string[]
  /** Moneda unica o listado de monedas */
  currency?: Currency
  currencies?: readonly Currency[]
  /** Termino de busqueda por nombre o categoria */
  search?: string
  /** Cantidad maxima de filas a devolver */
  limit?: number
  /** Desplazamiento para paginacion */
  offset?: number
  /** Criterio de ordenacion */
  sort?: 'recent' | 'oldest' | 'amountDesc' | 'amountAsc' | 'nameAsc' | 'nameDesc'
}

/** Resultado paginado con las filas y el total absoluto coincidente */
export interface PaginatedExpensesResult {
  expenses: Expense[]
  totalCount: number
}

/**
 * Ejecuta una consulta nativa en SQLite con filtros WHERE, ordenamiento y paginacion.
 * @param params Criterios de filtrado y limites
 * @returns Gastos de la pagina y total global de coincidencias
 */
export async function queryExpensesPaginated(
  params: ExpenseQueryParams = {}
): Promise<PaginatedExpensesResult> {
  const db = await openDatabase()
  const clauses: string[] = ['1=1']
  const sqlParams: (string | number)[] = []

  if (params.type) {
    clauses.push('type = ?')
    sqlParams.push(params.type)
  }

  if (params.category) {
    clauses.push('category = ?')
    sqlParams.push(params.category)
  } else if (params.categories && params.categories.length > 0) {
    const placeholders = params.categories.map(() => '?').join(', ')
    clauses.push(`category IN (${placeholders})`)
    sqlParams.push(...params.categories)
  }

  if (params.currency) {
    clauses.push('currency = ?')
    sqlParams.push(params.currency)
  } else if (params.currencies && params.currencies.length > 0) {
    const placeholders = params.currencies.map(() => '?').join(', ')
    clauses.push(`currency IN (${placeholders})`)
    sqlParams.push(...params.currencies)
  }

  if (params.search && params.search.trim()) {
    const term = `%${params.search.trim().toLowerCase()}%`
    clauses.push("(LOWER(name) LIKE ? OR LOWER(COALESCE(category, '')) LIKE ?)")
    sqlParams.push(term, term)
  }

  const whereClause = clauses.join(' AND ')

  let orderBy = 'created_at DESC'
  switch (params.sort) {
    case 'oldest':
      orderBy = 'created_at ASC'
      break
    case 'amountDesc':
      orderBy = 'amount DESC'
      break
    case 'amountAsc':
      orderBy = 'amount ASC'
      break
    case 'nameAsc':
      orderBy = 'name ASC'
      break
    case 'nameDesc':
      orderBy = 'name DESC'
      break
    case 'recent':
    default:
      orderBy = 'created_at DESC'
      break
  }

  const countRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM expenses WHERE ${whereClause}`,
    sqlParams
  )
  const totalCount = countRow?.count ?? 0

  let querySql = `SELECT ${COLUMNS} FROM expenses WHERE ${whereClause} ORDER BY ${orderBy}`
  const queryParams = [...sqlParams]

  if (params.limit !== undefined) {
    querySql += ' LIMIT ?'
    queryParams.push(params.limit)
    if (params.offset !== undefined) {
      querySql += ' OFFSET ?'
      queryParams.push(params.offset)
    }
  }

  const rows = await db.getAllAsync<ExpenseRow>(querySql, queryParams)
  return {
    expenses: rows.map(mapRowToExpense),
    totalCount
  }
}

/**
 * Obtiene un gasto por su identificador.
 * @param id Identificador unico del gasto
 * @returns El gasto encontrado o null si no existe
 */
export async function getExpense(id: string): Promise<Expense | null> {
  const db = await openDatabase()
  const row = await db.getFirstAsync<ExpenseRow>(`SELECT ${COLUMNS} FROM expenses WHERE id = ?`, [
    id
  ])
  return row ? mapRowToExpense(row) : null
}

/**
 * Inserta un gasto nuevo con marca de tiempo automatica.
 * @param input Datos validados del formulario
 * @param id Identificador pregenerado para el registro
 * @returns El gasto tal como quedo almacenado
 */
export async function insertExpense(input: ExpenseInput, id: string): Promise<Expense> {
  const db = await openDatabase()
  const timestamp = new Date().toISOString()

  await db.runAsync(
    `INSERT INTO expenses (
       id, name, amount, currency, base_amount, base_currency, type, category, note,
       recurrence, next_due_date, due_day, active, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      input.name,
      input.amount,
      input.currency,
      input.baseAmount ?? null,
      input.baseCurrency ?? null,
      input.type,
      input.category ?? null,
      input.note ?? null,
      input.recurrence ?? null,
      input.nextDueDate ?? null,
      input.dueDay ?? null,
      timestamp,
      timestamp
    ]
  )

  const creado = await getExpense(id)
  if (!creado) throw new Error('El gasto no pudo guardarse')
  return creado
}

/**
 * Actualiza los campos editables de un gasto existente.
 * @param id Identificador del gasto a modificar
 * @param changes Campos nuevos; los ausentes conservan su valor
 * @returns El gasto actualizado
 * @throws Error si el identificador no existe
 */
export async function updateExpense(id: string, changes: Partial<ExpenseInput>): Promise<Expense> {
  const [db, actual] = await Promise.all([openDatabase(), getExpense(id)])
  if (!actual) throw new Error('El gasto no existe')

  const combinado: Expense = {
    ...actual,
    ...changes,
    updatedAt: new Date().toISOString()
  }

  await db.runAsync(
    `UPDATE expenses SET
       name = ?, amount = ?, currency = ?, base_amount = ?, base_currency = ?,
       type = ?, category = ?, note = ?, recurrence = ?, next_due_date = ?,
       due_day = ?, active = ?, updated_at = ?
     WHERE id = ?`,
    [
      combinado.name,
      combinado.amount,
      combinado.currency,
      combinado.baseAmount ?? null,
      combinado.baseCurrency ?? null,
      combinado.type,
      combinado.category ?? null,
      combinado.note ?? null,
      combinado.recurrence ?? null,
      combinado.nextDueDate ?? null,
      combinado.dueDay ?? null,
      combinado.active ? 1 : 0,
      combinado.updatedAt,
      id
    ]
  )

  return combinado
}

/**
 * Elimina fisicamente un gasto de la base de datos.
 * @param id Identificador del gasto a eliminar
 */
export async function deleteExpense(id: string): Promise<void> {
  const db = await openDatabase()
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id])
}
