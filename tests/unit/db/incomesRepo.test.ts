/**
 * Pruebas unitarias del repositorio de ingresos sobre SQLite simulado.
 */

import { closeDatabase } from '@src/db/base'
import {
  deleteIncome,
  getIncome,
  getIncomes,
  insertIncome,
  replaceIncomes,
  updateIncome
} from '@src/db/incomes'

import { FakeDatabase, initFakeDatabase } from '../../helpers/expoSqliteMock'

/** Fila cruda tipica de la tabla incomes */
function salaryRow(): Record<string, string | number> {
  return {
    id: 'ingreso-1',
    name: 'Salario',
    amount: 500,
    currency: 'USD',
    payday_day: 5,
    created_at: '2026-08-23T10:00:00.000Z',
    updated_at: '2026-08-23T10:00:00.000Z'
  }
}

describe('repositorio de ingresos', () => {
  let base: FakeDatabase

  beforeEach(async () => {
    await closeDatabase()
    base = initFakeDatabase()
  })

  it('lista ingresos mapeando snake_case a camelCase', async () => {
    base.queue([salaryRow()])

    await expect(getIncomes()).resolves.toEqual([
      {
        id: 'ingreso-1',
        name: 'Salario',
        amount: 500,
        currency: 'USD',
        paydayDay: 5,
        createdAt: '2026-08-23T10:00:00.000Z',
        updatedAt: '2026-08-23T10:00:00.000Z'
      }
    ])
  })

  it('obtiene un ingreso por id o null si no existe', async () => {
    base.queue([salaryRow()])
    await expect(getIncome('ingreso-1')).resolves.not.toBeNull()

    base.queue([])
    await expect(getIncome('fantasma')).resolves.toBeNull()
  })

  it('inserta con marca de tiempo y devuelve el objeto creado', async () => {
    const created = await insertIncome(
      { name: '  Ingresos pasivos ', amount: 250.5, currency: 'USDT', paydayDay: 15 },
      'ingreso-nuevo'
    )

    expect(created).toEqual({
      id: 'ingreso-nuevo',
      name: 'Ingresos pasivos',
      amount: 250.5,
      currency: 'USDT',
      paydayDay: 15,
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })

    const insertion = base.findByFragment('INSERT INTO incomes')[0]
    expect(insertion.params).toEqual([
      'ingreso-nuevo',
      'Ingresos pasivos',
      250.5,
      'USDT',
      15,
      expect.any(String),
      expect.any(String)
    ])
  })

  it('edita un ingreso existente y actualiza su marca de tiempo', async () => {
    base.queue([salaryRow()])

    const edited = await updateIncome('ingreso-1', { amount: 600, paydayDay: 1 })

    expect(edited.amount).toBe(600)
    expect(edited.paydayDay).toBe(1)
    expect(edited.name).toBe('Salario')

    const update = base.findByFragment('UPDATE incomes')[0]
    expect(update.params).toEqual(['Salario', 600, 'USD', 1, expect.any(String), 'ingreso-1'])
  })

  it('lanza error al editar un ingreso inexistente', async () => {
    base.queue([])

    await expect(updateIncome('fantasma', { amount: 1 })).rejects.toThrow('does not exist')
  })

  it('elimina por identificador', async () => {
    await deleteIncome('ingreso-1')

    expect(base.findByFragment('DELETE FROM incomes')[0].params).toEqual(['ingreso-1'])
  })

  it('reemplaza el listado completo dentro de una transaccion', async () => {
    base.queue([
      salaryRow(),
      {
        id: 'ingreso-2',
        name: 'Freelance',
        amount: 300,
        currency: 'EUR',
        payday_day: 20,
        created_at: '2026-08-23T10:00:00.000Z',
        updated_at: '2026-08-23T10:00:00.000Z'
      }
    ])

    const saved = await replaceIncomes([
      { name: 'Salario', amount: 500, currency: 'USD', paydayDay: 5 },
      { name: 'Freelance', amount: 300, currency: 'EUR', paydayDay: 20 }
    ])

    expect(saved).toHaveLength(2)

    const sqls = base.statements.map((s) => s.sql)
    const firstIndex = (prefix: string): number => sqls.findIndex((sql) => sql.startsWith(prefix))

    const transactionStart = firstIndex('BEGIN TRANSACTION')
    const deletion = firstIndex('DELETE FROM incomes')
    const firstInsertion = sqls.findIndex((sql) => sql.startsWith('INSERT INTO'))

    expect(transactionStart).toBeGreaterThanOrEqual(0)
    expect(deletion).toBeGreaterThan(transactionStart)
    expect(firstInsertion).toBeGreaterThan(deletion)
    expect(firstIndex('COMMIT')).toBeGreaterThan(firstInsertion)

    const insertions = base.findByFragment('INSERT INTO')
    expect(insertions).toHaveLength(2)
    expect(insertions[0].params?.[0]).toBe('ingreso-1')
    expect(insertions[1].params?.[0]).toBe('ingreso-2')
  })
})
