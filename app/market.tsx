/**
 * Market screen: specialized calculator for market shopping with
 * item accumulation, multi-currency conversion and direct expense registration.
 */

import { useRouter } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { MarketCalculator } from '@src/components/organisms/MarketCalculator'
import { COLORS } from '@src/constants/theme'
import { useExpenses } from '@src/hooks/useExpenses'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import type { BaseCurrency } from '@src/types/domain'

/**
 * Pantalla dedicada de Mercado.
 * @returns Interfaz completa de compras con cabecera de cierre
 */
export default function MarketScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const reminderHour = settings?.reminderHour ?? 9
  const expensesState = useExpenses(ratesState.rates, baseCurrency, reminderHour)

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 py-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          className="size-10 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
          testID="btn-close-market"
        >
          <Icon name="back" size={20} color={COLORS.ink} />
        </Pressable>
        <Typography variant="display">Mercado</Typography>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-3"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MarketCalculator
          rates={ratesState.rates}
          onRegisterExpense={async (expenseInput) => {
            await expensesState.createExpense(expenseInput)
          }}
        />
        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  )
}
