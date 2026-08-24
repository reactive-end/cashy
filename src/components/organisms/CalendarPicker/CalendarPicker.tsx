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
const FORMATO_FECHA_LARGA = new Intl.DateTimeFormat('es-VE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

function etiquetaLarga(isoDate: string): string {
  return FORMATO_FECHA_LARGA.format(fromISODate(isoDate))
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
        {weekdayLabels.map((etiqueta) => (
          <Typography key={etiqueta} variant="caption" className="w-[14.28%] text-center">
            {etiqueta}
          </Typography>
        ))}
      </View>

      <View className="flex-row flex-wrap gap-y-1">
        {gridDays.map((celda) => {
          const seleccionado = celda.isoDate === selectedISO
          const deshabilitado = minimumDate !== undefined && celda.isoDate < minimumDate

          const clasesCelda = `size-[14.28%] min-h-10 items-center justify-center ${
            deshabilitado ? 'opacity-30' : ''
          }`

          if (deshabilitado) {
            return (
              <View key={celda.isoDate} className={clasesCelda}>
                <Typography variant="caption" className="text-[13px]">
                  {celda.day}
                </Typography>
              </View>
            )
          }

          return (
            <Pressable
              key={celda.isoDate}
              onPress={() => {
                selectDay(celda.isoDate)
                onChange(celda.isoDate)
              }}
              className={clasesCelda}
              accessibilityRole="button"
              accessibilityLabel={etiquetaLarga(celda.isoDate)}
            >
              <View
                className={`size-8 items-center justify-center rounded-full ${
                  seleccionado ? 'bg-accent' : celda.inMonth ? '' : 'opacity-30'
                }`}
              >
                <Typography
                  variant="caption"
                  className={`text-[13px] ${seleccionado ? 'text-paper' : 'text-ink'}`}
                >
                  {celda.day}
                </Typography>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
