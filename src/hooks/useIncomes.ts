/**
 * Hook useIncomes: reactive layer over the incomes and receipts repository.
 * Expone el listado de ingresos, los recibos confirmados del mes,
 * el total estimado y el total efectivamente cobrado en moneda base,
 * ademas de operaciones CRUD y de confirmacion de cobro.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  confirmIncomeReceipt,
  deleteIncomeReceipt,
  formatYearMonth,
  getIncomeReceipts
} from '@src/db/incomeReceipts'
import { deleteIncome, getIncomes, insertIncome, updateIncome } from '@src/db/incomes'
import { convert } from '@src/lib/conversions'
import { EXPENSES_LOAD_ERROR_MESSAGE } from '@src/lib/errorMessages'
import { emit, subscribe } from '@src/lib/events'
import { generateId } from '@src/lib/ids'
import { daysInMonth } from '@src/lib/recurrences'
import type {
  BaseCurrency,
  ExchangeRates,
  Income,
  IncomeInput,
  IncomeReceipt
} from '@src/types/domain'

/** Estado y acciones expuestos por el hook de ingresos */
export interface UseIncomesResult {
  /** Todos los ingresos configurados */
  incomes: Income[]
  /** Recibos de cobro confirmados para el mes actual */
  receipts: IncomeReceipt[]
  /** Ingresos cuyo dia de cobro ya llego en el mes y no han sido confirmados */
  pendingConfirmations: Income[]
  /** true durante la primera lectura */
  loading: boolean
  /** Mensaje amigable del ultimo error de base de datos */
  error: string | null
  /** Total mensual estimado (proyectado); null sin tasas */
  monthlyTotal: number | null
  /** Total efectivamente cobrado y confirmado este mes; null sin tasas */
  confirmedTotal: number | null
  /** Indica si un ingreso especifico ya fue cobrado este mes */
  isConfirmedThisMonth: (incomeId: string) => boolean
  /** Recarga manual desde la base local (pull-to-refresh) */
  reload: () => Promise<void>
  /** Crea un ingreso nuevo */
  create: (input: IncomeInput) => Promise<Income>
  /** Edita un ingreso existente */
  edit: (id: string, changes: Partial<IncomeInput>) => Promise<Income>
  /** Elimina un ingreso por identificador */
  remove: (id: string) => Promise<void>
  /** Confirma el cobro de un ingreso para el mes actual */
  confirmReceipt: (income: Income) => Promise<IncomeReceipt>
  /** Revierte o elimina la confirmacion de cobro de un ingreso este mes */
  unconfirmReceipt: (incomeId: string) => Promise<void>
}

/** Factores de conversion de cada recurrencia a su equivalente mensual */
const MONTHLY_FACTOR: Readonly<Record<string, number>> = {
  weekly: 52 / 12,
  biweekly: 2,
  monthly: 1,
  yearly: 1 / 12
}

/**
 * Administra los ingresos y sus confirmaciones mensuales de cobro.
 * @param rates Snapshot de tasas actual (null mientras carga)
 * @param baseCurrency Moneda elegida para resumenes
 * @returns Estado reactivo completo del dominio de ingresos y recibos
 */
