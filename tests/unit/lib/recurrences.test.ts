/**
 * Pruebas unitarias de la aritmetica de recurrencias.
 * Incluye los casos borde de clamp mensual y anos bisiestos.
 */

import {
  advanceDueDate,
  daysInMonth,
  daysUntil,
  fromISODate,
  isSameDay,
  toISODate
} from '@src/lib/recurrences'

import { AHORA } from '../../helpers/factories'

describe('daysInMonth', () => {
  it.each([
    [0, 2026, 31],
    [3, 2026, 30],
    [1, 2026, 28],
    [1, 2024, 29],
    [1, 2000, 29],
    [1, 1900, 28]
  ])('reporta %i dias para el mes %i de %i', (mes, anio, esperado) => {
    expect(daysInMonth(anio, mes)).toBe(esperado)
  })
})

describe('advanceDueDate', () => {
  it('avanza 7 dias en recurrencia semanal', () => {
    const resultado = advanceDueDate(fromISODate('2026-09-01'), 'weekly')

    expect(toISODate(resultado)).toBe('2026-09-08')
  })

  it('avanza 15 dias en recurrencia quincenal', () => {
    const resultado = advanceDueDate(fromISODate('2026-09-01'), 'biweekly')

    expect(toISODate(resultado)).toBe('2026-09-16')
  })

  it('mantiene el dia del mes en meses de 30 dias', () => {
    const resultado = advanceDueDate(fromISODate('2026-04-15'), 'monthly')

    expect(toISODate(resultado)).toBe('2026-05-15')
  })

  it('acota el 31 al largo real de febrero', () => {
    const noBisiesto = advanceDueDate(fromISODate('2026-01-31'), 'monthly')
    const bisiesto = advanceDueDate(fromISODate('2024-01-31'), 'monthly')

    expect(toISODate(noBisiesto)).toBe('2026-02-28')
    expect(toISODate(bisiesto)).toBe('2024-02-29')
  })

  it('mantiene el dia clampeado en los meses siguientes (semantica documentada)', () => {
    // El vencimiento guardado se convirtio en 28; la recurrencia continua desde ahi.
    const febrero = advanceDueDate(fromISODate('2026-01-31'), 'monthly')
    const marzo = advanceDueDate(febrero, 'monthly')

    expect(toISODate(febrero)).toBe('2026-02-28')
    expect(toISODate(marzo)).toBe('2026-03-28')
  })

  it('acota el 29 de febrero bisiesto en la recurrencia anual', () => {
    const resultado = advanceDueDate(fromISODate('2024-02-29'), 'yearly')

    expect(toISODate(resultado)).toBe('2025-02-28')
  })

  it('conserva el dia cuando el destino anual tambien tiene ese dia', () => {
    const resultado = advanceDueDate(fromISODate('2023-05-31'), 'yearly')

    expect(toISODate(resultado)).toBe('2024-05-31')
  })
})

describe('isSameDay', () => {
  it('ignora la hora al comparar', () => {
    const manana = new Date(2026, 7, 23, 0, 0)
    const noche = new Date(2026, 7, 23, 23, 59)

    expect(isSameDay(manana, noche)).toBe(true)
  })

  it('distingue dias consecutivos', () => {
    expect(isSameDay(new Date(2026, 7, 23), new Date(2026, 7, 24))).toBe(false)
  })
})

describe('daysUntil', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: AHORA })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('devuelve cero para hoy', () => {
    expect(daysUntil(new Date(2026, 7, 23, 18, 0))).toBe(0)
  })

  it('cuenta dias futuros y pasados con signo', () => {
    expect(daysUntil(new Date(2026, 8, 1))).toBe(9)
    expect(daysUntil(new Date(2026, 7, 20))).toBe(-3)
  })
})

describe('toISODate / fromISODate', () => {
  it('hace ida y vuelta preservando el dia calendario', () => {
    const original = new Date(2026, 8, 5)

    expect(toISODate(original)).toBe('2026-09-05')
    expect(isSameDay(fromISODate('2026-09-05'), original)).toBe(true)
  })

  it('aplica padding de ceros a mes y dia', () => {
    expect(toISODate(new Date(2026, 0, 3))).toBe('2026-01-03')
  })

  it('interpreta la cadena a medianoche local', () => {
    const fecha = fromISODate('2026-09-01')

    expect(fecha.getHours()).toBe(0)
    expect(fecha.getFullYear()).toBe(2026)
    expect(fecha.getMonth()).toBe(8)
    expect(fecha.getDate()).toBe(1)
  })
})
