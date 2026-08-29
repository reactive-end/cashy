/**
 * Logica del organismo TimePicker: pasos del reloj (hora y luego
 * minutos), periodo am/pm, ajuste fino de minutos y geometria de
 * las esferas para posicionar cada marca sobre el circulo.
 */

import { useCallback, useState } from 'react'

/** Pasos del reloj: primero la hora, luego los minutos */
export type TimePickerStep = 'hour' | 'minute'

/** Mitades del dia seleccionables en el control segmentado */
export type Meridiem = 'am' | 'pm'

/** Marca presionable dibujada sobre la esfera del reloj */
export interface ClockMark {
  /** Valor logico de la marca (1-12 horas; 0-55 minutos) */
  value: number
  /** Texto visible dentro de la marca */
  label: string
  /** Posicion absoluta sobre la esfera en porcentajes */
  position: { left: `${number}%`; top: `${number}%` }
}

/** Etiquetas de las 12 posiciones de hora sobre la esfera */
const HOUR_LABELS: readonly string[] = [
  '12',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11'
]

/** Etiquetas de las 12 posiciones de minuto (pasos de 5) */
const MINUTE_LABELS: readonly string[] = [
  '00',
  '05',
  '10',
  '15',
  '20',
  '25',
  '30',
  '35',
  '40',
  '45',
  '50',
  '55'
]

/** Radio de la esfera donde se asientan las marcas, en porcentaje */
const DIAL_RADIUS = 38

/**
 * Convierte una hora de 24 horas a su equivalente de caratula 1-12.
 * @param hour Hora en formato 24 horas
 * @returns Hora de caratula entre 1 y 12
 */
function toDialHour(hour: number): number {
  return hour % 12 === 0 ? 12 : hour % 12
}

/**
 * Convierte hora de caratula y periodo a formato 24 horas.
 * @param dialHour Hora de caratula (1-12)
 * @param meridiem Mitad del dia elegida
 * @returns Hora en formato 24 horas
 */
function toTwentyFour(dialHour: number, meridiem: Meridiem): number {
  if (meridiem === 'am') return dialHour === 12 ? 0 : dialHour

  return dialHour === 12 ? 12 : dialHour + 12
}

/**
 * Calcula la posicion porcentual de una marca segun su indice,
 * con el angulo medido desde las 12 en sentido horario.
 * @param index Indice de la marca (0-11)
 * @returns Coordenadas left/top en porcentaje
 */
function position(index: number): { left: `${number}%`; top: `${number}%` } {
  const angle = (index * 30 * Math.PI) / 180

  return {
    left: `${50 + DIAL_RADIUS * Math.sin(angle)}%` as const,
    top: `${50 - DIAL_RADIUS * Math.cos(angle)}%` as const
  }
}

/** Opciones que consume el hook interno del TimePicker */
interface UseTimePickerOptions {
  /** Hora vigente en formato 24 horas */
  hour: number
  /** Minuto vigente */
  minute: number
  /** Accion de confirmacion con hora y minuto finales */
  onChange: (hour: number, minute: number) => void
}

/**
 * Administra el estado del selector: apertura, paso activo,
 * hora de caratula, periodo y minuto con ajuste fino.
 * @param props Hora/minuto vigentes y callback de confirmacion
 * @returns Estado, marcas de ambas esferas y acciones del reloj
 */
export function useTimePicker({ hour, minute, onChange }: UseTimePickerOptions) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<TimePickerStep>('hour')
  const [dialHour, setDialHour] = useState(toDialHour(hour))
  const [meridiem, setMeridiem] = useState<Meridiem>(hour < 12 ? 'am' : 'pm')
  const [minuteValue, setMinuteValue] = useState(minute)

  /** Abre el reloj reiniciando la seleccion desde los valores vigentes */
  function openPicker(): void {
    setDialHour(toDialHour(hour))
    setMeridiem(hour < 12 ? 'am' : 'pm')
    setMinuteValue(minute)
    setStep('hour')
    setOpen(true)
  }

  const close = useCallback((): void => {
    setOpen(false)
  }, [])

  /** Avanza al paso de minutos tras elegir una hora de caratula */
  const selectHour = useCallback((value: number): void => {
    setDialHour(value)
    setStep('minute')
  }, [])

  const selectMeridiem = useCallback((next: Meridiem): void => {
    setMeridiem(next)
  }, [])

  const selectMinute = useCallback((value: number): void => {
    setMinuteValue(value)
  }, [])

  /** Mueve el minuto en pasos de uno sin salir del rango 0-59 */
  const adjustMinute = useCallback((delta: number): void => {
    setMinuteValue((current) => Math.min(59, Math.max(0, current + delta)))
  }, [])

  const confirm = useCallback((): void => {
    onChange(toTwentyFour(dialHour, meridiem), minuteValue)
    setOpen(false)
  }, [dialHour, minuteValue, meridiem, onChange])

  const hour24 = toTwentyFour(dialHour, meridiem)

  const hourMarks: readonly (ClockMark & { selected: boolean })[] = HOUR_LABELS.map(
    (label, index) => ({
      value: index === 0 ? 12 : index,
      label,
      position: position(index),
      selected: (index === 0 ? 12 : index) === dialHour
    })
  )

  const minuteMarks: readonly (ClockMark & { selected: boolean })[] = MINUTE_LABELS.map(
    (label, index) => ({
      value: index * 5,
      label,
      position: position(index),
      selected: index * 5 === minuteValue
    })
  )

  return {
    open,
    openPicker,
    close,
    step,
    dialHour,
    hour24,
    meridiem,
    minute: minuteValue,
    selectHour,
    selectMeridiem,
    selectMinute,
    adjustMinute,
    confirm,
    hourMarks,
    minuteMarks
  }
}