export function useIncomes(
  rates: ExchangeRates | null,
  baseCurrency: BaseCurrency,
  selectedYearMonth?: string
): UseIncomesResult {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [receipts, setReceipts] = useState<IncomeReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentYearMonth = selectedYearMonth ?? formatYearMonth()

  const reload = useCallback(async () => {
    try {
      const [fetchedIncomes, fetchedReceipts] = await Promise.all([
        getIncomes(),
        getIncomeReceipts(currentYearMonth)
      ])
      if (rates) {
        for (const inc of fetchedIncomes) {
          if (inc.baseAmount === undefined || inc.baseCurrency === undefined) {
            const calculatedBase = convert(inc.amount, inc.currency, baseCurrency, rates)
            inc.baseAmount = calculatedBase
            inc.baseCurrency = baseCurrency
            void updateIncome(inc.id, { baseAmount: calculatedBase, baseCurrency })
          }
        }
      }
      setIncomes(fetchedIncomes)
      setReceipts(fetchedReceipts)
      setError(null)
    } catch {
      // Mensaje amigable fijo: nunca se filtran textos tecnicos.
      setError(EXPENSES_LOAD_ERROR_MESSAGE)
    }
  }, [currentYearMonth, rates, baseCurrency])

  useEffect(() => {
    let active = true

    Promise.all([getIncomes(), getIncomeReceipts(currentYearMonth)])
      .then(([fetchedIncomes, fetchedReceipts]) => {
        if (active) {
          if (rates) {
            for (const inc of fetchedIncomes) {
              if (inc.baseAmount === undefined || inc.baseCurrency === undefined) {
                const calculatedBase = convert(inc.amount, inc.currency, baseCurrency, rates)
                inc.baseAmount = calculatedBase
                inc.baseCurrency = baseCurrency
                void updateIncome(inc.id, { baseAmount: calculatedBase, baseCurrency })
              }
            }
          }
          setIncomes(fetchedIncomes)
          setReceipts(fetchedReceipts)
        }
      })
      .catch(() => {
        if (active) setError(EXPENSES_LOAD_ERROR_MESSAGE)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const unsubscribeIncomes = subscribe('incomes-changed', () => {
      if (active) void reload()
    })
    const unsubscribeReceipts = subscribe('income-receipts-changed', () => {
      if (active) void reload()
    })

    return () => {
      active = false
      unsubscribeIncomes()
      unsubscribeReceipts()
    }
  }, [reload, currentYearMonth, rates, baseCurrency])

  const confirmedIncomeIds = useMemo(() => {
    return new Set(receipts.map((receipt) => receipt.incomeId))
  }, [receipts])

  const isConfirmedThisMonth = useCallback(
    (incomeId: string): boolean => {
      return confirmedIncomeIds.has(incomeId)
    },
    [confirmedIncomeIds]
  )

  const pendingConfirmations = useMemo(() => {
    const now = new Date()
    const currentDay = now.getDate()
    const isCurrentMonth = currentYearMonth === formatYearMonth(now)
    if (!isCurrentMonth) return []

    const daysInCurrentMonth = daysInMonth(now.getFullYear(), now.getMonth())

    return incomes.filter((income) => {
      if (income.type === 'unique') return false
      if (income.createdAt.slice(0, 7) > currentYearMonth) return false
      const effectivePayday = Math.min(income.paydayDay, daysInCurrentMonth)
      return effectivePayday <= currentDay && !confirmedIncomeIds.has(income.id)
    })
  }, [incomes, confirmedIncomeIds, currentYearMonth])

  const monthlyTotal = useMemo<number | null>(() => {
    if (!rates || incomes.length === 0) return null

    const currentActualMonth = formatYearMonth()
    const isPastMonth = currentYearMonth < currentActualMonth

    return incomes.reduce((sum, income) => {
      const incomeMonth = income.createdAt.slice(0, 7)
      if (incomeMonth > currentYearMonth) return sum

      if (income.type === 'unique') {
        if (incomeMonth !== currentYearMonth) return sum
        const base =
          income.baseAmount !== undefined && income.baseCurrency === baseCurrency
            ? income.baseAmount
            : convert(income.amount, income.currency, baseCurrency, rates)
        return sum + base
      }

      // Ingreso fijo: si ya esta confirmado en este mes, usar el recibo
      const receipt = receipts.find((r) => r.incomeId === income.id)
      if (receipt) {
        const base =
          receipt.baseAmount !== undefined && receipt.baseCurrency === baseCurrency
            ? receipt.baseAmount
            : convert(receipt.amount, receipt.currency, baseCurrency, rates)
        return sum + base
      }

      // Si es un mes pasado y no tiene recibo, no fue cobrado en ese mes
      if (isPastMonth) return sum

      const base =
        income.baseAmount !== undefined && income.baseCurrency === baseCurrency
          ? income.baseAmount
          : convert(income.amount, income.currency, baseCurrency, rates)
      const factor = MONTHLY_FACTOR[income.recurrence ?? 'monthly'] ?? 1
      return sum + base * factor
    }, 0)
  }, [incomes, receipts, rates, baseCurrency, currentYearMonth])

  const confirmedTotal = useMemo<number | null>(() => {
    if (!rates) return null

    return receipts.reduce((sum, receipt) => {
      if (receipt.baseAmount !== undefined && receipt.baseCurrency === baseCurrency) {
        return sum + receipt.baseAmount
      }
      return sum + convert(receipt.amount, receipt.currency, baseCurrency, rates)
    }, 0)
  }, [receipts, rates, baseCurrency])

  const create = useCallback(
    async (input: IncomeInput): Promise<Income> => {
      let baseAmount = input.baseAmount
      let resolvedBaseCurrency = input.baseCurrency
      if (rates && baseAmount === undefined) {
        baseAmount = convert(input.amount, input.currency, baseCurrency, rates)
        resolvedBaseCurrency = baseCurrency
      }

      const created = await insertIncome(
        {
          ...input,
          baseAmount,
          baseCurrency: resolvedBaseCurrency
        },
        generateId()
      )
      emit('incomes-changed')

      return created
    },
    [rates, baseCurrency]
  )

  const edit = useCallback(
    async (id: string, changes: Partial<IncomeInput>): Promise<Income> => {
      let baseAmount = changes.baseAmount
      let resolvedBaseCurrency = changes.baseCurrency
      if (changes.amount !== undefined || changes.currency !== undefined) {
        const targetAmount = changes.amount ?? incomes.find((i) => i.id === id)?.amount ?? 0
        const targetCurrency =
          changes.currency ?? incomes.find((i) => i.id === id)?.currency ?? 'USD'
        if (rates && baseAmount === undefined) {
          baseAmount = convert(targetAmount, targetCurrency, baseCurrency, rates)
          resolvedBaseCurrency = baseCurrency
        }
      }

      const edited = await updateIncome(id, {
        ...changes,
        ...(baseAmount !== undefined ? { baseAmount, baseCurrency: resolvedBaseCurrency } : {})
      })
      emit('incomes-changed')

      return edited
    },
    [incomes, rates, baseCurrency]
  )

  const remove = useCallback(async (id: string): Promise<void> => {
    await deleteIncome(id)
    emit('incomes-changed')
  }, [])

  const confirmReceipt = useCallback(
    async (income: Income): Promise<IncomeReceipt> => {
      const baseAmount =
        income.baseAmount !== undefined && income.baseCurrency === baseCurrency
          ? income.baseAmount
          : rates
            ? convert(income.amount, income.currency, baseCurrency, rates)
            : undefined
      const receipt = await confirmIncomeReceipt(
        income,
        currentYearMonth,
        generateId(),
        baseAmount,
        baseCurrency
      )
      emit('income-receipts-changed')

      return receipt
    },
    [currentYearMonth, rates, baseCurrency]
  )

  const unconfirmReceipt = useCallback(
    async (incomeId: string): Promise<void> => {
      await deleteIncomeReceipt(incomeId, currentYearMonth)
      emit('income-receipts-changed')
    },
    [currentYearMonth]
  )

  return {
    incomes,
    receipts,
    pendingConfirmations,
    loading,
    error,
    monthlyTotal,
    confirmedTotal,
    isConfirmedThisMonth,
    reload,
    create,
    edit,
    remove,
    confirmReceipt,
    unconfirmReceipt
  }
}
