/**
 * Expense receipts repository over SQLite.
 * Persists and queries monthly fixed expense payments (gastos efectivamente pagados).
 */

import type { BaseCurrency, Currency, Expense, ExpenseReceipt } from '@src/types/domain'

import { openDatabase } from './base'

/** Forma cruda de una fila de la tabla expense_receipts */
interface ExpenseReceiptRow {
  id: string
  expense_id: string
  year_month: string
  amount: number
  currency: string
  base_amount: number
  base_currency: string
  paid_at: string
  created_at: string
  updated_at: string
}

/** Columnas leidas en cada consulta de recibos de gastos */
const COLUMNS =
  'id, expense_id, year_month, amount, currency, base_amount, base_currency, paid_at, created_at, updated_at'

/**
 * Convierte una fila cruda de SQLite al objeto ExpenseReceipt del dominio.
 * @param row Fila leida desde SQLite
 * @returns Recibo de gasto tipado del dominio
 */
function mapRowToExpenseReceipt(row: ExpenseReceiptRow): ExpenseReceipt {
  return {
    id: row.id,
    expenseId: row.expense_id,
    yearMonth: row.year_month,
    amount: row.amount,
    currency: row.currency as Currency,
    baseAmount: row.base_amount,
    baseCurrency: row.base_currency as BaseCurrency,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** Marca de tiempo actual en ISO */
function nowISO(): string {
  return new Date().toISOString()
}

/**
 * Lista todos los recibos de gasto registrados para un mes especifico.
 * @param yearMonth Mes en formato YYYY-MM
 * @returns Arreglo de comprobantes de pago del mes
 */
export async function getExpenseReceipts(yearMonth: string): Promise<ExpenseReceipt[]> {
  const db = await openDatabase()
  const rows = await db.getAllAsync<ExpenseReceiptRow>(
    `SELECT ${COLUMNS} FROM expense_receipts WHERE year_month = ? ORDER BY paid_at DESC`,
    [yearMonth]
  )
  return rows.map(mapRowToExpenseReceipt)
}

/**
 * Lista el historial completo de recibos de un gasto fijo particular.
 * @param expenseId Identificador del gasto
 * @returns Arreglo de comprobantes ordenados por mes descendente
 */
export async function getExpenseReceiptsByExpense(expenseId: string): Promise<ExpenseReceipt[]> {
  const db = await openDatabase()
  const rows = await db.getAllAsync<ExpenseReceiptRow>(
    `SELECT ${COLUMNS} FROM expense_receipts WHERE expense_id = ? ORDER BY year_month DESC`,
    [expenseId]
  )
  return rows.map(mapRowToExpenseReceipt)
}

/**
 * Obtiene el recibo de un gasto para un mes determinado si fue pagado.
 * @param expenseId Identificador del gasto
 * @param yearMonth Mes en formato YYYY-MM
 * @returns El recibo encontrado o null si no se ha pagado en ese mes
 */
export async function getExpenseReceipt(
  expenseId: string,
  yearMonth: string
): Promise<ExpenseReceipt | null> {
  const db = await openDatabase()
  const row = await db.getFirstAsync<ExpenseReceiptRow>(
    `SELECT ${COLUMNS} FROM expense_receipts WHERE expense_id = ? AND year_month = ?`,
    [expenseId, yearMonth]
  )
  return row ? mapRowToExpenseReceipt(row) : null
}

/**
 * Registra o actualiza el pago de un gasto fijo para un mes determinado.
 * @param expense Gasto fijo confirmado
 * @param yearMonth Mes en formato YYYY-MM al que corresponde el pago
 * @param baseAmount Monto equivalente en moneda base congelado al momento del pago
 * @param baseCurrency Moneda base activa al registrar el pago
 * @param id Identificador unico para el comprobante
 * @returns El comprobante persistido
 */
export async function confirmExpenseReceipt(
  expense: Expense,
  yearMonth: string,
  baseAmount: number,
  baseCurrency: BaseCurrency,
  id: string
): Promise<ExpenseReceipt> {
  const db = await openDatabase()
  const timestamp = nowISO()

  const receipt: ExpenseReceipt = {
    id,
    expenseId: expense.id,
    yearMonth,
    amount: expense.amount,
    currency: expense.currency,
    baseAmount,
    baseCurrency,
    paidAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO expense_receipts (
      id, expense_id, year_month, amount, currency, base_amount, base_currency, paid_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      receipt.id,
      receipt.expenseId,
      receipt.yearMonth,
      receipt.amount,
      receipt.currency,
      receipt.baseAmount,
      receipt.baseCurrency,
      receipt.paidAt,
      receipt.createdAt,
      receipt.updatedAt
    ]
  )

  return receipt
}

/**
 * Elimina el comprobante de pago de un gasto fijo para un mes dado (revertir pago).
 * @param expenseId Identificador del gasto
 * @param yearMonth Mes en formato YYYY-MM
 */
export async function deleteExpenseReceipt(expenseId: string, yearMonth: string): Promise<void> {
  const db = await openDatabase()
  await db.runAsync('DELETE FROM expense_receipts WHERE expense_id = ? AND year_month = ?', [
    expenseId,
    yearMonth
  ])
}
