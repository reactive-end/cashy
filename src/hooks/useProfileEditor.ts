/**
 * Hook useProfileEditor: edicion de la identidad del usuario y su
 * tabla de ingresos desde Ajustes. Precarga el perfil guardado,
 * permite editar cada ingreso con persistencia inmediata y emite
 * los eventos de sincronizacion correspondientes.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ProfileFieldErrors } from '@src/components/molecules/ProfileFields'
import type { IncomeDraft } from '@src/components/organisms/IncomeEditor'
import { deleteIncome, getIncomes, insertIncome, updateIncome } from '@src/db/incomes'
import { getProfile, saveProfile } from '@src/db/profile'
import { emit } from '@src/lib/events'
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

/** Estado y acciones expuestos por el hook de edicion de perfil */
export interface UseProfileEditorResult {
  /** Identidad vigente en el formulario */
  profile: UserProfile
  /** Errores en vivo por campo de identidad */
  profileErrors: ProfileFieldErrors
  /** true cuando los tres campos cumplen sus esquemas */
  isProfileValid: boolean
  /** true mientras persiste el perfil */
  savingProfile: boolean
  /** Modifica un campo de identidad */
  changeProfileField: (field: keyof UserProfile, value: string) => void
  /** Persiste la identidad; true al confirmarse */
  saveProfile: () => Promise<boolean>
  /** Ingresos vigentes leidos de la base */
  incomes: readonly Income[]
  /** true durante la primera lectura de datos */
  loading: boolean
  /** Fila en capturacion dentro del editor de ingresos */
  row: IncomeDraft
  /** Identificador del ingreso en edicion; null al agregar */
  editingId: string | null
  /** Modifica la fila en capturacion */
  changeRow: (row: IncomeDraft) => void
  /** Confirma la fila; inserta o actualiza segun el modo */
  confirmRow: () => Promise<boolean>
  /** Carga un ingreso existente a la fila para editarlo */
  editIncome: (id: string) => void
  /** Elimina el ingreso y refresca la tabla */
  removeIncome: (id: string) => Promise<void>
  /** Descarta la edicion en curso y limpia la fila */
  cancelRowEdit: () => void
}

/**
 * Administra la edicion de identidad e ingresos con escritura
 * inmediata en la base local.
 * @returns Estado reactivo y acciones del editor
 */
export function useProfileEditor(): UseProfileEditorResult {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: ''
  })
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [row, setRow] = useState<IncomeDraft>(emptyRow)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load(): Promise<void> {
      const [savedProfile, savedIncomes] = await Promise.all([getProfile(), getIncomes()])

      if (!active) return

      if (savedProfile) setProfile(savedProfile)
      setIncomes(savedIncomes)
      setLoading(false)
    }

    load().catch(() => {
      // Sin datos legibles el formulario queda vacio y editable.
      if (active) setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const profileErrors = useMemo<ProfileFieldErrors>(
    () => ({
      firstName:
        profile.firstName.length > 0 ? validateField(firstNameSchema, profile.firstName) : null,
      lastName:
        profile.lastName.length > 0 ? validateField(lastNameSchema, profile.lastName) : null,
      email: profile.email.length > 0 ? validateField(emailSchema, profile.email) : null
    }),
    [profile]
  )

  const isProfileValid =
    validateField(firstNameSchema, profile.firstName) === null &&
    validateField(lastNameSchema, profile.lastName) === null &&
    validateField(emailSchema, profile.email) === null

  const changeProfileField = useCallback((field: keyof UserProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }))
  }, [])

  const saveIdentity = useCallback(async (): Promise<boolean> => {
    if (!isProfileValid) return false

    setSavingProfile(true)

    try {
      await saveProfile({
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        email: profile.email.trim()
      })
      emit('profile-changed')

      return true
    } catch {
      return false
    } finally {
      setSavingProfile(false)
    }
  }, [profile, isProfileValid])

  const reloadIncomes = useCallback(async (): Promise<void> => {
    setIncomes(await getIncomes())
  }, [])

  const confirmRow = useCallback(async (): Promise<boolean> => {
    if (!isValidIncomeRow(row)) return false

    const isUnique = row.type === 'unique'
    const content = {
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
      await updateIncome(editingId, content)
    } else {
      await insertIncome(content, generateId())
    }

    await reloadIncomes()
    emit('incomes-changed')

    setEditingId(null)
    setRow(emptyRow())

    return true
  }, [editingId, row, reloadIncomes])

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
    async (id: string) => {
      await deleteIncome(id)
      await reloadIncomes()
      emit('incomes-changed')

      if (editingId === id) {
        setEditingId(null)
        setRow(emptyRow())
      }
    },
    [editingId, reloadIncomes]
  )

  const cancelRowEdit = useCallback(() => {
    setEditingId(null)
    setRow(emptyRow())
  }, [])

  return {
    profile,
    profileErrors,
    isProfileValid,
    savingProfile,
    changeProfileField,
    saveProfile: saveIdentity,
    incomes,
    loading,
    row,
    editingId,
    changeRow: setRow,
    confirmRow,
    editIncome,
    removeIncome,
    cancelRowEdit
  }
}
