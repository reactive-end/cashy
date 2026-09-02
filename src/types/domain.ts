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
  /** Indica si la tasa proviene de una captura anterior rescatada ante fallo de red */
  isStale?: boolean
}

/** Expense as stored in the local database */
export interface Expense {
  id: string
  name: string
  amount: number
  currency: Currency
  baseAmount?: number
  baseCurrency?: BaseCurrency
  type: ExpenseType
  category?: string
  note?: string
  /** Fixed expenses only: repeat cadence */
  recurrence?: Recurrence
  /** Fixed expenses only: ISO date (yyyy-mm-dd) of the next payment */
  nextDueDate?: string
  /** Fixed expenses only: Anchor day of month (1-31) for recurring payments */
  dueDay?: number
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Data required to create or edit an expense */
export interface ExpenseInput {
  name: string
  amount: number
  currency: Currency
  baseAmount?: number
  baseCurrency?: BaseCurrency
  type: ExpenseType
  category?: string
  note?: string
  recurrence?: Recurrence
  nextDueDate?: string
  /** Dia ancla del mes (1-31) para gastos fijos mensuales */
  dueDay?: number
  /** Permite desactivar un fijo sin eliminarlo (pausar suscripcion) */
  active?: boolean
}

/** User preferences persisted locally */
export interface AppSettings {
  /** Currency summaries are expressed in */
  baseCurrency: BaseCurrency
  /** Hour of the day (0-23) when payment reminders arrive */
  reminderHour: number
  /** Minute of the hour (0-59) when payment reminders arrive */
  reminderMinute: number
  /** Hour of the day (0-23) when the daily BCV rate notice arrives */
  bcvHour: number
  /** Minute of the hour (0-59) when the daily BCV rate notice arrives */
  bcvMinute: number
  /** Master switch for fixed expense payment reminders */
  remindersEnabled: boolean
  /** Master switch for the daily BCV rate notification */
  bcvEnabled: boolean
  /** Bloqueo biometrico al abrir la aplicacion o tras inactividad */
  biometricsEnabled?: boolean
}

/** Aggregated summary of the current month, expressed in base currency */
export interface MonthlySummary {
  /** Projected total of fixed expenses for the month */
  totalFixed: number
  /** Total spent on unique expenses within the current month */
  totalUnique: number
  /** Amount of unique expenses registered this month */
  uniqueCount: number
  /** Total confirmed income received in the current month in base currency */
  confirmedIncome: number
  /** Real available net balance: confirmedIncome - (totalFixed + totalUnique) */
  netBalance: number
}

/** Fixed expense with a close due date, used in upcoming payments lists */
export interface UpcomingPayment {
  expense: Expense
  /** Days until the due date (0 = today) */
  daysRemaining: number
}

/** Basic user profile captured during onboarding */
export interface UserProfile {
  /** Nombres del usuario (solo letras, minimo 3 caracteres) */
  firstName: string
  /** Apellidos del usuario (mismo formato que el nombre) */
  lastName: string
  /** Correo electronico de contacto validado por formato */
  email: string
}

/** Income source entered by the user with its monthly payday or punctual income */
export interface Income {
  id: string
  /** Concepto del ingreso, por ejemplo Salario o Ingresos pasivos */
  name: string
  /** Monto en decimales del dominio */
  amount: number
  /** Moneda en que se percibe el ingreso */
  currency: Currency
  baseAmount?: number
  baseCurrency?: BaseCurrency
  /** Tipo de ingreso: fixed (recurrente) o unique (puntual) */
  type: ExpenseType
  /** Cadencia del ingreso si es fijo */
  recurrence?: Recurrence
  /** Dia del mes en que se cobra (1-31; se recorta en meses cortos) */
  paydayDay: number
  createdAt: string
  updatedAt: string
}

/** Data required to create or edit an income */
export interface IncomeInput {
  name: string
  amount: number
  currency: Currency
  baseAmount?: number
  baseCurrency?: BaseCurrency
  type?: ExpenseType
  recurrence?: Recurrence
  paydayDay?: number
}

/** Confirmed receipt of an income source for a specific month */
export interface IncomeReceipt {
  id: string
  incomeId: string
  yearMonth: string
  amount: number
  currency: Currency
  baseAmount?: number
  baseCurrency?: BaseCurrency
  confirmedAt: string
  createdAt: string
  updatedAt: string
}

/** Confirmed payment receipt of a fixed expense for a specific month */
export interface ExpenseReceipt {
  id: string
  expenseId: string
  yearMonth: string
  amount: number
  currency: Currency
  baseAmount: number
  baseCurrency: BaseCurrency
  paidAt: string
  createdAt: string
  updatedAt: string
}

/** Plan de suscripcion de la aplicacion */
export type SubscriptionPlan = 'free' | 'pro'

/** Estado de una suscripcion */
export type SubscriptionStatus = 'active' | 'expired' | 'canceled'

/** Registro de suscripcion del usuario en Supabase */
export interface UserSubscription {
  id: string
  userId: string
  email: string | null
  plan: SubscriptionPlan
  status: SubscriptionStatus
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

/** Usuario autenticado con proveedor OAuth */
export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string
}
