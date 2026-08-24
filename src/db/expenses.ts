/**
 * Expenses repository over SQLite.
 * Translates between snake_case database rows
 * and the Expense domain objects (camelCase).
 */

import type { Currency, Expense, ExpenseInput, ExpenseType, Recurrence } from '@src/types/domain'

import { openDatabase } from './base'

/** Forma cruda de una fila de la tabla expenses */
interface ExpenseRow {
  id: string
  name: string
  amount: number
  currency: string
  type: string
  category: string | null
  note: string | null
  recurrence: string | null
  next_due_date: string | null
  active: number
  created_at: string
  updated_at: string
}

/** Columnas leidas en cada consulta de listado */
const COLUMNS =
  'id, name, amount, currency, type, category, note, recurrence, next_due_date, active, created_at, updated_at'

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
    type: row.type as ExpenseType,
    category: row.category ?? undefined,
    note: row.note ?? undefined,
    recurrence: (row.recurrence as Recurrence | null) ?? undefined,
    nextDueDate: row.next_due_date ?? undefined,
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
  const ahora = new Date().toISOString()

  await db.runAsync(
    `INSERT INTO expenses (
       id, name, amount, currency, type, category, note,
       recurrence, next_due_date, active, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      input.name,
      input.amount,
      input.currency,
      input.type,
      input.category ?? null,
      input.note ?? null,
      input.recurrence ?? null,
      input.nextDueDate ?? null,
      ahora,
      ahora
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
       name = ?, amount = ?, currency = ?, type = ?, category = ?, note = ?,
       recurrence = ?, next_due_date = ?, active = ?, updated_at = ?
     WHERE id = ?`,
    [
      combinado.name,
      combinado.amount,
      combinado.currency,
      combinado.type,
      combinado.category ?? null,
      combinado.note ?? null,
      combinado.recurrence ?? null,
      combinado.nextDueDate ?? null,
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
