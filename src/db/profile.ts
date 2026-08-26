/**
 * User profile repository over SQLite.
 * Single-row table ('local') holding the identity captured in the
 * onboarding wizard: first name, last name and email.
 */

import type { UserProfile } from '@src/types/domain'

import { openDatabase } from './base'

/** Identificador fijo de la unica fila de perfil */
const PROFILE_ID = 'local'

/** Forma cruda de una fila de la tabla profile */
interface ProfileRow {
  first_name: string
  last_name: string
  email: string
}

/** Marca de tiempo actual en ISO */
function nowISO(): string {
  return new Date().toISOString()
}

/**
 * Lee el perfil del usuario.
 * @returns Perfil guardado o null cuando el onboarding no se completo
 */
export async function getProfile(): Promise<UserProfile | null> {
  const db = await openDatabase()
  const row = await db.getFirstAsync<ProfileRow>(
    'SELECT first_name, last_name, email FROM profile WHERE id = ?',
    [PROFILE_ID]
  )

  if (!row) return null

  return { firstName: row.first_name, lastName: row.last_name, email: row.email }
}

/**
 * Indica si existe un perfil completo guardado.
 * @returns true solo con fila persistida y tres campos no vacios
 */
export async function isProfileComplete(): Promise<boolean> {
  const profile = await getProfile()

  return (
    profile !== null &&
    profile.firstName.trim().length > 0 &&
    profile.lastName.trim().length > 0 &&
    profile.email.trim().length > 0
  )
}

/**
 * Guarda (o reemplaza) el perfil del usuario conservando created_at.
 * @param profile Datos validados del formulario de identidad
 */
export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await openDatabase()
  const timestamp = nowISO()

  await db.runAsync(
    `INSERT INTO profile (id, first_name, last_name, email, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       first_name = excluded.first_name,
       last_name = excluded.last_name,
       email = excluded.email,
       updated_at = excluded.updated_at`,
    [PROFILE_ID, profile.firstName, profile.lastName, profile.email, timestamp, timestamp]
  )
}
