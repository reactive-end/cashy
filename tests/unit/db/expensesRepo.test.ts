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
  updateExpense
} from '@src/db/expenses'

import { FakeDatabase, iniciarBaseFalsa } from '../../helpers/expoSqliteMock'
import { buildExpenseInput, buildFixedExpense } from '../../helpers/factories'

/** Fila cruda snake_case equivalente al gasto fijo de fabrica */
const FILA_FIJA = {
  id: 'gasto-fijo-1',
  name: 'Netflix',
  amount: 9.99,
  currency: 'USD',
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
    base = iniciarBaseFalsa()
  })

  describe('getExpenses', () => {
    it('consulta ordenada por creacion y mapea snake_case a dominio', async () => {
      const filaSegunda = { ...FILA_FIJA, id: 'gasto-segundo', name: 'Spotify' }
      base.encolar([filaSegunda, FILA_FIJA])

      const gastos = await getExpenses()

      expect(base.buscar('SELECT')[0].sql).toContain('ORDER BY created_at DESC')
      expect(gastos).toHaveLength(2)
      expect(gastos[1]).toMatchObject({
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
      base.encolar([FILA_FIJA])

      const gasto = await getExpense('gasto-fijo-1')

      expect(gasto).not.toBeNull()
      expect(gasto?.nextDueDate).toBe('2026-09-01')
    })

    it('devuelve null cuando no encuentra el identificador', async () => {
      await expect(getExpense('inexistente')).resolves.toBeNull()
    })
  })

  describe('insertExpense', () => {
    it('emite INSERT con parametros en el orden exacto de columnas', async () => {
      base.encolar([FILA_FIJA])
      const entrada = buildExpenseInput()

      await insertExpense(entrada, 'id-nuevo')

      const insercion = base.buscar('INSERT INTO expenses')[0]
      expect(insercion.params).toEqual([
        'id-nuevo',
        'Spotify',
        5.99,
        'USD',
        'fixed',
        'Musica',
        null,
        'monthly',
        '2026-09-05',
        expect.any(String),
        expect.any(String)
      ])
    })

    it('serializa opcionales ausentes como null', async () => {
      base.encolar([FILA_FIJA])
      const entrada = buildExpenseInput({ category: undefined, note: undefined })

      await insertExpense(entrada, 'id-minimo')

      const params = base.buscar('INSERT INTO expenses')[0].params ?? []
      expect(params[5]).toBeNull()
      expect(params[6]).toBeNull()
    })
  })

  describe('updateExpense', () => {
    it('combina cambios sobre el gasto actual y emite UPDATE completo', async () => {
      base.encolar([FILA_FIJA])

      await updateExpense('gasto-fijo-1', { name: 'Netflix Premium', active: false })

      const actualizacion = base.buscar('UPDATE expenses SET')[0]
      expect(actualizacion.sql).toContain('active = ?')
      expect(actualizacion.params?.[0]).toBe('Netflix Premium')
      expect(actualizacion.params?.[8]).toBe(0)
      expect(actualizacion.params?.[actualizacion.params.length - 1]).toBe('gasto-fijo-1')
    })

    it('lanza error cuando el identificador no existe', async () => {
      await expect(updateExpense('fantasma', { name: 'X' })).rejects.toThrow('El gasto no existe')
    })
  })

  describe('deleteExpense', () => {
    it('emite DELETE filtrando por identificador', async () => {
      await deleteExpense('gasto-fijo-1')

      const borrado = base.buscar('DELETE FROM expenses')[0]
      expect(borrado.sql).toContain('WHERE id = ?')
      expect(borrado.params).toEqual(['gasto-fijo-1'])
    })
  })

  describe('mapeo de dominio', () => {
    it('coincide con los campos del gasto de fabrica tras el ciclo completo', async () => {
      base.encolar([FILA_FIJA])

      const gasto = await getExpense('gasto-fijo-1')

      expect(gasto).toEqual(buildFixedExpense())
    })
  })
})
