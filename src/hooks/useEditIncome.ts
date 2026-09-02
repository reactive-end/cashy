/**
 * Hook useEditIncome: gestiona la carga previa de una fuente de ingreso por ID,
 * la edicion en formulario y persistencia de cambios en /edit-income/[id].
 */

import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import type { IncomeDraft } from '@src/components/organisms/IncomeEditor'
import { getIncome } from '@src/db/incomes'
import { useIncomes } from '@src/hooks/useIncomes'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { isValidIncomeRow, parseDayFromText } from '@src/lib/validation'
import type { BaseCurrency, Income, IncomeInput } from '@src/types/domain'

export interface UseEditIncomeResult {
  income: Income | null
  values: IncomeDraft
  setValues: React.Dispatch<React.SetStateAction<IncomeDraft>>
  loading: boolean
  saving: boolean
  isValid: boolean
  handleSave: () => Promise<void>
  close: () => void
}

/**
 * Hook para la pantalla de edicion de un ingreso.
 * @param id Identificador unico del ingreso
 * @returns Datos cargados, estado de borrador y accion de guardado
 */
export function useEditIncome(id: string | undefined): UseEditIncomeResult {
  const router = useRouter()
  const [income, setIncome] = useState<Income | null>(null)
  const [values, setValues] = useState<IncomeDraft>({
    name: '',
    amountCents: 0,
    currency: 'USD',
    paydayDayText: '',
    type: 'fixed',
    recurrence: 'monthly'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const incomesState = useIncomes(ratesState.rates, baseCurrency)

  useEffect(() => {
    let active = true

    if (typeof id === 'string') {
      getIncome(id).then((found) => {
        if (!active || !found) return
        setIncome(found)
        setValues({
          name: found.name,
          amountCents: Math.round(found.amount * 100),
          currency: found.currency,
          paydayDayText: String(found.paydayDay),
          type: found.type ?? 'fixed',
          recurrence: found.recurrence ?? 'monthly'
        })
        setLoading(false)
      })
    }

    return () => {
      active = false
    }
  }, [id])

  const isValid = isValidIncomeRow(values)

  const close = useCallback(() => {
    router.back()
  }, [router])

  const handleSave = useCallback(async (): Promise<void> => {
    if (!id || !isValidIncomeRow(values) || saving) return

    setSaving(true)
    try {
      const isUnique = values.type === 'unique'
      const changes: Partial<IncomeInput> = {
        name: values.name.trim(),
        amount: values.amountCents / 100,
        currency: values.currency,
        type: values.type ?? 'fixed',
        recurrence: isUnique ? undefined : (values.recurrence ?? 'monthly'),
        paydayDay: isUnique
          ? (parseDayFromText(values.paydayDayText) ?? income?.paydayDay ?? new Date().getDate())
          : (parseDayFromText(values.paydayDayText) as number)
      }

      await incomesState.edit(id, changes)
      router.back()
    } catch {
      setSaving(false)
    }
  }, [id, values, saving, income, incomesState, router])

  return {
    income,
    values,
    setValues,
    loading,
    saving,
    isValid,
    handleSave,
    close
  }
}
