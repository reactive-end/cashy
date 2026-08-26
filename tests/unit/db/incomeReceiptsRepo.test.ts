/**
 * Pruebas unitarias del repositorio de recibos de ingreso sobre SQLite simulado.
 */

import { closeDatabase } from '@src/db/base'
import {
  confirmIncomeReceipt,
  deleteIncomeReceipt,
  formatYearMonth,
  getIncomeReceipts,
  getPendingIncomeConfirmations
} from '@src/db/incomeReceipts'
import type { Income } from '@src/types/domain'

import { FakeDatabase, initFakeDatabase } from '../../helpers/expoSqliteMock'

/** Fila cruda tipica de la tabla income_receipts */
function sampleReceiptRow(): Record<string, string | number> {
  return {
    id: 'recibo-1',
    income_id: 'ingreso-1',
    year_month: '2026-08',
    amount: 500,
    currency: 'USD',
    confirmed_at: '2026-08-05T10:00:00.000Z',
    created_at: '2026-08-05T10:00:00.000Z',
    updated_at: '2026-08-05T10:00:00.000Z'
  }
}

const sampleIncome: Income = {
  id: 'ingreso-1',
  name: 'Salario',
  amount: 500,
  currency: 'USD',
  paydayDay: 5,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z'
}

describe('repositorio de recibos de ingresos', () => {
  let base: FakeDatabase

  beforeEach(async () => {
    await closeDatabase()
    base = initFakeDatabase()
  })

  it('formatea ano y mes en formato YYYY-MM', () => {
    expect(formatYearMonth(new Date('2026-08-26'))).toBe('2026-08')
    expect(formatYearMonth(new Date('2026-01-05'))).toBe('2026-01')
  })

  it('lista recibos de un mes especifico mapeando snake_case a camelCase', async () => {
    base.queue([sampleReceiptRow()])

    const receipts = await getIncomeReceipts('2026-08')

    expect(receipts).toEqual([
      {
        id: 'recibo-1',
        incomeId: 'ingreso-1',
        yearMonth: '2026-08',
        amount: 500,
        currency: 'USD',
        confirmedAt: '2026-08-05T10:00:00.000Z',
        createdAt: '2026-08-05T10:00:00.000Z',
        updatedAt: '2026-08-05T10:00:00.000Z'
      }
    ])
  })

  it('confirma e inserta un recibo de cobro con marca de tiempo', async () => {
    const receipt = await confirmIncomeReceipt(sampleIncome, '2026-08', 'recibo-123')

    expect(receipt).toEqual({
      id: 'recibo-123',
      incomeId: 'ingreso-1',
      yearMonth: '2026-08',
      amount: 500,
      currency: 'USD',
      confirmedAt: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })

    const insertion = base.findByFragment('INSERT OR REPLACE INTO income_receipts')[0]
    expect(insertion.params).toEqual([
      'recibo-123',
      'ingreso-1',
      '2026-08',
      500,
      'USD',
      expect.any(String),
      expect.any(String),
      expect.any(String)
    ])
  })

  it('elimina un recibo de cobro por ingreso y mes', async () => {
    await deleteIncomeReceipt('ingreso-1', '2026-08')

    const deletion = base.findByFragment('DELETE FROM income_receipts')[0]
    expect(deletion.params).toEqual(['ingreso-1', '2026-08'])
  })

  it('obtiene cobros pendientes comparando ingresos y recibos del mes', async () => {
    // Incomes list
    base.queue([
      {
        id: 'ingreso-1',
        name: 'Salario',
        amount: 500,
        currency: 'USD',
        payday_day: 5,
        created_at: '2026-08-01T00:00:00.000Z',
        updated_at: '2026-08-01T00:00:00.000Z'
      },
      {
        id: 'ingreso-2',
        name: 'Freelance',
        amount: 200,
        currency: 'USD',
        payday_day: 25,
        created_at: '2026-08-01T00:00:00.000Z',
        updated_at: '2026-08-01T00:00:00.000Z'
      }
    ])
    // Receipts list: ingreso-1 ya confirmado
    base.queue([sampleReceiptRow()])

    // Si hoy es dia 26, ingreso-2 esta vencido (dia 25) y sin recibo
    const pending = await getPendingIncomeConfirmations('2026-08', 26)

    expect(pending).toHaveLength(1)
    expect(pending[0].id).toBe('ingreso-2')
  })
})
