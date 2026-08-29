/**
 * Hook useOnboarding: maquina de estados del formulario por pasos.
 * Paso 1 captura la identidad (nombre, apellido, correo); paso 2
 * administra una tabla de ingresos con altas, ediciones y bajas.
 * Las validaciones corren en tiempo real desde el primer caracter y
 * bloquean el avance mientras existan campos invalidos. Nada se
 * persiste hasta terminar: cerrar la app a medio camino regresa al
 * wizard en la proxima apertura.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ProfileFieldErrors } from '@src/components/molecules/ProfileFields'
import type { IncomeDraft } from '@src/components/organisms/IncomeEditor'
import { deleteIncome, getIncomes, replaceIncomes } from '@src/db/incomes'
import { saveProfile } from '@src/db/profile'
import { emit, subscribe } from '@src/lib/events'
import { generateId } from '@src/lib/ids'
import {
  emailSchema,
  firstNameSchema,
  isValidIncomeRow,
  lastNameSchema,
  parseDayFromText,
  validateField
} from '@src/lib/validation'
import type { Income, UserProfile } from '@src/types/domain'

/** Cantidad total de pasos del wizard */
export const TOTAL_STEPS = 2

/** Fila vacia para capturar un ingreso nuevo */
export function emptyRow(): IncomeDraft {
  return {
    name: '',
    amountCents: 0,
    currency: 'USD',
    paydayDayText: '',
    type: 'fixed',
    recurrence: 'monthly'
  }
}

/** Perfil vacio para el arranque del wizard */
function emptyProfile(): UserProfile {
  return { firstName: '', lastName: '', email: '' }
}

/**
 * Calcula los mensajes visibles del paso de identidad.
 * Cada error aparece desde el primer caracter tecleado.
 * @param values Valores vigentes de los tres campos
 * @returns Mensaje por campo o null cuando no aplica mostrarlo
 */
function deriveProfileErrors(values: UserProfile): ProfileFieldErrors {
  const nameMessage = validateField(firstNameSchema, values.firstName)
  const lastNameMessage = validateField(lastNameSchema, values.lastName)
  const emailMessage = validateField(emailSchema, values.email)

  return {
    firstName: values.firstName.length > 0 ? nameMessage : null,
    lastName: values.lastName.length > 0 ? lastNameMessage : null,
    email: values.email.length > 0 ? emailMessage : null
  }
}

/** Estado y acciones expuestos por el hook de onboarding */
export interface UseOnboardingResult {
  /** Paso actual, base 0 */
  step: number
  /** Valores vigentes del paso de identidad */
  profile: UserProfile
  /** Errores en vivo del paso de identidad */
  profileErrors: ProfileFieldErrors
  /** true cuando los tres campos cumplen sus esquemas */
  isProfileValid: boolean
  /** Modifica un campo del perfil */
  changeProfileField: (field: keyof UserProfile, value: string) => void
  /** Avanza al paso 2; solo si el paso actual es valido */
  advanceStep: () => void
  /** Regresa al paso anterior */
  goBackStep: () => void
  /** Fila en capturacion dentro del paso de ingresos */
  row: IncomeDraft
  /** Identificador del borrador en edicion; null al agregar */
  editingId: string | null
  /** Ingresos confirmados en el borrador actual */
  draftIncomes: readonly Income[]
  /** Modifica la fila en capturacion */
  changeRow: (row: IncomeDraft) => void
  /** Confirma la fila si es valida; agrega o guarda cambios */
  confirmRow: () => boolean
  /** Carga un borrador a la fila para editarlo */
  editIncome: (id: string) => void
  /** Retira un borrador de la tabla */
  removeIncome: (id: string) => void
  /** true mientras persiste el resultado final */
  saving: boolean
  /** Persiste perfil e ingresos; emite eventos de sincronizacion */
  finish: () => Promise<boolean>
}

/**
 * Administra el flujo completo del onboarding en memoria.
 * @returns Estado reactivo del wizard con acciones por paso
 */
export function useOnboarding(): UseOnboardingResult {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<UserProfile>(emptyProfile)
  const [row, setRow] = useState<IncomeDraft>(emptyRow)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    getIncomes()
      .then((loaded) => {
        if (active) setIncomes(loaded)
      })
      .catch(() => undefined)

    const unsubscribe = subscribe('incomes-changed', () => {
      getIncomes()
        .then((loaded) => {
          if (active) setIncomes(loaded)
        })
        .catch(() => undefined)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const profileErrors = useMemo(() => deriveProfileErrors(profile), [profile])
  // La validez real consulta los esquemas aunque el campo este vacio;
  // los mensajes visibles solo aparecen desde el primer caracter.
  const isProfileValid =
    validateField(firstNameSchema, profile.firstName) === null &&
    validateField(lastNameSchema, profile.lastName) === null &&
    validateField(emailSchema, profile.email) === null

  const changeProfileField = useCallback((field: keyof UserProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }))
  }, [])

  const advanceStep = useCallback(() => {
    if (!isProfileValid) return
    setStep(1)
  }, [isProfileValid])

  const goBackStep = useCallback(() => {
    setEditingId(null)
    setRow(emptyRow())
    setStep(0)
  }, [])

  const confirmRow = useCallback((): boolean => {
    if (!isValidIncomeRow(row)) return false

    const isUnique = row.type === 'unique'
    const content: Omit<Income, 'id' | 'createdAt' | 'updatedAt'> = {
      name: row.name.trim(),
      amount: row.amountCents / 100,
      currency: row.currency,
      paydayDay: isUnique
        ? (parseDayFromText(row.paydayDayText) ?? new Date().getDate())
        : (parseDayFromText(row.paydayDayText) as number),
      type: row.type ?? 'fixed',
      recurrence: isUnique ? undefined : (row.recurrence ?? 'monthly')
    }

    if (editingId) {
      setIncomes((current) =>
        current.map((income) => (income.id === editingId ? { ...income, ...content } : income))
      )
    } else {
      setIncomes((current) => [
        ...current,
        {
          ...content,
          id: `borrador-${generateId()}`,
          createdAt: '',
          updatedAt: ''
        }
      ])
    }

    setEditingId(null)
    setRow(emptyRow())

    return true
  }, [editingId, row])

  const editIncome = useCallback(
    (id: string) => {
      const target = incomes.find((income) => income.id === id)

      if (!target) return

      setEditingId(id)
      setRow({
        name: target.name,
        amountCents: Math.round(target.amount * 100),
        currency: target.currency,
        paydayDayText: String(target.paydayDay)
      })
    },
    [incomes]
  )

  const removeIncome = useCallback(
    (id: string) => {
      setIncomes((current) => current.filter((income) => income.id !== id))
      void deleteIncome(id).then(() => emit('incomes-changed'))

      if (editingId === id) {
        setEditingId(null)
        setRow(emptyRow())
      }
    },
    [editingId]
  )

  const finish = useCallback(async (): Promise<boolean> => {
    if (!isProfileValid) return false

    setSaving(true)

    try {
      await saveProfile({
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        email: profile.email.trim()
      })

      await replaceIncomes(
        incomes.map(({ name, amount, currency, paydayDay }) => ({
          name,
          amount,
          currency,
          paydayDay
        }))
      )

      emit('profile-changed')
      emit('incomes-changed')

      return true
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }, [incomes, profile, isProfileValid])

  return {
    step,
    profile,
    profileErrors,
    isProfileValid,
    changeProfileField,
    advanceStep,
    goBackStep,
    row,
    editingId,
    draftIncomes: incomes,
    changeRow: setRow,
    confirmRow,
    editIncome,
    removeIncome,
    saving,
    finish
  }
}
