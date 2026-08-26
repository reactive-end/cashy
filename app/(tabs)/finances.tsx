/**
 * Pantalla principal de Finanzas (Hub): presenta el acceso principal a la
 * gestion de Gastos y a la gestion de Ingresos mediante tarjetas interactivas,
 * junto a un resumen rapido del balance disponible.
 */

import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'
import { useExpenses } from '@src/hooks/useExpenses'
import { useIncomes } from '@src/hooks/useIncomes'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { formatAmount } from '@src/lib/format'
import type { BaseCurrency } from '@src/types/domain'

export default function Finances() {
  const router = useRouter()
  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const expensesState = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)
  const incomesState = useIncomes(ratesState.rates, baseCurrency)

  const summary = expensesState.monthlySummary
  const totalSpent = summary ? summary.totalFixed + summary.totalUnique : 0
  const formattedSpent = formatAmount(totalSpent, baseCurrency)
  const confirmedTotal = incomesState.confirmedTotal ?? 0
  const formattedConfirmed = formatAmount(confirmedTotal, baseCurrency)
  const formattedBalance = summary ? formatAmount(summary.netBalance, baseCurrency) : '$ --'

  const expensesSubtitle = useMemo(() => {
    const count = expensesState.expenses.length
    const label = count === 1 ? '1 registrado' : `${count} registrados`
    return `${label} · ${formattedSpent} este mes`
  }, [expensesState.expenses.length, formattedSpent])

  const incomesSubtitle = useMemo(() => {
    const count = incomesState.incomes.length
    const label = count === 1 ? '1 fuente' : `${count} fuentes`
    return `${label} · ${formattedConfirmed} cobrado`
  }, [incomesState.incomes.length, formattedConfirmed])

  return (
    <Screen scrollable refreshing={ratesState.refreshing} onRefresh={ratesState.refresh}>
      <View className="gap-6 pt-6 pb-12">
        {/* Titulo y descripcion */}
        <View className="gap-1">
          <Typography variant="display">Finanzas</Typography>
          <Typography variant="body" className="text-muted">
            Gestiona tus gastos fijos y unicos o administra tus fuentes de ingreso.
          </Typography>
        </View>

        {/* Tarjetas interactivas de navegacion */}
        <View className="gap-4">
          {/* Card Gastos */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir a Gastos"
            onPress={() => router.push('/expenses')}
            className="active:opacity-75"
          >
            <Card className="flex-row items-center gap-4 p-4">
              <View className="size-12 items-center justify-center rounded-full border border-line bg-paper">
                <Icon name="repeat" size={22} color="#1C1C1A" />
              </View>

              <View className="flex-1 min-w-0 gap-0.5">
                <Typography variant="figure" className="text-[17px] font-sans-semibold">
                  Gastos
                </Typography>
                <Typography variant="caption" className="text-muted" numberOfLines={1}>
                  {expensesSubtitle}
                </Typography>
              </View>

              <Icon name="chevronRight" size={20} color={COLORS.muted} />
            </Card>
          </Pressable>

          {/* Card Ingresos */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir a Ingresos"
            onPress={() => router.push('/incomes')}
            className="active:opacity-75"
          >
            <Card className="flex-row items-center gap-4 p-4">
              <View className="size-12 items-center justify-center rounded-full border border-accent/30 bg-accent-soft">
                <Icon name="savings" size={22} color={COLORS.accent} />
              </View>

              <View className="flex-1 min-w-0 gap-0.5">
                <Typography variant="figure" className="text-[17px] font-sans-semibold">
                  Ingresos
                </Typography>
                <Typography variant="caption" className="text-muted" numberOfLines={1}>
                  {incomesSubtitle}
                </Typography>
              </View>

              <Icon name="chevronRight" size={20} color={COLORS.muted} />
            </Card>
          </Pressable>
        </View>

        {/* Resumen contable rapido */}
        <Card className="gap-3 bg-card/60">
          <View className="flex-row items-center justify-between">
            <Typography variant="label">Balance de este mes</Typography>
            <Typography variant="figure" className="text-accent text-[15px]">
              {formattedBalance}
            </Typography>
          </View>

          <View className="flex-row items-center justify-between pt-1 border-t border-line/40">
            <View className="gap-0.5">
              <Typography variant="caption" className="text-muted">
                Ingresos cobrados
              </Typography>
              <Typography variant="body" className="font-sans-semibold">
                {formattedConfirmed}
              </Typography>
            </View>

            <View className="items-end gap-0.5">
              <Typography variant="caption" className="text-muted">
                Gastos del mes
              </Typography>
              <Typography variant="body" className="font-sans-semibold">
                {formattedSpent}
              </Typography>
            </View>
          </View>
        </Card>
      </View>
    </Screen>
  )
}
