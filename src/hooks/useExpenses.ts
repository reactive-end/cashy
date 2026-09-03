/**
 * Hook useExpenses: reactive layer over the expenses and receipts repository.
 * Exposes per-kind lists, the monthly summary with real net balance,
 * upcoming payments and CRUD operations that keep notifications in sync.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  confirmExpenseReceipt,
  deleteExpenseReceipt,
  getExpenseReceipts
} from '@src/db/expenseReceipts'
import { deleteExpense, getExpenses, insertExpense, updateExpense } from '@src/db/expenses'
import { formatYearMonth, getIncomeReceipts } from '@src/db/incomeReceipts'
import { convert } from '@src/lib/conversions'
import { EXPENSES_LOAD_ERROR_MESSAGE } from '@src/lib/errorMessages'
import { emit, subscribe } from '@src/lib/events'
import { generateId } from '@src/lib/ids'
import {
  cancelReminder,
  requestNotificationPermission,
  scheduleReminder
} from '@src/lib/notifications'
import {
  advanceDueDate,
  daysUntil,
  fromISODate,
  getEffectiveDueDate,
  revertDueDate,
  toISODate
} from '@src/lib/recurrences'
import type {
  BaseCurrency,
  Currency,
  Expense,
  ExpenseInput,
  ExpenseReceipt,
  ExchangeRates,
  IncomeReceipt,
  MonthlySummary,
  UpcomingPayment
} from '@src/types/domain'

/** Ventana en dias para la lista de proximos pagos */
const UPCOMING_HORIZON_DAYS = 7

/** Factores de conversion de cada recurrencia a su equivalente mensual */
export const MONTHLY_FACTOR: Readonly<Record<string, number>> = {
  weekly: 52 / 12,
  biweekly: 2,
  monthly: 1,
  yearly: 1 / 12
}

/** Estado y acciones expuestos por el hook de gastos */
export interface UseExpensesResult {
  /** Todos los gastos cargados desde la base local */
  expenses: Expense[]
  /** Comprobantes de pago de gastos fijos del mes actual */
  expenseReceipts: ExpenseReceipt[]
  /** Gastos fijos cuyo dia de cobro ya llego en el mes y no han sido pagados */
  pendingDueExpenses: Expense[]
  /** Indica si un gasto fijo especifico ya fue pagado este mes */
  isPaidThisMonth: (expenseId: string) => boolean
  /** true durante la primera lectura */
  loading: boolean
  /** Mensaje del ultimo error de base de datos; null si todo va bien */
  error: string | null
  /** Gastos fijos activos */
  fixedExpenses: Expense[]
  /** Gastos unicos registrados */
  uniqueExpenses: Expense[]
  /** Resumen agregado del mes en moneda base con balance neto; null sin tasas */
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
  /** Avanza el vencimiento de un gasto fijo pagado, emite comprobante y reagenda el aviso */
  markAsPaid: (expense: Expense) => Promise<void>
  /** Revierte el pago de un gasto fijo eliminando su comprobante y retrocediendo el vencimiento */
  unmarkAsPaid: (expense: Expense, yearMonth?: string) => Promise<void>
}

