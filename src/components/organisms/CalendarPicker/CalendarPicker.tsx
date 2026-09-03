/**
 * Organismo CalendarPicker: calendario mensual navegable propio
 * del proyecto. Reemplaza al DateTimePicker nativo con la grilla
 * y los acentos del sistema de diseno.
 */

import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'
import { fromISODate, toISODate } from '@src/lib/recurrences'

import type { CalendarPickerProps } from './CalendarPicker.d'
import { useCalendar } from './useCalendar'

/**
 * Nombres legibles en espanol de los 12 meses del anio.
 */
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
] as const

/**
 * Construye la etiqueta de accesibilidad larga de un dia.
 * @param isoDate Fecha en formato yyyy-mm-dd
 * @returns Texto tipo "15 de agosto de 2026" para lectores de pantalla
 */
const LONG_DATE_FORMAT = new Intl.DateTimeFormat('es-VE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

function longLabel(isoDate: string): string {
  return LONG_DATE_FORMAT.format(fromISODate(isoDate))
}

/**
 * Renderiza el encabezado de navegacion, la fila de dias
 * y la grilla completa del mes visible.
 * Admite modo 'day' (dias individuales) o 'month' (selector de mes y anio).
 * @param props Fecha inicial, fecha minima, modo y callback de seleccion
 * @returns Calendario interactivo para modales y formularios
 */
export function CalendarPicker({
  value,
  minimumDate,
  mode = 'day',
  onChange
}: CalendarPickerProps) {
  const [pickingMonth, setPickingMonth] = useState(false)
  const isMonthView = mode === 'month' || pickingMonth

  const {
    viewYear,
    monthLabel,
    weekdayLabels,
    gridDays,
    selectedISO,
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousYear,
    goToNextYear,
    selectDay,
    selectMonth
  } = useCalendar(value)

  const actualYearMonth = toISODate(new Date()).slice(0, 7)
  const currentSelectedYM = value ? value.slice(0, 7) : null

  if (isMonthView) {
    return (
      <View className="gap-3">
        {/* Cabecera con selector de anio */}
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={goToPreviousYear}
            className="p-1 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Año anterior"
          >
            <Icon name="chevronLeft" size={20} color={COLORS.muted} />
          </Pressable>

          <Typography variant="figure" className="font-sans-semibold text-lg text-ink">
            {viewYear}
          </Typography>

          <Pressable
            onPress={goToNextYear}
            className="p-1 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Año siguiente"
          >
            <Icon name="chevronRight" size={20} color={COLORS.muted} />
          </Pressable>
        </View>

        {/* Grilla de 12 meses en 3 columnas */}
        <View className="flex-row flex-wrap gap-2 justify-between">
          {MONTH_NAMES.map((name, idx) => {
            const ym = `${viewYear}-${String(idx + 1).padStart(2, '0')}`
            const isSelected = ym === currentSelectedYM
            const isActual = ym === actualYearMonth

            return (
              <Pressable
                key={ym}
                onPress={() => {
                  selectMonth(idx)
                  if (mode === 'month') {
                    onChange(ym)
                  } else {
                    setPickingMonth(false)
                  }
                }}
                className={`w-[30%] py-3 items-center justify-center rounded-xl border ${
                  isSelected
                    ? 'bg-accent border-accent'
                    : isActual
                      ? 'bg-accent-soft border-accent/40'
                      : 'bg-card border-line'
                } active:opacity-70`}
                accessibilityRole="button"
                accessibilityLabel={`${name} de ${viewYear}`}
              >
                <Typography
                  variant="caption"
                  className={`text-[13px] font-sans-semibold ${
                    isSelected ? 'text-paper' : isActual ? 'text-accent' : 'text-ink'
                  }`}
                >
                  {name}
                </Typography>
              </Pressable>
            )
          })}
        </View>
      </View>
    )
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={goToPreviousMonth}
          className="p-1 active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
        >
          <Icon name="chevronLeft" size={20} color={COLORS.muted} />
        </Pressable>

        <Pressable
          onPress={() => setPickingMonth(true)}
          accessibilityRole="button"
          accessibilityLabel="Cambiar año y mes"
          className="flex-row items-center gap-1 active:opacity-60"
        >
          <Typography variant="figure">{monthLabel}</Typography>
          <Icon name="chevronDown" size={16} color={COLORS.muted} />
        </Pressable>

        <Pressable
          onPress={goToNextMonth}
          className="p-1 active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
        >
          <Icon name="chevronRight" size={20} color={COLORS.muted} />
        </Pressable>
      </View>

      <View className="flex-row">
        {weekdayLabels.map((label) => (
          <Typography key={label} variant="caption" className="w-[14.28%] text-center">
            {label}
          </Typography>
        ))}
      </View>

      <View className="flex-row flex-wrap gap-y-1">
        {gridDays.map((cell) => {
          const isSelected = cell.isoDate === selectedISO
          const isDisabled = minimumDate !== undefined && cell.isoDate < minimumDate

          const cellClasses = `size-[14.28%] min-h-10 items-center justify-center ${
            isDisabled ? 'opacity-30' : ''
          }`

          if (isDisabled) {
            return (
              <View key={cell.isoDate} className={cellClasses}>
                <Typography variant="caption" className="text-[13px]">
                  {cell.day}
                </Typography>
              </View>
            )
          }

          return (
            <Pressable
              key={cell.isoDate}
              onPress={() => {
                selectDay(cell.isoDate)
                onChange(cell.isoDate)
              }}
              className={cellClasses}
              accessibilityRole="button"
              accessibilityLabel={longLabel(cell.isoDate)}
            >
              <View
                className={`size-8 items-center justify-center rounded-full ${
                  isSelected ? 'bg-accent' : cell.inMonth ? '' : 'opacity-30'
                }`}
              >
                <Typography
                  variant="caption"
                  className={`text-[13px] ${isSelected ? 'text-paper' : 'text-ink'}`}
                >
                  {cell.day}
                </Typography>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
