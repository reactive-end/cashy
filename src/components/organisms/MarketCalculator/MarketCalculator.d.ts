/**
 * Public types of the MarketCalculator organism.
 */

import type { Currency, ExchangeRates, ExpenseInput } from '@src/types/domain'

/** Articulo individual sumado a la lista de compras del mercado */
export interface MarketItem {
  /** Identificador unico del articulo */
  id: string
  /** Nombre descriptivo (ej: 'Harina PAN' o generado 'Articulo #1') */
  name: string
  /** Monto en unidades monetarias decimales */
  amount: number
}

/** Equivalencia convertida a una divisa objetivo */
export interface MarketEquivalence {
  /** Divisa destino */
  target: Currency
  /** Monto convertido segun las tasas del dia */
  convertedAmount: number
}

/** Propiedades del organismo MarketCalculator */
export interface MarketCalculatorProps {
  /** Moneda inicial de compra; por defecto USD */
  initialCurrency?: Currency
  /** Snapshot de tasas del dia opcional; si no se provee se consulta useRates */
  rates?: ExchangeRates | null
  /** Callback para persistir el total como gasto unico */
  onRegisterExpense?: (expense: ExpenseInput) => Promise<void>
}
