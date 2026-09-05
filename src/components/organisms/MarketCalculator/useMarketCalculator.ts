/**
 * Logic hook for the MarketCalculator organism.
 * Manages item accumulation, real-time conversions,
 * copy actions and saving the total as a unique expense.
 */

import { setStringAsync } from 'expo-clipboard'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useRates } from '@src/hooks/useRates'
import { convert } from '@src/lib/conversions'
import { formatAmount } from '@src/lib/format'
import { generateId } from '@src/lib/ids'
import { amountFromCents } from '@src/lib/money'
import { CURRENCIES, type Currency, type ExchangeRates, type ExpenseInput } from '@src/types/domain'

import type { MarketEquivalence, MarketItem } from './MarketCalculator.d'

/**
 * Hook de logica para la calculadora de mercado.
 * @param initialCurrency Moneda inicial de la sesion
 * @param onRegisterExpense Callback opcional para guardar el gasto
 * @param ratesProp Tasas del dia opcionales recibidas del padre
 * @returns Estado y metodos para gestionar la compra
 */
export function useMarketCalculator(
  initialCurrency: Currency = 'USD',
  onRegisterExpense?: (expense: ExpenseInput) => Promise<void>,
  ratesProp?: ExchangeRates | null
) {
  const ratesState = useRates()
  const rates = ratesProp !== undefined ? ratesProp : ratesState.rates

  const [currency, setCurrency] = useState<Currency>(initialCurrency)
  const [items, setItems] = useState<MarketItem[]>([])
  const [itemName, setItemName] = useState('')
  const [amountCents, setAmountCents] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [inputKey, setInputKey] = useState(0)
  const [copiedCurrency, setCopiedCurrency] = useState<Currency | null>(null)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<MarketItem | null>(null)
  const [showExtraCostModal, setShowExtraCostModal] = useState(false)
  const [extraCostCurrency, setExtraCostCurrencyState] = useState<Currency>(initialCurrency)
  const [extraCostCents, setExtraCostCents] = useState(0)
  const [extraCostName, setExtraCostName] = useState('')
  const [extraCostInputKey, setExtraCostInputKey] = useState(0)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [expenseName, setExpenseName] = useState('Mercado')
  const [expenseCategory, setExpenseCategory] = useState('Compras')
  const [savingExpense, setSavingExpense] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const currentAmount = amountFromCents(amountCents)
  const extraCostAmount = amountFromCents(extraCostCents)

  const extraCostEquivalent = useMemo(() => {
    if (extraCostCents <= 0 || extraCostCurrency === currency || !rates) return null
    const converted = convert(extraCostAmount, extraCostCurrency, currency, rates)
    return formatAmount(converted, currency)
  }, [extraCostCents, extraCostAmount, extraCostCurrency, currency, rates])

  const totalAmount = useMemo(() => items.reduce((acc, item) => acc + item.amount, 0), [items])

  const equivalences = useMemo<MarketEquivalence[]>(() => {
    if (!rates || totalAmount <= 0) return []

    const computed: MarketEquivalence[] = []
    for (const target of CURRENCIES) {
      if (target === currency) continue
      computed.push({
        target,
        convertedAmount: convert(totalAmount, currency, target, rates)
      })
    }
    return computed
  }, [totalAmount, currency, rates])

  const handleCentsChange = useCallback((cents: number) => {
    setAmountCents(cents)
  }, [])

  const incrementQuantity = useCallback(() => {
    setQuantity((q) => q + 1)
  }, [])

  const decrementQuantity = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1))
  }, [])

  const setCustomQuantity = useCallback((val: number) => {
    setQuantity(Math.max(1, Math.floor(val) || 1))
  }, [])

  const handleCurrencyChange = useCallback(
    (newCurrency: Currency) => {
      if (newCurrency === currency) return

      if (items.length > 0 && rates) {
        setItems((prev) =>
          prev.map((item) => {
            const convertedAmount = convert(item.amount, currency, newCurrency, rates)
            const convertedUnit = item.unitPrice
              ? convert(item.unitPrice, currency, newCurrency, rates)
              : undefined
            return {
              ...item,
              amount: convertedAmount,
              unitPrice: convertedUnit
            }
          })
        )
      }
      setCurrency(newCurrency)
      setAmountCents(0)
    },
    [currency, items.length, rates]
  )

  const addItem = useCallback(() => {
    if (currentAmount <= 0) return

    const resolvedName = itemName.trim() || `Articulo #${items.length + 1}`
    const unitPrice = currentAmount
    const totalItemAmount = Math.round(unitPrice * quantity * 100) / 100

    const newItem: MarketItem = {
      id: generateId(),
      name: resolvedName,
      amount: totalItemAmount,
      quantity,
      unitPrice
    }

    setItems((prev) => [...prev, newItem])
    setItemName('')
    setAmountCents(0)
    setQuantity(1)
    setInputKey((k) => k + 1)
  }, [currentAmount, itemName, items.length, quantity])

  const incrementItemQuantity = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const newQty = (item.quantity ?? 1) + 1
        const baseUnit = item.unitPrice ?? item.amount / (item.quantity ?? 1)
        return {
          ...item,
          quantity: newQty,
          unitPrice: baseUnit,
          amount: Math.round(baseUnit * newQty * 100) / 100
        }
      })
    )
  }, [])

  const requestRemoveItem = useCallback((item: MarketItem) => {
    setItemToRemove(item)
  }, [])

  const confirmRemoveItem = useCallback(() => {
    if (itemToRemove) {
      setItems((prev) => prev.filter((item) => item.id !== itemToRemove.id))
      setItemToRemove(null)
    }
  }, [itemToRemove])

  const cancelRemoveItem = useCallback(() => {
    setItemToRemove(null)
  }, [])

  const decrementItemQuantity = useCallback(
    (id: string) => {
      const target = items.find((item) => item.id === id)
      if (!target) return

      const currentQty = target.quantity ?? 1
      if (currentQty <= 1) {
        setItemToRemove(target)
        return
      }

      const newQty = currentQty - 1
      const baseUnit = target.unitPrice ?? target.amount / currentQty

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item
          return {
            ...item,
            quantity: newQty,
            unitPrice: baseUnit,
            amount: Math.round(baseUnit * newQty * 100) / 100
          }
        })
      )
    },
    [items]
  )

  const removeItem = useCallback(
    (id: string) => {
      const target = items.find((item) => item.id === id)
      if (target) {
        setItemToRemove(target)
      }
    },
    [items]
  )

  const clearItems = useCallback(() => {
    setItems([])
    setShowConfirmClear(false)
    setInputKey((k) => k + 1)
  }, [])

  const handleCopy = useCallback(async (target: Currency, formattedText: string) => {
    await setStringAsync(formattedText)
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current)
    }
    setCopiedCurrency(target)
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedCurrency(null)
    }, 1500)
  }, [])

  const setExtraCostCurrency = useCallback((newCurrency: Currency) => {
    setExtraCostCurrencyState(newCurrency)
    setExtraCostCents(0)
    setExtraCostInputKey((k) => k + 1)
  }, [])

  const openRegisterFlow = useCallback(() => {
    setExtraCostCurrencyState(currency)
    setExtraCostCents(0)
    setExtraCostName('')
    setExtraCostInputKey((k) => k + 1)
    setShowExtraCostModal(true)
  }, [currency])

  const closeExtraCostModal = useCallback(() => {
    setShowExtraCostModal(false)
  }, [])

  const skipExtraCost = useCallback(() => {
    setShowExtraCostModal(false)
    setExpenseName('Mercado')
    setExpenseCategory('Compras')
    setShowRegisterModal(true)
  }, [])

  const applyExtraCostAndContinue = useCallback(() => {
    if (extraCostCents > 0) {
      const baseName = extraCostName.trim() || 'Bolsa'
      let finalAmount = extraCostAmount
      let label = baseName

      if (extraCostCurrency !== currency) {
        label = `${baseName} (${formatAmount(extraCostAmount, extraCostCurrency)})`
        if (rates) {
          const converted = convert(extraCostAmount, extraCostCurrency, currency, rates)
          finalAmount = Math.max(0.01, converted)
        }
      }

      setItems((prev) => [
        ...prev,
        {
          id: generateId(),
          name: label,
          amount: finalAmount
        }
      ])
    }
    setShowExtraCostModal(false)
    setExpenseName('Mercado')
    setExpenseCategory('Compras')
    setShowRegisterModal(true)
  }, [extraCostCents, extraCostAmount, extraCostName, extraCostCurrency, currency, rates])

  const openRegisterModal = useCallback(() => {
    openRegisterFlow()
  }, [openRegisterFlow])

  const closeRegisterModal = useCallback(() => {
    setShowRegisterModal(false)
  }, [])

  const confirmRegisterExpense = useCallback(async () => {
    if (!onRegisterExpense || totalAmount <= 0) return

    setSavingExpense(true)
    try {
      const summaryNote = `${items.length} articulos de mercado:\n${items
        .map((item) => {
          const qty = item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ''
          return `• ${qty}${item.name} (${formatAmount(item.amount, currency)})`
        })
        .join('\n')}`

      await onRegisterExpense({
        name: expenseName.trim() || 'Mercado',
        amount: totalAmount,
        currency,
        type: 'unique',
        category: expenseCategory.trim() || 'Compras',
        note: summaryNote
      })

      setShowRegisterModal(false)
      setShowSuccessDialog(true)
      setItems([])
    } finally {
      setSavingExpense(false)
    }
  }, [onRegisterExpense, totalAmount, items, expenseName, currency, expenseCategory])

  const closeSuccessDialog = useCallback(() => {
    setShowSuccessDialog(false)
  }, [])

  return {
    currency,
    items,
    itemName,
    amountCents,
    quantity,
    inputKey,
    currentAmount,
    totalAmount,
    equivalences,
    copiedCurrency,
    showConfirmClear,
    itemToRemove,
    showExtraCostModal,
    extraCostCurrency,
    extraCostCents,
    extraCostName,
    extraCostInputKey,
    extraCostEquivalent,
    showRegisterModal,
    expenseName,
    expenseCategory,
    savingExpense,
    showSuccessDialog,
    ratesState,
    rates,
    setItemName,
    setShowConfirmClear,
    setExtraCostCurrency,
    setExtraCostCents,
    setExtraCostName,
    setExpenseName,
    setExpenseCategory,
    handleCentsChange,
    handleCurrencyChange,
    addItem,
    incrementQuantity,
    decrementQuantity,
    setCustomQuantity,
    incrementItemQuantity,
    decrementItemQuantity,
    requestRemoveItem,
    confirmRemoveItem,
    cancelRemoveItem,
    removeItem,
    clearItems,
    handleCopy,
    openRegisterFlow,
    openRegisterModal,
    closeExtraCostModal,
    skipExtraCost,
    applyExtraCostAndContinue,
    closeRegisterModal,
    confirmRegisterExpense,
    closeSuccessDialog
  }
}
