/**
 * Componente MonthNavigator: permite navegar secuencialmente entre
 * meses hacia el pasado y el futuro, mostrando el mes actual legible
 * y permitiendo volver rapidamente al mes en curso.
 */

import { Pressable, View } from 'react-native'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'
import { formatYearMonth } from '@src/db/incomeReceipts'
import { formatYearMonthLabel, shiftYearMonth } from '@src/lib/format'

import type { MonthNavigatorProps } from './MonthNavigator.d'

export function MonthNavigator({
  currentYearMonth,
  onMonthChange,
  maxYearMonth,
  testID = 'month-navigator'
}: MonthNavigatorProps) {
  const actualYearMonth = formatYearMonth()
  const isActualMonth = currentYearMonth === actualYearMonth
  const canGoNext = !maxYearMonth || currentYearMonth < maxYearMonth

  const handlePrevious = () => {
    onMonthChange(shiftYearMonth(currentYearMonth, -1))
  }

  const handleNext = () => {
    if (!canGoNext) return
    onMonthChange(shiftYearMonth(currentYearMonth, 1))
  }

  const handleResetToCurrent = () => {
    onMonthChange(actualYearMonth)
  }

  return (
    <View
      testID={testID}
      className="flex-row items-center justify-between rounded-2xl border border-line bg-paper px-3 py-2.5 shadow-sm"
    >
      {/* Boton mes anterior */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mes anterior"
        testID={`${testID}-prev`}
        onPress={handlePrevious}
        className="size-9 items-center justify-center rounded-xl bg-card border border-line active:opacity-60"
      >
        <Icon name="chevronLeft" size={18} color={COLORS.ink} />
      </Pressable>

      {/* Mes visible y chip para volver al mes actual */}
      <View className="items-center gap-0.5">
        <Typography variant="figure" className="text-[15px] font-sans-semibold text-ink">
          {formatYearMonthLabel(currentYearMonth)}
        </Typography>

        {!isActualMonth ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver al mes actual"
            testID={`${testID}-current-btn`}
            onPress={handleResetToCurrent}
            className="rounded-full bg-accent-soft px-2 py-0.5 active:opacity-60"
          >
            <Typography variant="caption" className="text-[11px] font-medium text-accent">
              Mes actual
            </Typography>
          </Pressable>
        ) : null}
      </View>

      {/* Boton mes siguiente */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mes siguiente"
        testID={`${testID}-next`}
        onPress={handleNext}
        disabled={!canGoNext}
        className={`size-9 items-center justify-center rounded-xl bg-card border border-line active:opacity-60 ${
          !canGoNext ? 'opacity-30' : ''
        }`}
      >
        <Icon name="chevronRight" size={18} color={COLORS.ink} />
      </Pressable>
    </View>
  )
}
