/**
 * Tipos publicos de la molecula ProfileFields.
 * Campos de identidad del onboarding con validacion en tiempo real.
 */

import type { UserProfile } from '@src/types/domain'

/** Estado de errores por campo del perfil */
export interface ProfileFieldErrors {
  firstName: string | null
  lastName: string | null
  email: string | null
}

/** Propiedades de la molecula ProfileFields */
export interface ProfileFieldsProps {
  /** Valores vigentes del formulario de identidad */
  values: UserProfile
  /** Mensajes de error calculados por campo */
  errors: ProfileFieldErrors
  /** Callback al modificar cualquiera de los tres campos */
  onChange: (field: keyof UserProfile, value: string) => void
  /** testID base para automatizacion (sufijos -firstName, -lastName, -email) */
  testIDBase?: string
}
