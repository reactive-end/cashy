/**
 * Pruebas unitarias del repositorio de recibos de pago de gastos fijos sobre SQLite simulado.
 */

import { closeDatabase } from '@src/db/base'
import {
  confirmExpenseReceipt,
  deleteExpenseReceipt,
  getExpenseReceipt,
  getExpenseReceipts,
  getExpenseReceiptsByExpense
} from '@src/db/expenseReceipts'
import type { Expense } from '@src/types/domain'

import { FakeDatabase, initFakeDatabase } from '../../helpers/expoSqliteMock'
import { buildFixedExpense } from '../../helpers/factories'

/** Fila cruda tipica de la tabla expense_receipts */
function sampleExpenseReceiptRow(): Record<string, string | number> {
  return {
    id: 'recibo-gasto-1',
    expense_id: 'gasto-1',
    year_month: '2026-08',
    amount: 35,
    currency: 'USD',
    base_amount: 35,
    base_currency: 'USD',
    paid_at: '2026-08-05T10:00:00.000Z',
    created_at: '2026-08-05T10:00:00.000Z',
    updated_at: '2026-08-05T10:00:00.000Z'
  }
}

const sampleExpense: Expense = buildFixedExpense({
  id: 'gasto-1',
  amount: 35,
  currency: 'USD'
})

describe('repositorio de comprobantes de gastos fijos', () => {
  let base: FakeDatabase

  beforeEach(async () => {
    await closeDatabase()
    base = initFakeDatabase()
  })

  it('lista comprobantes de un mes mapeando snake_case a camelCase', async () => {
    base.queue([sampleExpenseReceiptRow()])

    const receipts = await getExpenseReceipts('2026-08')

    expect(receipts).toEqual([
      {
        id: 'recibo-gasto-1',
        expenseId: 'gasto-1',
        yearMonth: '2026-08',
        amount: 35,
        currency: 'USD',
        baseAmount: 35,
        baseCurrency: 'USD',
        paidAt: '2026-08-05T10:00:00.000Z',
        createdAt: '2026-08-05T10:00:00.000Z',
        updatedAt: '2026-08-05T10:00:00.000Z'
      }
    ])
  })

  it('lista el historial de comprobantes de un gasto especifico', async () => {
    base.queue([sampleExpenseReceiptRow()])

    const receipts = await getExpenseReceiptsByExpense('gasto-1')

    expect(receipts).toHaveLength(1)
    expect(receipts[0].expenseId).toBe('gasto-1')
  })

  it('obtiene un comprobante individual por gasto y mes o null si no existe', async () => {
    base.queue([sampleExpenseReceiptRow()])

    const receipt = await getExpenseReceipt('gasto-1', '2026-08')
    expect(receipt).not.toBeNull()
    expect(receipt?.id).toBe('recibo-gasto-1')

    base.queue([])
    const missing = await getExpenseReceipt('gasto-1', '2026-09')
    expect(missing).toBeNull()
  })

  it('confirma e inserta un recibo de pago congelando moneda base', async () => {
    const receipt = await confirmExpenseReceipt(
      sampleExpense,
      '2026-08',
      35,
      'USD',
      'recibo-nuevo-1'
    )

    expect(receipt).toEqual({
      id: 'recibo-nuevo-1',
      expenseId: 'gasto-1',
      yearMonth: '2026-08',
      amount: 35,
      currency: 'USD',
      baseAmount: 35,
      baseCurrency: 'USD',
      paidAt: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })

    const insertion = base.findByFragment('INSERT OR REPLACE INTO expense_receipts')[0]
    expect(insertion.params).toEqual([
      'recibo-nuevo-1',
      'gasto-1',
      '2026-08',
      35,
      'USD',
      35,
      'USD',
      expect.any(String),
      expect.any(String),
      expect.any(String)
    ])
  })

  it('elimina un recibo de pago por gasto y mes', async () => {
    await deleteExpenseReceipt('gasto-1', '2026-08')

    const deletion = base.findByFragment('DELETE FROM expense_receipts')[0]
    expect(deletion.params).toEqual(['gasto-1', '2026-08'])
  })
})
