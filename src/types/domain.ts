/**
 * Shared domain types of the Cashy application.
 * These are the data contracts used by services, database and UI layers.
 * All technical identifiers are in English; user-facing text lives elsewhere.
 */

/** Currencies supported for registering expenses and displaying rates */
export type Currency = 'VES' | 'USD' | 'USDT' | 'EUR'

/** Ordered list of supported currencies for UI pickers */
export const CURRENCIES: readonly Currency[] = ['VES', 'USD', 'USDT', 'EUR'] as const

/**
 * Base currency used for summaries and automatic conversions.
 * The user picks one from the settings screen.
 */
export type BaseCurrency = Exclude<Currency, 'EUR'>

/** Lista de monedas base seleccionables en Ajustes (sin EUR) */
export const BASE_CURRENCIES: readonly BaseCurrency[] = ['VES', 'USD', 'USDT'] as const

/** Expense kind: fixed repeats and triggers reminders, unique is one-off */
export type ExpenseType = 'fixed' | 'unique'

/** Recurrence cycles supported for fixed expenses */
export type Recurrence = 'weekly' | 'biweekly' | 'monthly' | 'yearly'

/** Ordered recurrence list from shortest to longest */
export const RECURRENCES: readonly Recurrence[] = [
  'weekly',
  'biweekly',
  'monthly',
  'yearly'
] as const

/** Legible labels for each recurrence, shown in the interface */
export const RECURRENCE_LABELS: Readonly<Record<Recurrence, string>> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  yearly: 'Anual'
}

/**
 * Snapshot of the day exchange rates against bolivars (VES).
 * Fetched daily from dolarapi.com (BCV) and criptoya.com (P2P markets).
 */
export interface ExchangeRates {
  /** Bolivars per 1 official US dollar from Banco Central de Venezuela */
  bcvUsd: number
  /** Bolivars per 1 official euro from Banco Central de Venezuela */
  bcvEur: number
  /**
   * Bolivars per 1 USDT al vender: minima puja (bid) entre los
   * mercados P2P principales, referencia alcanzable y conservadora
   * para quien liquida salarios en USDT.
   */
  usdtSellP2p: number
  /** ISO timestamp when this snapshot was fetched */
  fetchedAt: string
}

/** Expense as stored in the local database */
export interface Expense {
  id: string
  name: string
  amount: number
  currency: Currency
  type: ExpenseType
  category?: string
  note?: string
  /** Fixed expenses only: repeat cadence */
  recurrence?: Recurrence
  /** Fixed expenses only: ISO date (yyyy-mm-dd) of the next payment */
  nextDueDate?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Data required to create or edit an expense */
export interface ExpenseInput {
  name: string
  amount: number
  currency: Currency
  type: ExpenseType
  category?: string
  note?: string
  recurrence?: Recurrence
  nextDueDate?: string
  /** Permite desactivar un fijo sin eliminarlo (pausar suscripcion) */
  active?: boolean
}

/** User preferences persisted locally */
export interface AppSettings {
  /** Currency summaries are expressed in */
  baseCurrency: BaseCurrency
  /** Hour of the day (0-23) when reminders arrive */
  reminderHour: number
}

/** Aggregated summary of the current month, expressed in base currency */
export interface MonthlySummary {
  /** Projected total of fixed expenses for the month */
  totalFixed: number
  /** Total spent on unique expenses within the current month */
  totalUnique: number
  /** Amount of unique expenses registered this month */
  uniqueCount: number
}

/** Fixed expense with a close due date, used in upcoming payments lists */
export interface UpcomingPayment {
  expense: Expense
  /** Days until the due date (0 = today) */
  daysRemaining: number
}
