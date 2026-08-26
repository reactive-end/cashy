/**
 * Logica del organismo CalendarPicker: estado del mes visible,
 * construccion de la grilla de dias y navegacion mensual.
 * El mes se modela como un unico contador total de meses, lo que
 * hace las transiciones puras e inmunes a valores obsoletos.
 */

import { useMemo, useState } from 'react'

import { daysInMonth, fromISODate, toISODate } from '@src/lib/recurrences'

/** Celda de la grilla del calendario */
export interface CalendarDay {
  /** Dia del mes (1-31) */
  day: number
  /** Fecha ISO yyyy-mm-dd completa de la celda */
  isoDate: string
  /** true si la celda pertenece al mes visible */
  inMonth: boolean
}

/** Estado y acciones expuestos por el hook del calendario */
export interface UseCalendarResult {
  /** Anio visible (completo, ejemplo 2026) */
  viewYear: number
  /** Mes visible con indice 0-11 */
  viewMonth: number
  /** Etiqueta legible del mes visible en espanol */
  monthLabel: string
  /** Encabezados de dia de la semana, empezando por lunes */
  weekdayLabels: string[]
  /** Celdas de la grilla incluyendo relleno del mes anterior y siguiente */
  gridDays: CalendarDay[]
  /** Fecha marcada actualmente en formato ISO */
  selectedISO: string | null
  /** Retrocede un mes en la vista */
  goToPreviousMonth: () => void
  /** Avanza un mes en la vista */
  goToNextMonth: () => void
  /** Marca una fecha ISO como seleccionada */
  selectDay: (isoDate: string) => void
}

/** Etiquetas cortas de los dias de la semana desde lunes */
const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const

/** Formateador reutilizable para la etiqueta del mes visible */
const VISIBLE_MONTH_FORMAT = new Intl.DateTimeFormat('es-VE', {
  month: 'long',
  year: 'numeric'
})

/**
 * Calcula el desfase de celdas vacias para que la semana empiece en lunes.
 * @param date Cualquier fecha dentro del mes objetivo
 * @returns Posiciones vacias antes del dia 1 (0-6)
 */
function mondayOffset(date: Date): number {
  return (date.getDay() + 6) % 7
}

/**
 * Administra el calendario mensual seleccionable.
 * @param initialISO Fecha inicialmente marcada; por defecto hoy
 * @returns Estado de vista, grilla calculada y acciones de navegacion
 */
export function useCalendar(initialISO?: string): UseCalendarResult {
  const initialDate = initialISO ? fromISODate(initialISO) : new Date()
  // Contador total de meses desde el anio cero: anio*12 + indiceMes.
  const [viewedMonthsTotal, setViewedMonthsTotal] = useState(
    initialDate.getFullYear() * 12 + initialDate.getMonth()
  )
  const [selectedISO, setSelectedISO] = useState<string | null>(initialISO ?? null)

  const viewYear = Math.floor(viewedMonthsTotal / 12)
  const viewMonth = viewedMonthsTotal % 12

  const monthLabel = useMemo(
    () => VISIBLE_MONTH_FORMAT.format(new Date(viewYear, viewMonth, 1)),
    [viewYear, viewMonth]
  )

  const gridDays = useMemo<CalendarDay[]>(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
    const offset = mondayOffset(firstDayOfMonth)
    const total = daysInMonth(viewYear, viewMonth)
    const celdas: CalendarDay[] = []

    for (let i = offset - 1; i >= 0; i -= 1) {
      const fecha = new Date(viewYear, viewMonth, -i)
      celdas.push({ day: fecha.getDate(), isoDate: toISODate(fecha), inMonth: false })
    }

    for (let dia = 1; dia <= total; dia += 1) {
      const fecha = new Date(viewYear, viewMonth, dia)
      celdas.push({ day: dia, isoDate: toISODate(fecha), inMonth: true })
    }

    const restantes = (7 - (celdas.length % 7)) % 7
    for (let i = 1; i <= restantes; i += 1) {
      const fecha = new Date(viewYear, viewMonth + 1, i)
      celdas.push({ day: fecha.getDate(), isoDate: toISODate(fecha), inMonth: false })
    }

    return celdas
  }, [viewYear, viewMonth])

  const goToPreviousMonth = () => setViewedMonthsTotal((total) => total - 1)

  const goToNextMonth = () => setViewedMonthsTotal((total) => total + 1)

  const selectDay = (isoDate: string) => setSelectedISO(isoDate)

  return {
    viewYear,
    viewMonth,
    monthLabel,
    weekdayLabels: [...WEEKDAY_LABELS],
    gridDays,
    selectedISO,
    goToPreviousMonth,
    goToNextMonth,
    selectDay
  }
}