/**
 * Convierte un monto a la moneda base usando las tasas vigentes.
 * El llamador garantiza que rates no sea null antes de invocarla.
 * @param amount Monto original
 * @param currency Moneda original
 * @param rates Snapshot vigente de tasas
 * @param target Moneda destino
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
  reminderMinute = 0,
  selectedYearMonth?: string
): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [receipts, setReceipts] = useState<IncomeReceipt[]>([])
  const [expenseReceipts, setExpenseReceipts] = useState<ExpenseReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloading, setReloading] = useState(false)

  const currentYearMonth = selectedYearMonth ?? formatYearMonth()

  const reload = useCallback(async () => {
    setReloading(true)
    try {
      const [fetchedExpenses, fetchedReceipts, fetchedExpenseReceipts] = await Promise.all([
        getExpenses(),
        getIncomeReceipts(currentYearMonth),
        getExpenseReceipts(currentYearMonth)
      ])
      setExpenses(fetchedExpenses)
      setReceipts(fetchedReceipts)
      setExpenseReceipts(fetchedExpenseReceipts)
      setError(null)
    } catch {
      // Mensaje amigable fijo: nunca se filtran textos tecnicos de la base.
      setError(EXPENSES_LOAD_ERROR_MESSAGE)
    } finally {
      setReloading(false)
    }
  }, [currentYearMonth])

  useEffect(() => {
    let active = true

    Promise.all([
      getExpenses(),
      getIncomeReceipts(currentYearMonth),
      getExpenseReceipts(currentYearMonth)
    ])
      .then(([fetchedExpenses, fetchedReceipts, fetchedExpenseReceipts]) => {
        if (!active) return
        setExpenses(fetchedExpenses)
        setReceipts(fetchedReceipts)
        setExpenseReceipts(fetchedExpenseReceipts)
        setError(null)
      })
      .catch(() => {
        if (active) setError(EXPENSES_LOAD_ERROR_MESSAGE)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const unsubscribeExpenses = subscribe('expenses-changed', () => {
      if (active) void reload()
    })
    const unsubscribeReceipts = subscribe('income-receipts-changed', () => {
      if (active) void reload()
    })
    const unsubscribeExpenseReceipts = subscribe('expense-receipts-changed', () => {
      if (active) void reload()
    })

    return () => {
      active = false
      unsubscribeExpenses()
      unsubscribeReceipts()
      unsubscribeExpenseReceipts()
    }
  }, [reload, currentYearMonth])

  const fixedExpenses = useMemo(
    () => expenses.filter((g) => g.type === 'fixed' && g.active),
    [expenses]
  )

  const uniqueExpenses = useMemo(() => expenses.filter((g) => g.type === 'unique'), [expenses])

  const monthlySummary = useMemo<MonthlySummary | null>(() => {
    if (!rates) return null

    const expenseReceiptsMap = new Map(expenseReceipts.map((r) => [r.expenseId, r]))
    const currentActualMonth = formatYearMonth()
    const isPastMonth = currentYearMonth < currentActualMonth

    const totalFixed = fixedExpenses.reduce((sum, expense) => {
      // Omite gastos fijos creados en meses posteriores al evaluado
      const expenseMonth = expense.createdAt.slice(0, 7)
      if (expenseMonth > currentYearMonth) {
        return sum
      }

      // Si ya fue pagado en este mes, se respeta el snapshot congelado del comprobante
      const receipt = expenseReceiptsMap.get(expense.id)
      if (receipt) {
        const receiptAmount =
          receipt.baseAmount !== undefined && receipt.baseCurrency === baseCurrency
            ? receipt.baseAmount
            : toBase(receipt.amount, receipt.currency, rates, baseCurrency)
        return sum + receiptAmount
      }

      // En meses pasados, si no tiene recibo pagado, no fue ejecutado en ese mes
      if (isPastMonth) {
        return sum
      }

      const factor = MONTHLY_FACTOR[expense.recurrence ?? 'monthly'] ?? 1
      const projected = toBase(expense.amount, expense.currency, rates, baseCurrency) * factor
      return sum + projected
    }, 0)

    const uniqueThisMonth = uniqueExpenses.filter((expense) => {
      const expenseMonth = expense.createdAt.slice(0, 7)
      return expenseMonth === currentYearMonth
    })

    const totalUnique = uniqueThisMonth.reduce((sum, expense) => {
      const converted =
        expense.baseAmount !== undefined && expense.baseCurrency === baseCurrency
          ? expense.baseAmount
          : toBase(expense.amount, expense.currency, rates, baseCurrency)
      return sum + converted
    }, 0)

    const confirmedIncome = receipts.reduce((sum, receipt) => {
      const converted =
        receipt.baseAmount !== undefined && receipt.baseCurrency === baseCurrency
          ? receipt.baseAmount
          : toBase(receipt.amount, receipt.currency, rates, baseCurrency)
      return sum + converted
    }, 0)

    const netBalance = confirmedIncome - (totalFixed + totalUnique)

    return {
      totalFixed,
      totalUnique,
      uniqueCount: uniqueThisMonth.length,
      confirmedIncome,
      netBalance
    }
  }, [
    fixedExpenses,
    uniqueExpenses,
    receipts,
    expenseReceipts,
    rates,
    baseCurrency,
    currentYearMonth
  ])

  const paidExpenseIds = useMemo(() => {
    return new Set(expenseReceipts.map((r) => r.expenseId))
  }, [expenseReceipts])

  const isPaidThisMonth = useCallback(
    (expenseId: string): boolean => {
      return paidExpenseIds.has(expenseId)
    },
    [paidExpenseIds]
  )

  const pendingDueExpenses = useMemo<Expense[]>(() => {
    const now = new Date()
    const currentDay = now.getDate()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const actualYearMonth = formatYearMonth(now)

    // Solo se evaluan recordatorios pendientes para el mes en curso
    if (currentYearMonth !== actualYearMonth) return []

    return fixedExpenses.filter((expense) => {
      if (!expense.active || paidExpenseIds.has(expense.id)) return false
      if (expense.createdAt.slice(0, 7) > currentYearMonth) return false
      if (expense.nextDueDate && expense.nextDueDate.slice(0, 7) > currentYearMonth) return false

      const anchor =
        expense.dueDay ?? (expense.nextDueDate ? fromISODate(expense.nextDueDate).getDate() : 1)
      const effectiveDueDate = getEffectiveDueDate(currentYear, currentMonth, anchor)
      const effectiveDay = effectiveDueDate.getDate()

      return currentDay >= effectiveDay
    })
  }, [fixedExpenses, paidExpenseIds, currentYearMonth])

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
      let baseAmount = input.baseAmount
      let baseCurrencyInput = input.baseCurrency
      if (rates && baseAmount === undefined) {
        baseAmount = toBase(input.amount, input.currency, rates, baseCurrency)
        baseCurrencyInput = baseCurrency
      }

      const created = await insertExpense(
        {
          ...input,
          baseAmount,
          baseCurrency: baseCurrencyInput
        },
        generateId()
      )

      if (created.type === 'fixed') {
        const permiso = await requestNotificationPermission()
        if (permiso) await scheduleReminder(created, reminderHour, reminderMinute)
      }

      await reload()
      emit('expenses-changed')
      return created
    },
    [reminderHour, reminderMinute, reload, rates, baseCurrency]
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
        advanceDueDate(fromISODate(expense.nextDueDate), expense.recurrence, expense.dueDay)
      )

      const baseAmount = rates
        ? toBase(expense.amount, expense.currency, rates, baseCurrency)
        : expense.amount
      await confirmExpenseReceipt(expense, currentYearMonth, baseAmount, baseCurrency, generateId())

      const edited = await updateExpense(expense.id, { nextDueDate: nextDueISO })
      await scheduleReminder(edited, reminderHour, reminderMinute)
      await reload()
      emit('expenses-changed')
      emit('expense-receipts-changed')
    },
    [reminderHour, reminderMinute, reload, rates, baseCurrency, currentYearMonth]
  )

  const unmarkAsPaid = useCallback(
    async (expense: Expense, yearMonth?: string): Promise<void> => {
      if (expense.type !== 'fixed') return

      const targetMonth = yearMonth ?? currentYearMonth
      await deleteExpenseReceipt(expense.id, targetMonth)

      let edited = expense
      if (expense.recurrence && expense.nextDueDate) {
        const previousDueISO = toISODate(
          revertDueDate(fromISODate(expense.nextDueDate), expense.recurrence, expense.dueDay)
        )
        edited = await updateExpense(expense.id, { nextDueDate: previousDueISO })
        await scheduleReminder(edited, reminderHour, reminderMinute)
      }

      await reload()
      emit('expenses-changed')
      emit('expense-receipts-changed')
    },
    [reminderHour, reminderMinute, reload, currentYearMonth]
  )

  return {
    expenses,
    expenseReceipts,
    pendingDueExpenses,
    isPaidThisMonth,
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
    markAsPaid,
    unmarkAsPaid
  }
}
