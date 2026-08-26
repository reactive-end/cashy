/**
 * Income receipts repository over SQLite.
 * Persists and queries monthly payday confirmations (ingresos efectivamente cobrados).
 */

import type { Currency, Income, IncomeReceipt } from '@src/types/domain'

import { openDatabase } from './base'
import { getIncomes } from './incomes'

/** Forma cruda de una fila de la tabla income_receipts */
interface IncomeReceiptRow {
  id: string
  income_id: string
  year_month: string
  amount: number
  currency: string
  confirmed_at: string
  created_at: string
  updated_at: string
}

/** Columnas leidas en cada consulta de recibos */
const COLUMNS = 'id, income_id, year_month, amount, currency, confirmed_at, created_at, updated_at'

/**
 * Convierte una fila cruda de SQLite al objeto IncomeReceipt del dominio.
 * @param row Fila leida desde SQLite
 * @returns Recibo tipado del dominio
 */
function mapRowToReceipt(row: IncomeReceiptRow): IncomeReceipt {
  return {
    id: row.id,
    incomeId: row.income_id,
    yearMonth: row.year_month,
    amount: row.amount,
    currency: row.currency as Currency,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** Marca de tiempo actual en ISO */
function nowISO(): string {
  return new Date().toISOString()
}

/**
 * Obtiene el formato YYYY-MM para un objeto Date dado o la fecha actual.
 * @param date Fecha base (por defecto hoy)
 * @returns Cadena YYYY-MM
 */
export function formatYearMonth(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Lista todos los recibos de ingreso confirmados para un mes dado.
 * @param yearMonth Mes en formato YYYY-MM
 * @returns Arreglo de recibos de ingresos confirmados
 */
export async function getIncomeReceipts(yearMonth: string): Promise<IncomeReceipt[]> {
  const db = await openDatabase()
  const rows = await db.getAllAsync<IncomeReceiptRow>(
    `SELECT ${COLUMNS} FROM income_receipts WHERE year_month = ? ORDER BY confirmed_at ASC`,
    [yearMonth]
  )
  return rows.map(mapRowToReceipt)
}

/**
 * Registra la confirmacion de cobro de un ingreso para un mes determinado.
 * Si ya existia, reemplaza o devuelve el existente.
 * @param income Ingreso confirmado
 * @param yearMonth Mes en formato YYYY-MM
 * @param id Identificador unico para el recibo
 * @returns El recibo de ingreso guardado
 */
export async function confirmIncomeReceipt(
  income: Income,
  yearMonth: string,
  id: string
): Promise<IncomeReceipt> {
  const db = await openDatabase()
  const timestamp = nowISO()

  const receipt: IncomeReceipt = {
    id,
    incomeId: income.id,
    yearMonth,
    amount: income.amount,
    currency: income.currency,
    confirmedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO income_receipts (
      id, income_id, year_month, amount, currency, confirmed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      receipt.id,
      receipt.incomeId,
      receipt.yearMonth,
      receipt.amount,
      receipt.currency,
      receipt.confirmedAt,
      receipt.createdAt,
      receipt.updatedAt
    ]
  )

  return receipt
}

/**
 * Elimina la confirmacion de cobro de un ingreso para un mes determinado.
 * @param incomeId Identificador del ingreso
 * @param yearMonth Mes en formato YYYY-MM
 */
export async function deleteIncomeReceipt(incomeId: string, yearMonth: string): Promise<void> {
  const db = await openDatabase()
  await db.runAsync('DELETE FROM income_receipts WHERE income_id = ? AND year_month = ?', [
    incomeId,
    yearMonth
  ])
}

/**
 * Obtiene los ingresos que ya vencieron en el mes y aun no han sido confirmados.
 * @param yearMonth Mes en formato YYYY-MM
 * @param currentDay Dia actual del mes (1-31)
 * @returns Lista de ingresos pendientes por confirmar
 */
export async function getPendingIncomeConfirmations(
  yearMonth: string,
  currentDay: number = new Date().getDate()
): Promise<Income[]> {
  const [allIncomes, confirmedReceipts] = await Promise.all([
    getIncomes(),
    getIncomeReceipts(yearMonth)
  ])

  const confirmedIncomeIds = new Set(confirmedReceipts.map((receipt) => receipt.incomeId))

  return allIncomes.filter(
    (income) => income.paydayDay <= currentDay && !confirmedIncomeIds.has(income.id)
  )
}
