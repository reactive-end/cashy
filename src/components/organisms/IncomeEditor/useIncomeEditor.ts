/**
 * Logica del organismo IncomeEditor: validacion en tiempo real de
 * concepto, monto y dia de cobro con mensajes en espanol derivados
 * de los esquemas zod del proyecto.
 */

import { useMemo } from 'react'

import { incomeSchema, parseDayFromText, validateField } from '@src/lib/validation'

import type { IncomeDraft } from './IncomeEditor.d'

/** Errores visibles por campo del editor */
export interface IncomeRowErrors {
  name: string | null
  amount: string | null
  paydayDay: string | null
}

/** Opciones que consume el hook interno del editor */
interface UseIncomeRowErrorsOptions {
  values: IncomeDraft
}

/**
 * Deriva errores en vivo y la validez global de la fila.
 * @param props Valores actuales del formulario
 * @returns Errores por campo, bandera de validez y datos parseados
 */
export function useIncomeRowValidation({ values }: UseIncomeRowErrorsOptions) {
  const isUnique = values.type === 'unique'
  const nameError = validateField(incomeSchema.shape.name, values.name)
  const dayError = isUnique
    ? null
    : validateField(incomeSchema.shape.paydayDay, parseDayFromText(values.paydayDayText) ?? -1)
  const amountError = values.amountCents > 0 ? null : 'El monto debe ser mayor a cero'

  const errors: IncomeRowErrors = useMemo(
    () => ({
      // El mensaje aparece desde el primer caracter tecleado.
      name: values.name.length > 0 ? nameError : null,
      amount: amountError,
      paydayDay: !isUnique && values.paydayDayText.length > 0 ? dayError : null
    }),
    [nameError, dayError, amountError, values.name.length, values.paydayDayText.length, isUnique]
  )

  const isRowValid = nameError === null && dayError === null && amountError === null

  return {
    errors,
    isRowValid,
    parsedDay: isUnique ? new Date().getDate() : parseDayFromText(values.paydayDayText)
  }
}
