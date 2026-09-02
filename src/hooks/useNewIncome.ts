/**
 * Hook useNewIncome: gestiona el estado de borrador, validacion y
 * persistencia para la creacion de un nuevo ingreso en /new-income.
 */

import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'

import type { IncomeDraft } from '@src/components/organisms/IncomeEditor'
import { useIncomes } from '@src/hooks/useIncomes'
import { emptyRow } from '@src/hooks/useOnboarding'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { isValidIncomeRow, parseDayFromText } from '@src/lib/validation'
import type { BaseCurrency, IncomeInput } from '@src/types/domain'

export interface UseNewIncomeResult {
  values: IncomeDraft
  setValues: React.Dispatch<React.SetStateAction<IncomeDraft>>
  saving: boolean
  isValid: boolean
  handleSave: () => Promise<void>
  close: () => void
}

/**
 * Hook para la pantalla de registro de nuevo ingreso.
 * @returns Estado del borrador, validacion y accion de guardado
 */
export function useNewIncome(): UseNewIncomeResult {
  const router = useRouter()
  const [values, setValues] = useState<IncomeDraft>(emptyRow)
  const [saving, setSaving] = useState(false)

  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const incomesState = useIncomes(ratesState.rates, baseCurrency)

  const isValid = isValidIncomeRow(values)

  const close = useCallback(() => {
    router.back()
  }, [router])

  const handleSave = useCallback(async (): Promise<void> => {
    if (!isValidIncomeRow(values) || saving) return

    setSaving(true)
    try {
      const isUnique = values.type === 'unique'
      const input: IncomeInput = {
        name: values.name.trim(),
        amount: values.amountCents / 100,
        currency: values.currency,
        type: values.type ?? 'fixed',
        recurrence: isUnique ? undefined : (values.recurrence ?? 'monthly'),
        paydayDay: isUnique
          ? (parseDayFromText(values.paydayDayText) ?? new Date().getDate())
          : (parseDayFromText(values.paydayDayText) as number)
      }

      await incomesState.create(input)
      router.back()
    } catch {
      setSaving(false)
    }
  }, [values, saving, incomesState, router])

  return {
    values,
    setValues,
    saving,
    isValid,
    handleSave,
    close
  }
}
