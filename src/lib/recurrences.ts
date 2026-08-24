/**
 * Date arithmetic utilities for recurring fixed expenses.
 * Everything works with the device local timezone.
 */

import type { Recurrence } from '@src/types/domain'

/**
 * Cantidad de dias que tiene un mes dado.
 * @param year Anio completo (ejemplo 2026)
 * @param month Indice del mes 0-11 (convencion Date)
 * @returns Numero de dias del mes
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Avanza una fecha segun la recurrencia indicada.
 * Para mensual y anual acota el dia al largo real del mes destino
 * (31 de enero avanza a 28/29 de febrero, no al 3 de marzo).
 * @param date Fecha base del vencimiento actual
 * @param recurrence Cadencia a aplicar
 * @returns Nueva fecha correspondiente al siguiente vencimiento
 */
export function advanceDueDate(date: Date, recurrence: Recurrence): Date {
  const nueva = new Date(date)

  switch (recurrence) {
    case 'weekly':
      nueva.setDate(nueva.getDate() + 7)
      break
    case 'biweekly':
      nueva.setDate(nueva.getDate() + 15)
      break
    case 'monthly': {
      const diaOriginal = nueva.getDate()
      nueva.setDate(1)
      nueva.setMonth(nueva.getMonth() + 1)
      nueva.setDate(Math.min(diaOriginal, daysInMonth(nueva.getFullYear(), nueva.getMonth())))
      break
    }
    case 'yearly': {
      const diaOriginal = nueva.getDate()
      const mesOriginal = nueva.getMonth()
      const anioDestino = nueva.getFullYear() + 1
      const maximoDia =
        mesOriginal === 1 ? daysInMonth(anioDestino, 1) : daysInMonth(anioDestino, mesOriginal)
      return new Date(anioDestino, mesOriginal, Math.min(diaOriginal, maximoDia))
    }
  }

  return nueva
}

/**
 * Compara dos fechas ignorando la hora.
 * @param a Primera fecha
 * @param b Segunda fecha
 * @returns true si ambas ocurren el mismo dia calendario
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Calculo de dias completos entre hoy y una fecha objetivo.
 * @param target Fecha futura o pasada
 * @returns Dias restantes (positivo futuro, cero hoy, negativo pasado)
 */
export function daysUntil(target: Date): number {
  const hoy = new Date()
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const inicioObjetivo = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((inicioObjetivo.getTime() - inicioHoy.getTime()) / (24 * 60 * 60 * 1000))
}

/**
 * Convierte un Date a cadena ISO de solo fecha (yyyy-mm-dd),
 * formato usado por nextDueDate en la base de datos.
 * @param date Fecha a convertir
 * @returns Cadena yyyy-mm-dd
 */
export function toISODate(date: Date): string {
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mes}-${dia}`
}

/**
 * Interpreta una cadena ISO de fecha (yyyy-mm-dd) como fecha local a medianoche.
 * @param iso Cadena yyyy-mm-dd
 * @returns Fecha local correspondiente
 */
export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}
