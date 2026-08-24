/**
 * Hook useExpenses: reactive layer over the expenses repository.
 * Exposes per-kind lists, the monthly summary, upcoming payments and
 * CRUD operations that keep notifications in sync.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

import { deleteExpense, getExpenses, insertExpense, updateExpense } from '@src/db/expenses'
import { convert } from '@src/lib/conversions'
import { getErrorMessage } from '@src/lib/errors'
import { emit, subscribe } from '@src/lib/events'
import { generateId } from '@src/lib/ids'
import {
  cancelReminder,
  requestNotificationPermission,
  scheduleReminder
} from '@src/lib/notifications'
import { advanceDueDate, daysUntil, fromISODate, toISODate } from '@src/lib/recurrences'
import type {
  BaseCurrency,
  Currency,
  Expense,
  ExpenseInput,
  ExchangeRates,
  MonthlySummary,
  UpcomingPayment
} from '@src/types/domain'

/** Ventana en dias para la lista de proximos pagos */
const UPCOMING_HORIZON_DAYS = 7

/** Factores de conversion de cada recurrencia a su equivalente mensual */
const MONTHLY_FACTOR: Readonly<Record<string, number>> = {
  weekly: 52 / 12,
  biweekly: 2,
  monthly: 1,
  yearly: 1 / 12
}

/** Estado y acciones expuestos por el hook de gastos */
export interface UseExpensesResult {
  /** Todos los gastos cargados desde la base local */
  expenses: Expense[]
  /** true durante la primera lectura */
  loading: boolean
  /** Mensaje del ultimo error de base de datos; null si todo va bien */
  error: string | null
  /** Gastos fijos activos */
  fixedExpenses: Expense[]
  /** Gastos unicos registrados */
  uniqueExpenses: Expense[]
  /** Resumen agregado del mes en moneda base; null sin tasas disponibles */
  monthlySummary: MonthlySummary | null
  /** Pagos fijos dentro del horizonte de siete dias */
  upcomingPayments: UpcomingPayment[]
  /** true mientras una recarga manual esta en curso */
  reloading: boolean
  /** Recarga manual desde la base local (pull-to-refresh) */
  reload: () => Promise<void>
  /** Crea un gasto y agenda su recordatorio si es fijo */
  createExpense: (input: ExpenseInput) => Promise<Expense>
  /** Edita un gasto existente y reprograma su recordatorio */
  editExpense: (id: string, changes: Partial<ExpenseInput>) => Promise<Expense>
  /** Elimina un gasto y retira su recordatorio */
  removeExpense: (id: string) => Promise<void>
  /** Avanza el vencimiento de un gasto fijo pagado y reagenda el aviso */
  markAsPaid: (expense: Expense) => Promise<void>
}

/**
 * Convierte un monto a la moneda base usando las tasas vigentes.
 * El llamador garantiza que rates no sea null antes de invocarla.
 * @param amount Cantidad original
 * @param currency Moneda de registro
 * @param rates Snapshot de tasas
 * @param target Moneda base del usuario
 * @returns Monto convertido
 */
function toBase(
  amount: number,
  currency: Currency,
  rates: ExchangeRates,
  target: BaseCurrency
): number {
  return convert(amount, currency, target, rates)
}

/**
 * Administra los gastos con derivaciones memorizadas para la pantalla inicio.
 * @param rates Snapshot de tasas actual (null mientras carga)
 * @param baseCurrency Moneda elegida por el usuario para resumenes
 * @param reminderHour Hora configurada para notificaciones
 * @returns Estado reactivo completo del dominio de gastos
 */
