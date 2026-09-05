/**
 * Hook useIncomeDetail: gestiona el estado, lectura y operaciones
 * de la vista de detalle de un ingreso (/income/[id]).
 */

import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'

import { getIncome } from '@src/db/incomes'
import { useIncomes } from '@src/hooks/useIncomes'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { convert } from '@src/lib/conversions'
import { RECURRENCE_LABELS, type BaseCurrency, type Income } from '@src/types/domain'

export interface IncomeDetailRow {
  label: string
  value: string
}

export interface UseIncomeDetailResult {
  income: Income | null
  loading: boolean
  isConfirmed: boolean
  montoConvertido: number | null
  baseCurrency: BaseCurrency
  detailRows: IncomeDetailRow[]
  deleteConfirmationVisible: boolean
  setDeleteConfirmationVisible: (visible: boolean) => void
  openEdit: () => void
  handleToggleReceipt: () => Promise<void>
  handleConfirmDelete: () => Promise<void>
}

/**
 * Hook para la pantalla de detalle de un ingreso.
 * @param id Identificador unico del ingreso
 * @returns Estado cargado, derivaciones de visualizacion y callbacks
 */
export function useIncomeDetail(id: string | undefined): UseIncomeDetailResult {
  const router = useRouter()
  const [income, setIncome] = useState<Income | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false)

  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const incomesState = useIncomes(ratesState.rates, baseCurrency)

  useFocusEffect(
    useCallback(() => {
      let active = true

      if (typeof id === 'string') {
        getIncome(id).then((found) => {
          if (!active) return
          setIncome(found)
          setLoading(false)
        })
      }

      return () => {
        active = false
      }
    }, [id])
  )

  const isConfirmed = useMemo(() => {
    if (!income) return false
    return incomesState.receipts.some((r) => r.incomeId === income.id)
  }, [income, incomesState.receipts])

  const receipt = useMemo(() => {
    if (!income) return undefined
    return incomesState.receipts.find((r) => r.incomeId === income.id)
  }, [income, incomesState.receipts])

  const montoConvertido = useMemo(() => {
    if (!income || income.currency === baseCurrency) {
      return null
    }

    if (receipt && receipt.baseAmount !== undefined && receipt.baseCurrency === baseCurrency) {
      return receipt.baseAmount
    }

    if (income.baseAmount !== undefined && income.baseCurrency === baseCurrency) {
      return income.baseAmount
    }

    if (ratesState.rates) {
      return convert(income.amount, income.currency, baseCurrency, ratesState.rates)
    }

    return null
  }, [income, receipt, ratesState.rates, baseCurrency])

  const detailRows = useMemo<IncomeDetailRow[]>(() => {
    if (!income) return []

    const rows: IncomeDetailRow[] = [
      {
        label: 'Concepto',
        value: income.name
      },
      {
        label: 'Tipo',
        value: income.type === 'unique' ? 'Ingreso unico' : 'Ingreso fijo'
      }
    ]

    if (income.type !== 'unique' && income.recurrence) {
      rows.push({
        label: 'Repeticion',
        value: RECURRENCE_LABELS[income.recurrence]
      })
    }

    if (income.type !== 'unique') {
      rows.push({
        label: 'Dia de cobro',
        value: `Dia ${income.paydayDay} de cada mes`
      })
    }

    rows.push({
      label: 'Moneda original',
      value: income.currency
    })

    return rows
  }, [income])

  const openEdit = useCallback(() => {
    if (!income) return
    router.push({ pathname: '/edit-income/[id]', params: { id: income.id } })
  }, [income, router])

  const handleToggleReceipt = useCallback(async (): Promise<void> => {
    if (!income) return
    if (isConfirmed) {
      await incomesState.unconfirmReceipt(income.id)
    } else {
      await incomesState.confirmReceipt(income)
    }
  }, [income, isConfirmed, incomesState])

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (!income) return
    setDeleteConfirmationVisible(false)
    await incomesState.remove(income.id)
    router.back()
  }, [income, incomesState, router])

  return {
    income,
    loading,
    isConfirmed,
    montoConvertido,
    baseCurrency,
    detailRows,
    deleteConfirmationVisible,
    setDeleteConfirmationVisible,
    openEdit,
    handleToggleReceipt,
    handleConfirmDelete
  }
}
