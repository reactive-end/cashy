/**
 * Hook useEditExpense: gestiona la carga previa de un gasto existente
 * por ID y la persistencia de cambios o eliminacion en /edit-expense/[id].
 */

import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { getExpense } from '@src/db/expenses'
import { useExpenses } from '@src/hooks/useExpenses'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import type { Expense, ExpenseInput } from '@src/types/domain'

export interface UseEditExpenseResult {
  expense: Expense | null
  loading: boolean
  handleSave: (input: ExpenseInput) => Promise<void>
  handleDelete: () => Promise<void>
}

/**
 * Hook para la pantalla de edicion de un gasto.
 * @param id Identificador unico del gasto a editar
 * @returns Gasto cargado y callbacks de persistencia o eliminacion
 */
export function useEditExpense(id: string | undefined): UseEditExpenseResult {
  const router = useRouter()
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)

  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency = settings?.baseCurrency ?? 'USD'
  const expensesState = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)

  useEffect(() => {
    let active = true

    if (typeof id === 'string') {
      getExpense(id).then((found) => {
        if (!active) return
        setExpense(found)
        setLoading(false)
      })
    }

    return () => {
      active = false
    }
  }, [id])

  const handleSave = useCallback(
    async (input: ExpenseInput): Promise<void> => {
      if (!expense) return
      await expensesState.editExpense(expense.id, input)
      router.back()
    },
    [expense, expensesState, router]
  )

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!expense) return
    await expensesState.removeExpense(expense.id)
    router.back()
  }, [expense, expensesState, router])

  return {
    expense,
    loading,
    handleSave,
    handleDelete
  }
}
