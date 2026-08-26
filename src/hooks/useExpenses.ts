/**
 * Hook useExpenses: reactive layer over the expenses repository.
 * Exposes per-kind lists, the monthly summary, upcoming payments and
 * CRUD operations that keep notifications in sync.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

import { deleteExpense, getExpenses, insertExpense, updateExpense } from '@src/db/expenses'
import { convert } from '@src/lib/conversions'
import { EXPENSES_LOAD_ERROR_MESSAGE } from '@src/lib/errorMessages'
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
 * @param reminderMinute Minuto configurado para notificaciones
 * @returns Estado reactivo completo del dominio de gastos
 */
export function useExpenses(
  rates: ExchangeRates | null,
  baseCurrency: BaseCurrency,
  reminderHour: number,
  reminderMinute = 0
): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloading, setReloading] = useState(false)

  const reload = useCallback(async () => {
    setReloading(true)
    try {
      const fetched = await getExpenses()
      setExpenses(fetched)
      setError(null)
    } catch {
      // Mensaje amigable fijo: nunca se filtran textos tecnicos de la base.
      setError(EXPENSES_LOAD_ERROR_MESSAGE)
    } finally {
      setReloading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    getExpenses()
      .then((fetched) => {
        if (!active) return
        setExpenses(fetched)
        setError(null)
      })
      .catch(() => {
        if (active) setError(EXPENSES_LOAD_ERROR_MESSAGE)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    // Sincronizacion entre instancias: mutaciones desde el modal u otras
    // pantallas emiten 'expenses-changed' y esta instancia recarga sola.
    const unsubscribe = subscribe('expenses-changed', () => {
      if (active) void reload()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [reload])

  const fixedExpenses = useMemo(
    () => expenses.filter((g) => g.type === 'fixed' && g.active),
    [expenses]
  )

  const uniqueExpenses = useMemo(() => expenses.filter((g) => g.type === 'unique'), [expenses])

  const monthlySummary = useMemo<MonthlySummary | null>(() => {
    if (!rates) return null

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const totalFixed = fixedExpenses.reduce((sum, expense) => {
      const factor = MONTHLY_FACTOR[expense.recurrence ?? 'monthly'] ?? 1
      return sum + toBase(expense.amount, expense.currency, rates, baseCurrency) * factor
    }, 0)

    const uniqueThisMonth = uniqueExpenses.filter((expense) => {
      const createdDate = new Date(expense.createdAt)
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
    })

    const totalUnique = uniqueThisMonth.reduce(
      (sum, expense) => sum + toBase(expense.amount, expense.currency, rates, baseCurrency),
      0
    )

    return { totalFixed, totalUnique, uniqueCount: uniqueThisMonth.length }
  }, [fixedExpenses, uniqueExpenses, rates, baseCurrency])

  const upcomingPayments = useMemo<UpcomingPayment[]>(() => {
    const upcoming: UpcomingPayment[] = []

    for (const expense of fixedExpenses) {
      if (!expense.nextDueDate) continue

      const daysRemaining = daysUntil(fromISODate(expense.nextDueDate))

      if (daysRemaining < 0 || daysRemaining > UPCOMING_HORIZON_DAYS) continue

      upcoming.push({ expense, daysRemaining })
    }

    return upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining)
  }, [fixedExpenses])

  const createExpense = useCallback(
    async (input: ExpenseInput): Promise<Expense> => {
      const created = await insertExpense(input, generateId())

      if (created.type === 'fixed') {
        const permiso = await requestNotificationPermission()
        if (permiso) await scheduleReminder(created, reminderHour, reminderMinute)
      }

      await reload()
      emit('expenses-changed')
      return created
    },
    [reminderHour, reminderMinute, reload]
  )

  const editExpense = useCallback(
    async (id: string, changes: Partial<ExpenseInput>): Promise<Expense> => {
      const edited = await updateExpense(id, changes)

      if (edited.type === 'fixed' && edited.active) {
        await scheduleReminder(edited, reminderHour, reminderMinute)
      } else {
        await cancelReminder(edited.id)
      }

      await reload()
      emit('expenses-changed')
      return edited
    },
    [reminderHour, reminderMinute, reload]
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

      const nextDueISO = toISODate(
        advanceDueDate(fromISODate(expense.nextDueDate), expense.recurrence)
      )

      const edited = await updateExpense(expense.id, { nextDueDate: nextDueISO })
      await scheduleReminder(edited, reminderHour, reminderMinute)
      await reload()
      emit('expenses-changed')
    },
    [reminderHour, reminderMinute, reload]
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