export function useExpenses(
  rates: ExchangeRates | null,
  baseCurrency: BaseCurrency,
  reminderHour: number
): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloading, setReloading] = useState(false)

  const reload = useCallback(async () => {
    setReloading(true)
    try {
      const lista = await getExpenses()
      setExpenses(lista)
      setError(null)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setReloading(false)
    }
  }, [])

  useEffect(() => {
    let activo = true

    getExpenses()
      .then((lista) => {
        if (!activo) return
        setExpenses(lista)
        setError(null)
      })
      .catch((e) => {
        if (activo) setError(getErrorMessage(e))
      })
      .finally(() => {
        if (activo) setLoading(false)
      })

    // Sincronizacion entre instancias: mutaciones desde el modal u otras
    // pantallas emiten 'expenses-changed' y esta instancia recarga sola.
    const desuscribir = subscribe('expenses-changed', () => {
      if (activo) void reload()
    })

    return () => {
      activo = false
      desuscribir()
    }
  }, [reload])

  const fixedExpenses = useMemo(
    () => expenses.filter((g) => g.type === 'fixed' && g.active),
    [expenses]
  )

  const uniqueExpenses = useMemo(() => expenses.filter((g) => g.type === 'unique'), [expenses])

  const monthlySummary = useMemo<MonthlySummary | null>(() => {
    if (!rates) return null

    const ahora = new Date()
    const mesActual = ahora.getMonth()
    const anioActual = ahora.getFullYear()

    const totalFixed = fixedExpenses.reduce((suma, expense) => {
      const factor = MONTHLY_FACTOR[expense.recurrence ?? 'monthly'] ?? 1
      return suma + toBase(expense.amount, expense.currency, rates, baseCurrency) * factor
    }, 0)

    const unicosDelMes = uniqueExpenses.filter((expense) => {
      const fecha = new Date(expense.createdAt)
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual
    })

    const totalUnique = unicosDelMes.reduce(
      (suma, expense) => suma + toBase(expense.amount, expense.currency, rates, baseCurrency),
      0
    )

    return { totalFixed, totalUnique, uniqueCount: unicosDelMes.length }
  }, [fixedExpenses, uniqueExpenses, rates, baseCurrency])

  const upcomingPayments = useMemo<UpcomingPayment[]>(() => {
    return fixedExpenses
      .filter((expense) => Boolean(expense.nextDueDate))
      .map((expense) => ({
        expense,
        daysRemaining: daysUntil(fromISODate(expense.nextDueDate as string))
      }))
      .filter((pago) => pago.daysRemaining >= 0 && pago.daysRemaining <= UPCOMING_HORIZON_DAYS)
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
  }, [fixedExpenses])

  const createExpense = useCallback(
    async (input: ExpenseInput): Promise<Expense> => {
      const creado = await insertExpense(input, generateId())

      if (creado.type === 'fixed') {
        const permiso = await requestNotificationPermission()
        if (permiso) await scheduleReminder(creado, reminderHour)
      }

      await reload()
      emit('expenses-changed')
      return creado
    },
    [reminderHour, reload]
  )

  const editExpense = useCallback(
    async (id: string, changes: Partial<ExpenseInput>): Promise<Expense> => {
      const editado = await updateExpense(id, changes)

      if (editado.type === 'fixed' && editado.active) {
        await scheduleReminder(editado, reminderHour)
      } else {
        await cancelReminder(editado.id)
      }

      await reload()
      emit('expenses-changed')
      return editado
    },
    [reminderHour, reload]
  )

  const removeExpense = useCallback(
    async (id: string): Promise<void> => {
      await cancelReminder(id)
      await deleteExpense(id)
      await reload()
      emit('expenses-changed')
    },
    [reload]
  )

  const markAsPaid = useCallback(
    async (expense: Expense): Promise<void> => {
      if (expense.type !== 'fixed' || !expense.recurrence || !expense.nextDueDate) return

      const siguienteVencimiento = toISODate(
        advanceDueDate(fromISODate(expense.nextDueDate), expense.recurrence)
      )

      const editado = await updateExpense(expense.id, { nextDueDate: siguienteVencimiento })
      await scheduleReminder(editado, reminderHour)
      await reload()
      emit('expenses-changed')
    },
    [reminderHour, reload]
  )

  return {
    expenses,
    loading,
    error,
    fixedExpenses,
    uniqueExpenses,
    monthlySummary,
    upcomingPayments,
    reloading,
    reload,
    createExpense,
    editExpense,
    removeExpense,
    markAsPaid
  }
}
