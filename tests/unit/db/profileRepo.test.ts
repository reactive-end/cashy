/**
 * Pruebas unitarias del repositorio de perfil sobre SQLite simulado.
 */

import { closeDatabase } from '@src/db/base'
import { getProfile, isProfileComplete, saveProfile } from '@src/db/profile'

import { FakeDatabase, initFakeDatabase } from '../../helpers/expoSqliteMock'

describe('repositorio de perfil', () => {
  let base: FakeDatabase

  beforeEach(async () => {
    await closeDatabase()
    base = initFakeDatabase()
  })

  it('devuelve null cuando el onboarding no se completo', async () => {
    await expect(getProfile()).resolves.toBeNull()
    await expect(isProfileComplete()).resolves.toBe(false)
  })

  it('guarda el perfil con id fijo y upsert sobre conflictos', async () => {
    const profile = { firstName: 'Carlos', lastName: 'Perez', email: 'c@perez.com' }

    await saveProfile(profile)

    const insertion = base.findByFragment('INSERT INTO profile')[0]
    expect(insertion.params).toEqual([
      'local',
      'Carlos',
      'Perez',
      'c@perez.com',
      expect.any(String),
      expect.any(String)
    ])
    expect(insertion.sql).toContain('ON CONFLICT(id) DO UPDATE')
  })

  it('lee el perfil guardado mapeando la fila completa', async () => {
    base.queue([{ first_name: 'Carlos', last_name: 'Perez', email: 'c@perez.com' }])

    await expect(getProfile()).resolves.toEqual({
      firstName: 'Carlos',
      lastName: 'Perez',
      email: 'c@perez.com'
    })
  })

  it('considera completo un perfil con los tres campos llenos', async () => {
    base.queue([{ first_name: 'Carlos', last_name: 'Perez', email: 'c@perez.com' }])

    await expect(isProfileComplete()).resolves.toBe(true)
  })

  it('trata como incompleto un perfil con campos vacios', async () => {
    base.queue([{ first_name: 'Carlos', last_name: '', email: 'c@perez.com' }])

    await expect(isProfileComplete()).resolves.toBe(false)
  })
})
