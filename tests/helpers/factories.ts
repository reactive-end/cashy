/**
 * Fábricas de datos de dominio para pruebas.
 * Congelan un instante de referencia para resultados deterministas.
 */

import type { AppSettings, Expense, ExpenseInput, ExchangeRates, Income } from '@src/types/domain'

/** Instante congelado de referencia para todas las pruebas (UTC absoluto) */
export const NOW = new Date('2026-08-23T10:00:00.000Z')

/** ISO del instante congelado */
export const NOW_ISO = NOW.toISOString()

/**
 * Fecha ISO yyyy-mm-dd relativa al dia actual del entorno.
 * Evita acoplar pruebas al calendario real.
 * @param dias Dias a sumar (negativos hacia el pasado)
 * @returns Cadena yyyy-mm-dd
 */
export function isoDaysFromToday(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Snapshot tipico de tasas alineado con los fixtures de red */
export function buildRates(overrides: Partial<ExchangeRates> = {}): ExchangeRates {
  return {
    bcvUsd: 779.95,
    bcvEur: 911.21,
    usdtSellP2p: 912.01,
    fetchedAt: NOW_ISO,
    ...overrides
  }
}

/** Gasto fijo mensual por defecto (Netflix) */
export function buildFixedExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'gasto-fijo-1',
    name: 'Netflix',
    amount: 9.99,
    currency: 'USD',
    type: 'fixed',
    category: 'Suscripciones',
    note: undefined,
    recurrence: 'monthly',
    nextDueDate: '2026-09-01',
    active: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
    ...overrides
  }
}

/** Gasto unico por defecto (licuadora) */
export function buildUniqueExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'gasto-unico-1',
    name: 'Licuadora',
    amount: 250000,
    currency: 'VES',
    type: 'unique',
    category: 'Hogar',
    note: undefined,
    recurrence: undefined,
    nextDueDate: undefined,
    active: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
    ...overrides
  }
}

/** Entrada de formulario valida por defecto */
export function buildExpenseInput(overrides: Partial<ExpenseInput> = {}): ExpenseInput {
  return {
    name: 'Spotify',
    amount: 5.99,
    currency: 'USD',
    type: 'fixed',
    category: 'Musica',
    note: undefined,
    recurrence: 'monthly',
    nextDueDate: '2026-09-05',
    ...overrides
  }
}

/** Ajustes por defecto del usuario */
export function buildSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    baseCurrency: 'USD',
    reminderHour: 9,
    reminderMinute: 0,
    bcvHour: 9,
    bcvMinute: 0,
    remindersEnabled: true,
    bcvEnabled: true,
    ...overrides
  }
}

/** Ingreso tipico del usuario para pruebas */
export function buildIncome(overrides: Partial<Income> = {}): Income {
  return {
    id: 'ingreso-1',
    name: 'Salario',
    amount: 500,
    currency: 'USD',
    paydayDay: 5,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
    ...overrides
  }
}
