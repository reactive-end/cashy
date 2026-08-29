/**
 * Incomes repository over SQLite.
 * CRUD for user income sources (Salario, Ingresos pasivos, ...)
 * translating snake_case rows to camelCase domain objects.
 */

import type {
  BaseCurrency,
  Currency,
  ExpenseType,
  Income,
  IncomeInput,
  Recurrence
} from '@src/types/domain'

import { openDatabase } from './base'

/** Forma cruda de una fila de la tabla incomes */
interface IncomeRow {
  id: string
  name: string
  amount: number
  currency: string
  base_amount: number | null
  base_currency: string | null
  type: string | null
  recurrence: string | null
  payday_day: number
  created_at: string
  updated_at: string
}

/** Columnas leidas en cada consulta de listado */
const COLUMNS =
  'id, name, amount, currency, base_amount, base_currency, type, recurrence, payday_day, created_at, updated_at'

/**
 * Convierte una fila cruda al objeto de dominio.
 * @param row Fila leida desde SQLite
 * @returns Income tipado del dominio
 */
function mapRowToIncome(row: IncomeRow): Income {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    currency: row.currency as Currency,
    baseAmount: row.base_amount ?? undefined,
    baseCurrency: (row.base_currency as BaseCurrency | null) ?? undefined,
    type: (row.type as ExpenseType | null) ?? 'fixed',
    recurrence: (row.recurrence as Recurrence | null) ?? undefined,
    paydayDay: row.payday_day,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * Lista todos los ingresos ordenados por dia de cobro y nombre.
 * @returns Arreglo completo de ingresos guardados
 */
export async function getIncomes(): Promise<Income[]> {
  const db = await openDatabase()
  const rows = await db.getAllAsync<IncomeRow>(
    `SELECT ${COLUMNS} FROM incomes ORDER BY payday_day ASC, name ASC`
  )
  return rows.map(mapRowToIncome)
}

/**
 * Obtiene un ingreso por su identificador.
 * @param id Identificador unico del ingreso
 * @returns El ingreso encontrado o null si no existe
 */
export async function getIncome(id: string): Promise<Income | null> {
  const db = await openDatabase()
  const row = await db.getFirstAsync<IncomeRow>(`SELECT ${COLUMNS} FROM incomes WHERE id = ?`, [id])
  return row ? mapRowToIncome(row) : null
}

/** Marca de tiempo actual en ISO */
function nowISO(): string {
  return new Date().toISOString()
}

/**
 * Inserta un ingreso nuevo con marca de tiempo automatica.
 * @param input Datos validados del formulario
 * @param id Identificador unico generado por el llamador
 * @returns El ingreso creado con sus marcas de tiempo
 */
export async function insertIncome(input: IncomeInput, id: string): Promise<Income> {
  const db = await openDatabase()
  const timestamp = nowISO()
  const type: ExpenseType = input.type ?? 'fixed'
  const recurrence: Recurrence | undefined =
    input.recurrence ?? (type === 'unique' ? undefined : 'monthly')
  const paydayDay = input.paydayDay ?? new Date().getDate()

  const created: Income = {
    id,
    name: input.name.trim(),
    amount: input.amount,
    currency: input.currency,
    baseAmount: input.baseAmount,
    baseCurrency: input.baseCurrency,
    type,
    recurrence,
    paydayDay,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  await db.runAsync(
    `INSERT INTO incomes (
       id, name, amount, currency, base_amount, base_currency, type, recurrence, payday_day, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      created.id,
      created.name,
      created.amount,
      created.currency,
      created.baseAmount ?? null,
      created.baseCurrency ?? null,
      created.type,
      created.recurrence ?? null,
      created.paydayDay,
      timestamp,
      timestamp
    ]
  )

  return created
}

/**
 * Actualiza los campos editables de un ingreso existente.
 * @param id Identificador del ingreso a modificar
 * @param changes Cambios parciales ya validados
 * @returns El ingreso resultante tras la edicion
 */
export async function updateIncome(id: string, changes: Partial<IncomeInput>): Promise<Income> {
  const db = await openDatabase()
  const existing = await getIncome(id)

  if (!existing) throw new Error(`Income ${id} does not exist`)

  const edited: Income = {
    ...existing,
    ...changes,
    name: (changes.name ?? existing.name).trim(),
    updatedAt: nowISO()
  }

  await db.runAsync(
    `UPDATE incomes SET
       name = ?, amount = ?, currency = ?, base_amount = ?, base_currency = ?,
       type = ?, recurrence = ?, payday_day = ?, updated_at = ?
     WHERE id = ?`,
    [
      edited.name,
      edited.amount,
      edited.currency,
      edited.baseAmount ?? null,
      edited.baseCurrency ?? null,
      edited.type,
      edited.recurrence ?? null,
      edited.paydayDay,
      edited.updatedAt,
      id
    ]
  )

  return edited
}

/**
 * Elimina un ingreso por su identificador.
 * @param id Identificador del ingreso a borrar
 */
export async function deleteIncome(id: string): Promise<void> {
  const db = await openDatabase()
  await db.runAsync('DELETE FROM incomes WHERE id = ?', [id])
}

/**
 * Reemplaza la tabla completa de ingresos en una transaccion.
 * Usado por el onboarding para persistir el listado capturado.
 * @param inputs Listado final validado de ingresos del usuario
 * @returns Los ingresos persistidos con identificadores nuevos
 */
export async function replaceIncomes(inputs: readonly IncomeInput[]): Promise<Income[]> {
  const db = await openDatabase()
  const timestamp = nowISO()

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM incomes')

    for (let index = 0; index < inputs.length; index += 1) {
      const input = inputs[index]
      const id = `ingreso-${index + 1}`
      const type: ExpenseType = input.type ?? 'fixed'
      const recurrence: Recurrence | null =
        input.recurrence ?? (type === 'unique' ? null : 'monthly')
      const paydayDay = input.paydayDay ?? new Date().getDate()

      await db.runAsync(
        `INSERT INTO incomes (
           id, name, amount, currency, base_amount, base_currency, type, recurrence, payday_day, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name.trim(),
          input.amount,
          input.currency,
          input.baseAmount ?? null,
          input.baseCurrency ?? null,
          type,
          recurrence,
          paydayDay,
          timestamp,
          timestamp
        ]
      )
    }
  })

  return getIncomes()
}
