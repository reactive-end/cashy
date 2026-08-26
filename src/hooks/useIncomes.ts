/**
 * Hook useIncomes: reactive layer over the incomes repository.
 * Expone el listado, el total mensual convertido a moneda base y
 * las operaciones CRUD que emiten 'incomes-changed' para mantener
 * sincronizadas todas las pantallas montadas.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

import { deleteIncome, getIncomes, insertIncome, updateIncome } from '@src/db/incomes'
import { convert } from '@src/lib/conversions'
import { EXPENSES_LOAD_ERROR_MESSAGE } from '@src/lib/errorMessages'
import { emit, subscribe } from '@src/lib/events'
import { generateId } from '@src/lib/ids'
import type { BaseCurrency, ExchangeRates, Income, IncomeInput } from '@src/types/domain'

/** Estado y acciones expuestos por el hook de ingresos */
export interface UseIncomesResult {
  /** Todos los ingresos cargados desde la base local */
  incomes: Income[]
  /** true durante la primera lectura */
  loading: boolean
  /** Mensaje amigable del ultimo error de base de datos */
  error: string | null
  /** Total mensual convertido a la moneda base; null sin tasas */
  monthlyTotal: number | null
  /** Recarga manual desde la base local (pull-to-refresh) */
  reload: () => Promise<void>
  /** Crea un ingreso nuevo */
  create: (input: IncomeInput) => Promise<Income>
  /** Edita un ingreso existente */
  edit: (id: string, changes: Partial<IncomeInput>) => Promise<Income>
  /** Elimina un ingreso por identificador */
  remove: (id: string) => Promise<void>
}

/**
 * Administra los ingresos con total mensual derivado de las tasas.
 * @param rates Snapshot de tasas actual (null mientras carga)
 * @param baseCurrency Moneda elegida para resumenes
 * @returns Estado reactivo completo del dominio de ingresos
 */
export function useIncomes(
  rates: ExchangeRates | null,
  baseCurrency: BaseCurrency
): UseIncomesResult {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setIncomes(await getIncomes())
      setError(null)
    } catch {
      // Mensaje amigable fijo: nunca se filtran textos tecnicos.
      setError(EXPENSES_LOAD_ERROR_MESSAGE)
    }
  }, [])

  useEffect(() => {
    let active = true

    getIncomes()
      .then((fetched) => {
        if (active) setIncomes(fetched)
      })
      .catch(() => {
        if (active) setError(EXPENSES_LOAD_ERROR_MESSAGE)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    // Sincronizacion entre instancias: onboarding, Ajustes u otras
    // pantallas emiten 'incomes-changed' y esta instancia recarga.
    const unsubscribe = subscribe('incomes-changed', () => {
      if (active) void reload()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [reload])

  const monthlyTotal = useMemo<number | null>(() => {
    if (!rates || incomes.length === 0) return null

    return incomes.reduce(
      (sum, income) => sum + convert(income.amount, income.currency, baseCurrency, rates),
      0
    )
  }, [incomes, rates, baseCurrency])

  const create = useCallback(async (input: IncomeInput): Promise<Income> => {
    const created = await insertIncome(input, generateId())
    emit('incomes-changed')

    return created
  }, [])

  const edit = useCallback(async (id: string, changes: Partial<IncomeInput>): Promise<Income> => {
    const edited = await updateIncome(id, changes)
    emit('incomes-changed')

    return edited
  }, [])

  const remove = useCallback(async (id: string): Promise<void> => {
    await deleteIncome(id)
    emit('incomes-changed')
  }, [])

  return {
    incomes,
    loading,
    error,
    monthlyTotal,
    reload,
    create,
    edit,
    remove
  }
}
