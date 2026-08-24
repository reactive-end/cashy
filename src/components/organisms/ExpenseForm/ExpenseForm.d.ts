/**
 * Tipos publicos del organismo ExpenseForm.
 */

import type { Expense, ExpenseInput } from '@src/types/domain'

/** Propiedades del formulario de gastos (crear y editar) */
export interface ExpenseFormProps {
  /** Gasto en edicion; omitir o null para crear uno nuevo */
  initialExpense?: Expense | null
  /** Persiste la entrada validada; el padre decide si crea o actualiza */
  onSave: (input: ExpenseInput) => Promise<void>
  /** Elimina el gasto; solo se muestra su boton en modo edicion */
  onDelete?: () => Promise<void>
}
