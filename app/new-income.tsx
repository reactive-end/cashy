/**
 * Pantalla NewIncome: creacion de fuentes de ingreso fijas o unicas.
 * Presentada como una pantalla modal dedicada sobre el arbol principal
 * que se puede cerrar en cualquier momento regresando a la vista previa.
 */

import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { IncomeEditor, type IncomeDraft } from '@src/components/organisms/IncomeEditor'
import { COLORS } from '@src/constants/theme'
import { useIncomes } from '@src/hooks/useIncomes'
import { emptyRow } from '@src/hooks/useOnboarding'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { isValidIncomeRow, parseDayFromText } from '@src/lib/validation'
import type { BaseCurrency, IncomeInput } from '@src/types/domain'

/**
 * Pantalla dedicada para registrar un nuevo ingreso en el sistema.
 * @returns Formulario de alta con cabecera de cierre y guardado inmediato
 */
export default function NewIncome() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [values, setValues] = useState<IncomeDraft>(emptyRow)
  const [saving, setSaving] = useState(false)

  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const incomesState = useIncomes(ratesState.rates, baseCurrency)

  async function handleSave(): Promise<void> {
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
  }

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Typography variant="title">Nuevo ingreso</Typography>
        <Pressable
          onPress={() => router.back()}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          <Icon name="close" size={22} color={COLORS.muted} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <IncomeEditor
          values={values}
          onChange={setValues}
          actionLabel="Guardar ingreso"
          loading={saving}
          onConfirm={() => void handleSave()}
          onCancel={() => router.back()}
          testIDBase="income"
        />
        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  )
}
