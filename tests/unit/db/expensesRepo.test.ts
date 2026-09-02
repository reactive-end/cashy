/**
 * Pruebas unitarias del repositorio de gastos sobre SQLite simulado.
 * Verifican el SQL emitido, el orden de parametros y el mapeo a dominio.
 */

import { closeDatabase } from '@src/db/base'
import {
  deleteExpense,
  getExpense,
  getExpenses,
  insertExpense,
  queryExpensesPaginated,
  updateExpense
} from '@src/db/expenses'

import { FakeDatabase, initFakeDatabase } from '../../helpers/expoSqliteMock'
import { buildExpenseInput, buildFixedExpense } from '../../helpers/factories'

/** Fila cruda snake_case equivalente al gasto fijo de fabrica */
const FIXED_ROW = {
  id: 'gasto-fijo-1',
  name: 'Netflix',
  amount: 9.99,
  currency: 'USD',
  base_amount: 9.99,
  base_currency: 'USD',
  type: 'fixed',
  category: 'Suscripciones',
  note: null,
  recurrence: 'monthly',
  next_due_date: '2026-09-01',
  active: 1,
  created_at: '2026-08-23T10:00:00.000Z',
  updated_at: '2026-08-23T10:00:00.000Z'
}

describe('repositorio de gastos', () => {
  let base: FakeDatabase

  beforeEach(async () => {
    // El singleton de conexion vive en src/db/base; hay que liberarlo
    // para que cada prueba abra la instancia falsa recien creada.
    await closeDatabase()
    base = initFakeDatabase()
  })

  describe('getExpenses', () => {
    it('consulta ordenada por creacion y mapea snake_case a dominio', async () => {
      const secondRow = { ...FIXED_ROW, id: 'gasto-segundo', name: 'Spotify' }
      base.queue([secondRow, FIXED_ROW])

      const expenses = await getExpenses()

      expect(base.findByFragment('SELECT')[0].sql).toContain('ORDER BY created_at DESC')
      expect(expenses).toHaveLength(2)
      expect(expenses[1]).toMatchObject({
        id: 'gasto-fijo-1',
        name: 'Netflix',
        amount: 9.99,
        currency: 'USD',
        type: 'fixed',
        category: 'Suscripciones',
        note: undefined,
        recurrence: 'monthly',
        nextDueDate: '2026-09-01',
        active: true,
        createdAt: '2026-08-23T10:00:00.000Z'
      })
    })

    it('devuelve arreglo vacio cuando no hay filas', async () => {
      await expect(getExpenses()).resolves.toEqual([])
    })
  })

  describe('getExpense', () => {
    it('devuelve el gasto mapeado cuando la fila existe', async () => {
      base.queue([FIXED_ROW])

      const expense = await getExpense('gasto-fijo-1')

      expect(expense).not.toBeNull()
      expect(expense?.nextDueDate).toBe('2026-09-01')
    })

    it('devuelve null cuando no encuentra el identificador', async () => {
      await expect(getExpense('inexistente')).resolves.toBeNull()
    })
  })

  describe('insertExpense', () => {
    it('emite INSERT con parametros en el orden exacto de columnas', async () => {
      base.queue([FIXED_ROW])
      const input = buildExpenseInput()

      await insertExpense(input, 'id-nuevo')

      const insertion = base.findByFragment('INSERT INTO expenses')[0]
      expect(insertion.params).toEqual([
        'id-nuevo',
        'Spotify',
        5.99,
        'USD',
        null,
        null,
        'fixed',
        'Musica',
        null,
        'monthly',
        '2026-09-05',
        null,
        expect.any(String),
        expect.any(String)
      ])
    })

    it('serializa opcionales ausentes como null', async () => {
      base.queue([FIXED_ROW])
      const input = buildExpenseInput({ category: undefined, note: undefined })

      await insertExpense(input, 'id-minimo')

      const params = base.findByFragment('INSERT INTO expenses')[0].params ?? []
      expect(params[7]).toBeNull()
      expect(params[8]).toBeNull()
    })
  })

  describe('updateExpense', () => {
    it('combina cambios sobre el gasto actual y emite UPDATE completo', async () => {
      base.queue([FIXED_ROW])

      await updateExpense('gasto-fijo-1', { name: 'Netflix Premium', active: false })

      const update = base.findByFragment('UPDATE expenses SET')[0]
      expect(update.sql).toContain('active = ?')
      expect(update.params?.[0]).toBe('Netflix Premium')
      expect(update.params?.[11]).toBe(0)
      expect(update.params?.[update.params.length - 1]).toBe('gasto-fijo-1')
    })

    it('lanza error cuando el identificador no existe', async () => {
      await expect(updateExpense('fantasma', { name: 'X' })).rejects.toThrow('El gasto no existe')
    })
  })

  describe('deleteExpense', () => {
    it('emite DELETE filtrando por identificador', async () => {
      await deleteExpense('gasto-fijo-1')

      const deletion = base.findByFragment('DELETE FROM expenses')[0]
      expect(deletion.sql).toContain('WHERE id = ?')
      expect(deletion.params).toEqual(['gasto-fijo-1'])
    })
  })

  describe('queryExpensesPaginated', () => {
    it('ejecuta consulta WHERE con paginacion y cuenta total', async () => {
      // 1ra llamada de getFirstAsync consume el conteo
      base.queue([{ count: 12 }])
      // 2da llamada de getAllAsync consume las filas
      base.queue([FIXED_ROW])

      const result = await queryExpensesPaginated({
        type: 'fixed',
        search: 'net',
        limit: 10,
        offset: 0,
        sort: 'amountDesc'
      })

      expect(result.totalCount).toBe(12)
      expect(result.expenses).toHaveLength(1)
      expect(result.expenses[0].name).toBe('Netflix')

      const countStatement = base.findByFragment('SELECT COUNT(*) as count')[0]
      expect(countStatement.sql).toContain('type = ?')
      expect(countStatement.sql).toContain('LIKE ?')

      const selectStatement = base.findByFragment('ORDER BY amount DESC')[0]
      expect(selectStatement.sql).toContain('LIMIT ? OFFSET ?')
    })
  })

  describe('mapeo de dominio', () => {
    it('coincide con los campos del gasto de fabrica tras el ciclo completo', async () => {
      base.queue([FIXED_ROW])

      const expense = await getExpense('gasto-fijo-1')

      expect(expense).toMatchObject({
        id: 'gasto-fijo-1',
        name: 'Netflix',
        amount: 9.99,
        currency: 'USD',
        type: 'fixed'
      })
    })
  })
})
