/**
 * Pruebas unitarias del hook useExpenses: derivados memorizados,
 * CRUD y sincronizacion de recordatorios con dependencias mockeadas.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

import * as expenseReceiptsRepo from '@src/db/expenseReceipts'
import * as expensesRepo from '@src/db/expenses'
import * as receiptsRepo from '@src/db/incomeReceipts'
import { useExpenses } from '@src/hooks/useExpenses'
import { EXPENSES_LOAD_ERROR_MESSAGE } from '@src/lib/errorMessages'
import * as notificaciones from '@src/lib/notifications'
import { fromISODate, toISODate } from '@src/lib/recurrences'

import { NOW, buildFixedExpense, buildRates, buildUniqueExpense } from '../../helpers/factories'

const getExpensesMock = expensesRepo.getExpenses as jest.Mock
const insertExpenseMock = expensesRepo.insertExpense as jest.Mock
const updateExpenseMock = expensesRepo.updateExpense as jest.Mock
const deleteExpenseMock = expensesRepo.deleteExpense as jest.Mock
const getIncomeReceiptsMock = receiptsRepo.getIncomeReceipts as jest.Mock
const getExpenseReceiptsMock = expenseReceiptsRepo.getExpenseReceipts as jest.Mock
const confirmExpenseReceiptMock = expenseReceiptsRepo.confirmExpenseReceipt as jest.Mock
const deleteExpenseReceiptMock = expenseReceiptsRepo.deleteExpenseReceipt as jest.Mock
const scheduleMock = notificaciones.scheduleReminder as jest.Mock
const cancelMock = notificaciones.cancelReminder as jest.Mock
const permisoMock = notificaciones.requestNotificationPermission as jest.Mock

jest.mock('@src/db/expenses')
jest.mock('@src/db/expenseReceipts', () => ({
  confirmExpenseReceipt: jest.fn(async () => ({})),
  deleteExpenseReceipt: jest.fn(async () => undefined),
  getExpenseReceipts: jest.fn(async () => [])
}))
jest.mock('@src/db/incomeReceipts', () => ({
  formatYearMonth: jest.fn(() => '2026-08'),
  getIncomeReceipts: jest.fn(async () => [])
}))
jest.mock('@src/lib/notifications')

/** Fecha ISO relativa a hoy para pruebas independientes del calendario */
function fechaRelativa(dias: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)
  return toISODate(fecha)
}

/**
 * Semilla tipica: dos fijos y un unico del mes actual.
 * Las fechas son relativas a hoy para no acoplarse al calendario.
 */
function semilla() {
  const fijoCercano = buildFixedExpense({
    id: 'fijo-1',
    name: 'Alquiler',
    amount: 300,
    recurrence: 'weekly',
    nextDueDate: fechaRelativa(2)
  })
  const fijoLejano = buildFixedExpense({
    id: 'fijo-2',
    name: 'Dominio web',
    amount: 12,
    currency: 'USD',
    recurrence: 'yearly',
    nextDueDate: fechaRelativa(13)
  })
  const unico = buildUniqueExpense({ id: 'unico-1', amount: 50, currency: 'USD' })

  return [fijoCercano, fijoLejano, unico]
}

async function montarConSemilla() {
  getExpensesMock.mockResolvedValueOnce(semilla())

  const rendered = await renderHook(() => useExpenses(buildRates(), 'USD', 9))

  await waitFor(() => expect(rendered.result.current.loading).toBe(false))
  return rendered
}

