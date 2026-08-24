/**
 * Pruebas unitarias del formateo de montos y fechas.
 * Congelan el reloj para verificar las etiquetas relativas.
 */

import {
  ageLabel,
  currencySymbol,
  dueLabel,
  formatAmount,
  formatDate,
  formatHour12,
  formatNumber
} from '@src/lib/format'

import { AHORA } from '../../helpers/factories'

describe('currencySymbol', () => {
  it('mapea cada moneda a su simbolo regional', () => {
    expect(currencySymbol('VES')).toBe('Bs.')
    expect(currencySymbol('USD')).toBe('$')
    expect(currencySymbol('USDT')).toBe('USDT')
  })
})

describe('formatNumber', () => {
  it('agrupa miles y usa coma decimal al estilo es-VE', () => {
    expect(formatNumber(1500)).toBe('1.500,00')
    expect(formatNumber(779.952)).toBe('779,95')
    expect(formatNumber(0)).toBe('0,00')
    expect(formatNumber(1234567.891)).toBe('1.234.567,89')
  })
})

describe('formatAmount', () => {
  it('combina simbolo y numero para cada moneda', () => {
    expect(formatAmount(1500, 'VES')).toBe('Bs. 1.500,00')
    expect(formatAmount(9.99, 'USD')).toBe('$ 9,99')
    expect(formatAmount(919.91, 'USDT')).toBe('USDT 919,91')
  })
})

describe('formatDate', () => {
  it('reordena ISO yyyy-mm-dd a dd/mm/yyyy', () => {
    expect(formatDate('2026-09-01')).toBe('01/09/2026')
    expect(formatDate('2026-12-31')).toBe('31/12/2026')
  })
})

describe('dueLabel', () => {
  it.each([
    [0, 'vence hoy'],
    [1, 'vence mañana'],
    [5, 'en 5 dias'],
    [-1, 'hace 1 dia'],
    [-3, 'hace 3 dias']
  ])('con %i dias restantes produce "%s"', (dias, esperado) => {
    expect(dueLabel(dias)).toBe(esperado)
  })
})

describe('ageLabel', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: AHORA })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it.each([
    ['2026-08-23T09:59:30Z', 'hace 0 min'],
    ['2026-08-23T09:30:00Z', 'hace 30 min'],
    ['2026-08-23T07:00:00Z', 'hace 3 h'],
    ['2026-08-22T10:00:00Z', 'hace 1 dia'],
    ['2026-08-20T10:00:00Z', 'hace 3 dias']
  ])('describe la antiguedad de %s como "%s"', (fetchedAt, esperado) => {
    expect(ageLabel(fetchedAt)).toBe(esperado)
  })
})

describe('formatHour12', () => {
  it.each([
    [0, '12:00 a.m.'],
    [7, '7:00 a.m.'],
    [9, '9:00 a.m.'],
    [12, '12:00 p.m.'],
    [13, '1:00 p.m.'],
    [19, '7:00 p.m.'],
    [23, '11:00 p.m.']
  ])('convierte la hora %i a "%s"', (hora, esperado) => {
    expect(formatHour12(hora)).toBe(esperado)
  })
})
