/**
 * Pantalla EditIncome: modificacion de una fuente de ingreso existente.
 * Carga los datos del ingreso segun el parametro id de la ruta y
 * persiste los cambios actualizados en la base de datos local.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { IncomeEditor, type IncomeDraft } from '@src/components/organisms/IncomeEditor'
import { COLORS } from '@src/constants/theme'
import { getIncome } from '@src/db/incomes'
import { useIncomes } from '@src/hooks/useIncomes'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { isValidIncomeRow, parseDayFromText } from '@src/lib/validation'
import type { BaseCurrency, Income, IncomeInput } from '@src/types/domain'

/**
 * Pantalla dedicada para editar una fuente de ingreso registrada.
 * @returns Formulario precargado con cabecera de cierre y guardado
 */
export default function EditIncome() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

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

  async function handleSave(): Promise<void> {
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
  }

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-5 py-4">
        <Typography variant="title">Editar ingreso</Typography>
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
        {loading ? (
          <View className="py-12 items-center justify-center">
            <Typography variant="caption">Cargando ingreso...</Typography>
          </View>
        ) : (
          <IncomeEditor
            values={values}
            onChange={setValues}
            actionLabel="Guardar cambios"
            loading={saving}
            onConfirm={() => void handleSave()}
            onCancel={() => router.back()}
            testIDBase="income"
          />
        )}
        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  )
}
