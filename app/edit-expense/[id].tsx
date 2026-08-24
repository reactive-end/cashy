/**
 * EditExpense screen: modification and deletion of an existing expense.
 * Loads the expense by id from the /expense/[id] route.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { ExpenseForm } from '@src/components/organisms/ExpenseForm'
import { getExpense } from '@src/db/expenses'
import { useExpenses } from '@src/hooks/useExpenses'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import type { Expense } from '@src/types/domain'

/**
 * Pantalla de edicion de un gasto concreto.
 * @returns Formulario precargado con acciones de guardado y borrado
 */
export default function EditExpense() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)

  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency = settings?.baseCurrency ?? 'USD'
  const gastos = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)

  useEffect(() => {
    let activo = true

    if (typeof id === 'string') {
      getExpense(id).then((encontrado) => {
        if (!activo) return
        setExpense(encontrado)
        setLoading(false)
      })
    }

    return () => {
      activo = false
    }
  }, [id])

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-3 px-5 py-4">
        <Pressable onPress={() => router.back()} className="active:opacity-60">
          <Icon name="back" size={22} color="#6B6B66" />
        </Pressable>
        <Typography variant="title">Editar gasto</Typography>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Typography variant="caption">Cargando...</Typography>
        ) : !expense ? (
          <Typography variant="body">Este gasto ya no existe.</Typography>
        ) : (
          <ExpenseForm
            initialExpense={expense}
            onSave={async (entrada) => {
              await gastos.editExpense(expense.id, entrada)
              router.back()
            }}
            onDelete={async () => {
              await gastos.removeExpense(expense.id)
              router.back()
            }}
          />
        )}
        {/* Espaciador con altura del area segura: evita style dinamico en el ScrollView */}
        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  )
}
