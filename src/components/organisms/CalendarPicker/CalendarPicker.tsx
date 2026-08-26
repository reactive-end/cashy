/**
 * Organismo CalendarPicker: calendario mensual navegable propio
 * del proyecto. Reemplaza al DateTimePicker nativo con la grilla
 * y los acentos del sistema de diseno.
 */

import { Pressable, View } from 'react-native'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'
import { fromISODate } from '@src/lib/recurrences'

import type { CalendarPickerProps } from './CalendarPicker.d'
import { useCalendar } from './useCalendar'

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
 * @param props Fecha inicial, fecha minima y callback de seleccion
 * @returns Calendario interactivo para modales y formularios
 */
export function CalendarPicker({ value, minimumDate, onChange }: CalendarPickerProps) {
  const {
    monthLabel,
    weekdayLabels,
    gridDays,
    selectedISO,
    goToPreviousMonth,
    goToNextMonth,
    selectDay
  } = useCalendar(value)

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

        <Typography variant="figure">{monthLabel}</Typography>

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