describe('useExpenses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ now: NOW })
    permisoMock.mockResolvedValue(true)
    insertExpenseMock.mockImplementation(async (input, id) => ({
      ...buildFixedExpense(),
      ...input,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
    updateExpenseMock.mockImplementation(async (id: string, cambios?: Record<string, never>) => ({
      ...buildFixedExpense({ id }),
      ...(cambios ?? {})
    }))
    deleteExpenseMock.mockResolvedValue(undefined)
    getExpensesMock.mockResolvedValue([])
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('derivados', () => {
    it('separa fijos activos de unicos', async () => {
      const { result } = await montarConSemilla()

      expect(result.current.fixedExpenses).toHaveLength(2)
      expect(result.current.uniqueExpenses).toHaveLength(1)
    })

    it('proyecta los fijos a equivalente mensual en moneda base', async () => {
      const { result } = await montarConSemilla()

      // Alquiler 300 semanal (300 * 52/12 = 1300) + Dominio 12 anual (12 / 12)
      expect(result.current.monthlySummary?.totalFixed).toBeCloseTo(1301, 2)
    })

    it('suma los unicos del mes actual convertidos a la base', async () => {
      const { result } = await montarConSemilla()

      expect(result.current.monthlySummary?.totalUnique).toBe(50)
      expect(result.current.monthlySummary?.uniqueCount).toBe(1)
    })

    it('calcula el balance neto disponible incorporando ingresos confirmados', async () => {
      getIncomeReceiptsMock.mockResolvedValueOnce([
        {
          id: 'r-1',
          incomeId: 'i-1',
          yearMonth: '2026-08',
          amount: 2000,
          currency: 'USD',
          confirmedAt: '2026-08-05T00:00:00.000Z',
          createdAt: '2026-08-05T00:00:00.000Z',
          updatedAt: '2026-08-05T00:00:00.000Z'
        }
      ])
      const { result } = await montarConSemilla()

      expect(result.current.monthlySummary?.confirmedIncome).toBe(2000)
      // Balance = 2000 - (1301 + 50) = 649
      expect(result.current.monthlySummary?.netBalance).toBeCloseTo(649, 1)
    })

    it('filtra proximos pagos al horizonte de siete dias y ordena por cercania', async () => {
      const { result } = await montarConSemilla()

      const dias = result.current.upcomingPayments.map((p) => p.daysRemaining)

      expect(dias).toEqual([2])
      expect(dias.every((d) => d >= 0 && d <= 7)).toBe(true)
    })
  })

  describe('createExpense', () => {
    it('solicita permiso y agenda recordatorio solo para fijos', async () => {
      const { result } = await montarConSemilla()

      await act(async () => {
        await result.current.createExpense({
          name: 'Gym',
          amount: 20,
          currency: 'USD',
          type: 'fixed',
          recurrence: 'monthly',
          nextDueDate: '2026-10-01'
        })
      })

      expect(permisoMock).toHaveBeenCalledTimes(1)
      expect(scheduleMock).toHaveBeenCalled()
    })

    it('no agenda recordatorios para gastos unicos', async () => {
      const { result } = await montarConSemilla()

      await act(async () => {
        await result.current.createExpense({
          name: 'Antojo',
          amount: 5,
          currency: 'USD',
          type: 'unique'
        })
      })

      expect(permisoMock).not.toHaveBeenCalled()
      expect(scheduleMock).not.toHaveBeenCalled()
    })
  })

  describe('removeExpense', () => {
    it('cancela el recordatorio antes de borrar', async () => {
      const { result } = await montarConSemilla()

      await act(async () => {
        await result.current.removeExpense('fijo-1')
      })

      // En esta frontera el hook pasa el id crudo; el prefijo reminder-
      // lo agrega la libreria de notificaciones y se prueba en su suite.
      expect(cancelMock).toHaveBeenCalledWith('fijo-1')
      expect(deleteExpenseMock).toHaveBeenCalledWith('fijo-1')
    })
  })

  describe('markAsPaid', () => {
    it('avanza el vencimiento segun recurrencia y reagenda', async () => {
      const { result } = await montarConSemilla()
      const alquiler = semilla()[0]
      const esperado = toISODate(
        (() => {
          const f = fromISODate(alquiler.nextDueDate as string)
          f.setDate(f.getDate() + 7)
          return f
        })()
      )

      await act(async () => {
        await result.current.markAsPaid(alquiler)
      })

      expect(updateExpenseMock).toHaveBeenCalledWith('fijo-1', {
        nextDueDate: esperado
      })
      expect(confirmExpenseReceiptMock).toHaveBeenCalledWith(
        alquiler,
        '2026-08',
        expect.any(Number),
        'USD',
        expect.any(String)
      )
      expect(scheduleMock).toHaveBeenCalled()
    })

    it('ignora gastos que no son fijos', async () => {
      const { result } = await montarConSemilla()

      await act(async () => {
        await result.current.markAsPaid(buildUniqueExpense())
      })

      expect(updateExpenseMock).not.toHaveBeenCalled()
      expect(confirmExpenseReceiptMock).not.toHaveBeenCalled()
    })
  })

  describe('unmarkAsPaid', () => {
    it('elimina el recibo, retrocede el vencimiento y reagenda recordatorio', async () => {
      const { result } = await montarConSemilla()
      const alquiler = buildFixedExpense({
        id: 'fijo-1',
        recurrence: 'weekly',
        nextDueDate: '2026-09-08'
      })

      await act(async () => {
        await result.current.unmarkAsPaid(alquiler, '2026-08')
      })

      expect(deleteExpenseReceiptMock).toHaveBeenCalledWith('fijo-1', '2026-08')
      expect(updateExpenseMock).toHaveBeenCalledWith('fijo-1', {
        nextDueDate: '2026-09-01'
      })
      expect(scheduleMock).toHaveBeenCalled()
    })

    it('ignora gastos que no son fijos', async () => {
      const { result } = await montarConSemilla()

      await act(async () => {
        await result.current.unmarkAsPaid(buildUniqueExpense())
      })

      expect(deleteExpenseReceiptMock).not.toHaveBeenCalled()
      expect(updateExpenseMock).not.toHaveBeenCalled()
    })
  })

  describe('ramas de guarda adicionales', () => {
    it('no agenda recordatorio si el permiso se deniega', async () => {
      const { result } = await montarConSemilla()
      permisoMock.mockResolvedValueOnce(false)

      await act(async () => {
        await result.current.createExpense({
          name: 'Gym sin permiso',
          amount: 20,
          currency: 'USD',
          type: 'fixed',
          recurrence: 'monthly',
          nextDueDate: '2026-10-01'
        })
      })

      expect(scheduleMock).not.toHaveBeenCalled()
    })

    it('editar a inactivo cancela el recordatorio en vez de reprogramar', async () => {
      const { result } = await montarConSemilla()

      await act(async () => {
        await result.current.editExpense('fijo-1', { active: false })
      })

      expect(cancelMock).toHaveBeenCalledWith('fijo-1')
      expect(scheduleMock).not.toHaveBeenCalled()
    })

    it('markAsPaid ignora gastos sin fecha de vencimiento', async () => {
      const { result } = await montarConSemilla()

      await act(async () => {
        await result.current.markAsPaid(
          buildFixedExpense({ id: 'sin-fecha', nextDueDate: undefined, recurrence: 'monthly' })
        )
      })

      expect(updateExpenseMock).not.toHaveBeenCalled()
    })

    it('reporta el mensaje amigable cuando la carga inicial falla', async () => {
      getExpensesMock.mockRejectedValueOnce(new Error('db bloqueada'))

      const inicial = await renderHook(() => useExpenses(buildRates(), 'USD', 9))
      await waitFor(() => {
        expect(inicial.result.current.loading).toBe(false)
        expect(inicial.result.current.error).toBe(EXPENSES_LOAD_ERROR_MESSAGE)
      })
    })

    it('identifica pagos pendientes de cobro y estado de pago del mes', async () => {
      const { result } = await montarConSemilla()
      expect(result.current.isPaidThisMonth('fijo-1')).toBe(false)
      expect(Array.isArray(result.current.pendingDueExpenses)).toBe(true)
    })
  })
})
