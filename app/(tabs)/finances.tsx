/**
 * Pantalla principal de Finanzas (Hub): presenta el acceso principal a la
 * gestion de Gastos y a la gestion de Ingresos mediante tarjetas interactivas,
 * junto a un resumen rapido del balance disponible.
 * La logica de totales y subtitulos reside en useFinancesScreen.
 */

import { Pressable, View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { MonthNavigator } from '@src/components/molecules/MonthNavigator'
import { COLORS } from '@src/constants/theme'
import { useFinancesScreen } from '@src/hooks/useFinancesScreen'

export default function Finances() {
  const {
    selectedYearMonth,
    isCurrentMonth,
    monthLabel,
    handleMonthChange,
    expensesSubtitle,
    incomesSubtitle,
    formattedBalance,
    formattedConfirmed,
    formattedSpent,
    refreshing,
    onRefresh,
    openExpenses,
    openIncomes
  } = useFinancesScreen()

  return (
    <Screen scrollable refreshing={refreshing} onRefresh={onRefresh}>
      <View className="gap-6 pt-6 pb-12">
        {/* Titulo y descripcion */}
        <View className="gap-1">
          <Typography variant="display">Finanzas</Typography>
          <Typography variant="body" className="text-muted">
            Gestiona tus gastos fijos y unicos o administra tus fuentes de ingreso.
          </Typography>
        </View>

        {/* Navegador de meses para consulta historica */}
        <MonthNavigator currentYearMonth={selectedYearMonth} onMonthChange={handleMonthChange} />

        {/* Tarjetas interactivas de navegacion */}
        <View className="gap-4">
          {/* Card Gastos */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir a Gastos"
            onPress={openExpenses}
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
            onPress={openIncomes}
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
            <Typography variant="label">
              {isCurrentMonth ? 'Balance de este mes' : `Balance de ${monthLabel}`}
            </Typography>
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
                {isCurrentMonth ? 'Gastos del mes' : `Gastos de ${monthLabel}`}
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
