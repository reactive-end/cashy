/**
 * Hook useExpenseDetail: administra el estado, lectura y operaciones
 * de la vista de detalle de un gasto (/expense/[id]).
 */

import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'

import { getExpenseReceiptsByExpense } from '@src/db/expenseReceipts'
import { getExpense } from '@src/db/expenses'
import { useExpenses } from '@src/hooks/useExpenses'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { convert } from '@src/lib/conversions'
import { formatDate } from '@src/lib/format'
import {
  RECURRENCE_LABELS,
  type BaseCurrency,
  type Expense,
  type ExpenseReceipt
} from '@src/types/domain'

export interface DetailRow {
  label: string
  value: string
}

export interface UseExpenseDetailResult {
  expense: Expense | null
  expenseReceipts: ExpenseReceipt[]
  loading: boolean
  montoConvertido: number | null
  baseCurrency: BaseCurrency
  detailRows: DetailRow[]
  isPaidThisMonth: boolean
  deleteConfirmationVisible: boolean
  setDeleteConfirmationVisible: (visible: boolean) => void
  receiptToRevert: ExpenseReceipt | null
  setReceiptToRevert: (receipt: ExpenseReceipt | null) => void
  markingPaid: boolean
  openEdit: () => void
  handleConfirmDelete: () => Promise<void>
  handleConfirmRevert: () => Promise<void>
  handleMarkAsPaid: () => Promise<void>
}

/**
 * Hook para la pantalla de detalle de un gasto.
 * @param id Identificador unico del gasto de la ruta
 * @returns Estado cargado, derivaciones de visualizacion y callbacks de accion
 */
export function useExpenseDetail(id: string | undefined): UseExpenseDetailResult {
  const router = useRouter()
  const [expense, setExpense] = useState<Expense | null>(null)
  const [expenseReceipts, setExpenseReceipts] = useState<ExpenseReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false)
  const [receiptToRevert, setReceiptToRevert] = useState<ExpenseReceipt | null>(null)
  const [markingPaid, setMarkingPaid] = useState(false)

  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const expensesState = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)

  useFocusEffect(
    useCallback(() => {
      let active = true

      if (typeof id === 'string') {
        Promise.all([getExpense(id), getExpenseReceiptsByExpense(id)]).then(([found, receipts]) => {
          if (!active) return
          setExpense(found)
          setExpenseReceipts(receipts)
          setLoading(false)
        })
      }

      return () => {
        active = false
      }
    }, [id])
  )

  const isPaidThisMonth = useMemo(() => {
    if (!expense) return false
    return expensesState.isPaidThisMonth(expense.id)
  }, [expense, expensesState])

  const montoConvertido = useMemo(() => {
    if (!expense || !ratesState.rates || expense.currency === baseCurrency) {
      return null
    }
    return convert(expense.amount, expense.currency, baseCurrency, ratesState.rates)
  }, [expense, ratesState.rates, baseCurrency])

  const detailRows = useMemo<DetailRow[]>(() => {
    if (!expense) return []

    const rows: DetailRow[] = [
      {
        label: 'Tipo',
        value: expense.type === 'fixed' ? 'Gasto fijo' : 'Gasto unico'
      },
      {
        label: 'Categoria',
        value: expense.category?.trim() || 'Sin categoria'
      }
    ]

    if (expense.type === 'fixed' && expense.recurrence) {
      rows.push({
        label: 'Repeticion',
        value: RECURRENCE_LABELS[expense.recurrence]
      })
    }

    if (expense.nextDueDate) {
      rows.push({
        label: 'Proximo vencimiento',
        value: formatDate(expense.nextDueDate)
      })
    }

    if (expense.type === 'fixed' && expense.dueDay) {
      rows.push({
        label: 'Dia de cobro mensual',
        value: `Dia ${expense.dueDay} de cada mes`
      })
    }

    if (expense.note?.trim()) {
      rows.push({
        label: 'Nota',
        value: expense.note.trim()
      })
    }

    return rows
  }, [expense])

  const openEdit = useCallback(() => {
    if (!expense) return
    router.push({ pathname: '/edit-expense/[id]', params: { id: expense.id } })
  }, [expense, router])

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (!expense) return
    setDeleteConfirmationVisible(false)
    await expensesState.removeExpense(expense.id)
    router.back()
  }, [expense, expensesState, router])

  const handleConfirmRevert = useCallback(async (): Promise<void> => {
    if (!receiptToRevert || !expense) return
    const target = receiptToRevert
    setReceiptToRevert(null)
    await expensesState.unmarkAsPaid(expense, target.yearMonth)
    const [updatedReceipts, updatedExpense] = await Promise.all([
      getExpenseReceiptsByExpense(expense.id),
      getExpense(expense.id)
    ])
    setExpenseReceipts(updatedReceipts)
    if (updatedExpense) setExpense(updatedExpense)
  }, [receiptToRevert, expense, expensesState])

  const handleMarkAsPaid = useCallback(async (): Promise<void> => {
    if (!expense) return
    setMarkingPaid(true)
    try {
      await expensesState.markAsPaid(expense)
      const [updatedReceipts, updatedExpense] = await Promise.all([
        getExpenseReceiptsByExpense(expense.id),
        getExpense(expense.id)
      ])
      setExpenseReceipts(updatedReceipts)
      if (updatedExpense) setExpense(updatedExpense)
    } finally {
      setMarkingPaid(false)
    }
  }, [expense, expensesState])

  return {
    expense,
    expenseReceipts,
    loading,
    montoConvertido,
    baseCurrency,
    detailRows,
    isPaidThisMonth,
    deleteConfirmationVisible,
    setDeleteConfirmationVisible,
    receiptToRevert,
    setReceiptToRevert,
    markingPaid,
    openEdit,
    handleConfirmDelete,
    handleConfirmRevert,
    handleMarkAsPaid
  }
}
