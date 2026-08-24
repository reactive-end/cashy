/**
 * NewExpense modal: creation of fixed or unique expenses.
 * Presented as a sheet over the tabs and returns on close.
 * El formulario vive en un ScrollView con padding inferior
 * para que el boton de guardado siempre sea alcanzable.
 */

import { useRouter } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { ExpenseForm } from '@src/components/organisms/ExpenseForm'
import { useExpenses } from '@src/hooks/useExpenses'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'

/**
 * Pantalla modal de registro de un gasto nuevo.
 * @returns Formulario de alta con encabezado de cierre
 */
export default function NewExpense() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency = settings?.baseCurrency ?? 'USD'
  const gastos = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Typography variant="title">Nuevo gasto</Typography>
        <Pressable onPress={() => router.back()} className="active:opacity-60">
          <Icon name="close" size={22} color="#6B6B66" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ExpenseForm
          onSave={async (entrada) => {
            await gastos.createExpense(entrada)
            router.back()
          }}
        />
        {/* Espaciador con altura del area segura: evita style dinamico en el ScrollView */}
        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  )
}
