/**
 * Formatting helpers for amounts, dates and times in the interface.
 * Centralizes symbols and regional formats (es-VE) plus the
 * 12-hour clock convention used across settings screens.
 */

import type { Currency } from '@src/types/domain'

/** Formateador regional reutilizado en cada llamada */
const FORMATO_NUMERO_ES_VE = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

/** Simbolo o codigo mostrado junto a cada monto */
const CURRENCY_SYMBOLS: Readonly<Record<Currency, string>> = {
  VES: 'Bs.',
  USD: '$',
  USDT: 'USDT',
  EUR: '€'
}

/**
 * Devuelve el simbolo asociado a una moneda.
 * @param currency Moneda consultada
 * @returns Simbolo o codigo corto para mostrar junto a montos
 */
export function currencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency]
}

/**
 * Formatea un numero con separadores regionales y dos decimales.
 * Ante valores no finitos devuelve guion: nunca muestra NaN.
 * @param amount Cantidad a formatear
 * @returns Cadena numerica lista para mostrar
 */
export function formatNumber(amount: number): string {
  if (!Number.isFinite(amount)) return '--'
  return FORMATO_NUMERO_ES_VE.format(amount)
}

/**
 * Formatea un monto con el simbolo de su moneda.
 * Ejemplo: formatAmount(1500, 'VES') produce "Bs. 1.500,00"
 * @param amount Cantidad a formatear
 * @param currency Moneda que define el simbolo
 * @returns Monto legible para tarjetas y listas
 */
export function formatAmount(amount: number, currency: Currency): string {
  return `${CURRENCY_SYMBOLS[currency]} ${formatNumber(amount)}`
}

/**
 * Formatea una fecha ISO yyyy-mm-dd al formato regional dd/mm/yyyy.
 * @param isoDate Fecha en formato yyyy-mm-dd
 * @returns Fecha legible dd/mm/yyyy
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Formatea una hora del dia (0-23) en formato 12 horas con
 * sufijo a.m./p.m., estandar regional para la interfaz.
 * @param hour Hora en formato 24 horas
 * @returns Cadena tipo "7:00 a.m." o "1:00 p.m."
 */
export function formatHour12(hour: number): string {
  return formatTime12(hour, 0)
}

/**
 * Formatea hora y minuto (24 horas de entrada) en formato 12 horas
 * con sufijo a.m./p.m. y minutos siempre visibles.
 * @param hour Hora en formato 24 horas
 * @param minute Minuto de la hora (0-59)
 * @returns Cadena tipo "7:05 a.m." o "1:30 p.m."
 */
export function formatTime12(hour: number, minute: number): string {
  const periodo = hour < 12 ? 'a.m.' : 'p.m.'
  const hora12 = hour % 12 === 0 ? 12 : hour % 12
  const minutoTexto = String(Math.min(59, Math.max(0, Math.floor(minute)))).padStart(2, '0')
  return `${hora12}:${minutoTexto} ${periodo}`
}

/**
 * Describe cuando ocurrira el proximo disparo de una notificacion.
 * @param trigger Instante programado del aviso
 * @param ahora Instante de referencia para comparar el dia
 * @returns Cadena tipo "hoy a las 7:00 p.m." o "manana a las 9:00 a.m."
 */
export function nextNoticeLabel(trigger: Date, ahora = new Date()): string {
  const hora = formatTime12(trigger.getHours(), trigger.getMinutes())

  const inicioHoy = new Date(ahora)
  inicioHoy.setHours(0, 0, 0, 0)

  const inicioDisparo = new Date(trigger)
  inicioDisparo.setHours(0, 0, 0, 0)

  const dias = Math.round((inicioDisparo.getTime() - inicioHoy.getTime()) / 86400000)

  if (dias <= 0) return `hoy a las ${hora}`
  if (dias === 1) return `mañana a las ${hora}`

  return `en ${dias} dias a las ${hora}`
}

/**
 * Describe un vencimiento en terminos relativos al dia de hoy.
 * Ejemplos: "vence hoy", "vence manana", "en 5 dias", "hace 2 dias".
 * @param daysRemaining Dias calculados con daysUntil
 * @returns Etiqueta relativa lista para mostrar
 */
export function dueLabel(daysRemaining: number): string {
  if (daysRemaining === 0) return 'vence hoy'
  if (daysRemaining === 1) return 'vence mañana'
  if (daysRemaining > 1) return `en ${daysRemaining} dias`
  if (daysRemaining === -1) return 'hace 1 dia'
  return `hace ${Math.abs(daysRemaining)} dias`
}

/**
 * Describe cuanto tiempo paso desde un instante ISO dado.
 * Usado para mostrar la antiguedad de las tasas obtenidas.
 * @param fetchedAt Instante ISO completo
 * @returns Etiqueta tipo "hace 3 h" o "hace 12 min"
 */
export function ageLabel(fetchedAt: string): string {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 60000))

  if (minutos < 60) return `hace ${minutos} min`

  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`

  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'hace 1 dia' : `hace ${dias} dias`
}

/** Nombres de los doce meses en espanol para visualizacion */
const MONTH_NAMES_ES: readonly string[] = [
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
]

/**
 * Formatea un identificador de mes 'yyyy-mm' a texto legible en espanol.
 * Ejemplo: formatYearMonthLabel('2026-09') produce "Septiembre 2026".
 * @param yearMonth Cadena en formato yyyy-mm
 * @returns Cadena con mes y ano legible
 */
export function formatYearMonthLabel(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-')
  const monthIdx = Number(monthStr) - 1
  const monthName = MONTH_NAMES_ES[monthIdx] ?? monthStr
  return `${monthName} ${yearStr}`
}

/**
 * Desplaza un yearMonth ('yyyy-mm') en N meses hacia el pasado o futuro.
 * Ejemplo: shiftYearMonth('2026-09', -1) produce "2026-08".
 * @param yearMonth Cadena en formato yyyy-mm
 * @param offsetMonths Cantidad de meses a sumar o restar
 * @returns Nuevo identificador en formato yyyy-mm
 */
export function shiftYearMonth(yearMonth: string, offsetMonths: number): string {
  const [yearStr, monthStr] = yearMonth.split('-')
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + offsetMonths, 1)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
