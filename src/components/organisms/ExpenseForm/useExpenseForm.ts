/**
 * Logica del organismo ExpenseForm.
 * Administra el estado de todos los campos, la validacion,
 * la conversion del monto regional y las acciones de guardar/eliminar,
 * incluyendo la confirmacion propia en lugar del Alert nativo.
 */

import { useCallback, useMemo, useState } from 'react'

import { amountFromCents, centsFromText, textFromCents } from '@src/lib/money'
import { toISODate } from '@src/lib/recurrences'
import type { Currency, Expense, ExpenseInput, ExpenseType, Recurrence } from '@src/types/domain'
import { RECURRENCE_LABELS } from '@src/types/domain'

/** Errores de validacion por campo */
export interface FormErrors {
  name?: string
  amount?: string
}

/** Estado y acciones expuestos por el hook del formulario */
export interface UseExpenseFormResult {
  type: ExpenseType
  name: string
  amountText: string
  currency: Currency
  category: string
  note: string
  recurrence: Recurrence
  dueDateISO: string
  showDatePicker: boolean
  deleteConfirmationVisible: boolean
  errors: FormErrors
  saving: boolean
  dueDateLabel: string
  setType: (type: ExpenseType) => void
  setName: (text: string) => void
  setAmountText: (text: string) => void
  setCurrency: (currency: Currency) => void
  setCategory: (text: string) => void
  setNote: (text: string) => void
  setRecurrence: (recurrence: Recurrence) => void
  openDatePicker: () => void
  closeDatePicker: () => void
  pickDueDate: (isoDate: string) => void
  submit: () => Promise<void>
  requestDeleteConfirmation: () => void
  dismissDeleteConfirmation: () => void
  confirmDelete: () => Promise<void>
}

/**
 * Construye la entrada tipada a partir del estado del formulario.
 * Los gastos unicos omiten recurrencia y vencimiento por diseno.
 * @param state Campos actuales ya validados
 * @returns Entrada lista para el repositorio
 */
function buildInput(state: {
  type: ExpenseType
  name: string
  amount: number
  currency: Currency
  category: string
  note: string
  recurrence: Recurrence
  dueDateISO: string
}): ExpenseInput {
  const base: ExpenseInput = {
    name: state.name.trim(),
    amount: state.amount,
    currency: state.currency,
    type: state.type,
    category: state.category.trim() || undefined,
    note: state.note.trim() || undefined
  }

  if (state.type === 'fixed') {
    base.recurrence = state.recurrence
    base.nextDueDate = state.dueDateISO
  }

  return base
}

/**
 * Hook central del formulario de gastos (crear y editar).
 * @param initialExpense Gasto a editar; null para creacion
 * @param onSave Callback persistente invocado con la entrada validada
 * @param onDelete Callback de eliminacion; se ejecuta tras confirmar
 * @returns Campos controlados, errores y acciones del formulario
 */
export function useExpenseForm(
  initialExpense: Expense | null,
  onSave: (input: ExpenseInput) => Promise<void>,
  onDelete?: () => Promise<void>
): UseExpenseFormResult {
  const todayISO = toISODate(new Date())

  const [type, setType] = useState<ExpenseType>(initialExpense?.type ?? 'unique')
  const [name, setName] = useState(initialExpense?.name ?? '')
  const [amountCents, setAmountCents] = useState(
    initialExpense ? Math.round(initialExpense.amount * 100) : 0
  )
  const [currency, setCurrency] = useState<Currency>(initialExpense?.currency ?? 'USD')
  const [category, setCategory] = useState(initialExpense?.category ?? '')
  const [note, setNote] = useState(initialExpense?.note ?? '')
  const [recurrence, setRecurrence] = useState<Recurrence>(initialExpense?.recurrence ?? 'monthly')
  const [dueDateISO, setDueDateISO] = useState(initialExpense?.nextDueDate ?? todayISO)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  const amountText = useMemo(() => textFromCents(amountCents), [amountCents])

  const dueDateLabel = useMemo(() => formatDateLabel(dueDateISO), [dueDateISO])

  const openDatePicker = useCallback(() => setShowDatePicker(true), [])
  const closeDatePicker = useCallback(() => setShowDatePicker(false), [])

  const pickDueDate = useCallback((isoDate: string) => {
    setDueDateISO(isoDate)
    setShowDatePicker(false)
  }, [])

  const validateAndSubmit = useCallback(async () => {
    const newErrors: FormErrors = {}

    if (!name.trim()) newErrors.name = 'Ponle un nombre al gasto'
    if (amountCents <= 0) newErrors.amount = 'Ingresa un monto mayor que cero'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0 || saving) return

    setSaving(true)

    try {
      await onSave(
        buildInput({
          type,
          name,
          amount: amountFromCents(amountCents),
          currency,
          category,
          note,
          recurrence,
          dueDateISO
        })
      )
    } finally {
      setSaving(false)
    }
  }, [onSave, amountCents, category, currency, dueDateISO, name, note, recurrence, saving, type])

  const submit = useCallback(async () => {
    await validateAndSubmit()
  }, [validateAndSubmit])

  const requestDeleteConfirmation = useCallback(() => setDeleteConfirmationVisible(true), [])
  const dismissDeleteConfirmation = useCallback(() => setDeleteConfirmationVisible(false), [])

  const confirmDelete = useCallback(async () => {
    setDeleteConfirmationVisible(false)

    if (onDelete) await onDelete()
  }, [onDelete])

  return {
    type,
    name,
    amountText,
    currency,
    category,
    note,
    recurrence,
    dueDateISO,
    showDatePicker,
    deleteConfirmationVisible,
    errors,
    saving,
    dueDateLabel,
    setType,
    setName,
    setAmountText: (text: string) => setAmountCents(centsFromText(text)),
    setCurrency,
    setCategory,
    setNote,
    setRecurrence,
    openDatePicker,
    closeDatePicker,
    pickDueDate,
    submit,
    requestDeleteConfirmation,
    dismissDeleteConfirmation,
    confirmDelete
  }
}

/**
 * Convierte una fecha ISO yyyy-mm-dd a etiqueta dd/mm/yyyy.
 * @param iso Fecha en formato yyyy-mm-dd
 * @returns Fecha legible para el campo del formulario
 */
function formatDateLabel(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

/** Reexporta etiquetas para uso directo de la vista sin acoplarse al dominio */
export { RECURRENCE_LABELS }
