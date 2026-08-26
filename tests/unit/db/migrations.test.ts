/**
 * Pruebas de la estrategia de migracion por PRAGMA user_version.
 * Verifica que el paso a v5 renombre las columnas de perfil al ingles
 * preservando las tablas existentes y sellando la version final.
 */

import { closeDatabase } from '@src/db/base'
import { loadSettings } from '@src/db/settings'

import { FakeDatabase, initFakeDatabase } from '../../helpers/expoSqliteMock'

describe('migracion de esquema', () => {
  let base: FakeDatabase

  beforeEach(async () => {
    await closeDatabase()
    base = initFakeDatabase(4)
  })

  it('v4 a v5 recrea perfil con columnas en ingles, crea ingresos y sella la version 5', async () => {
    // La consulta de existencia de expenses devuelve vacio (no hay tabla previa);
    // la de profile devuelve la tabla antigua para ejercitar el renombre.
    base.queue([])
    base.queue([{ name: 'profile' }])

    await loadSettings()

    expect(base.findByFragment('CREATE TABLE profile_nueva')).toHaveLength(1)
    expect(base.findByFragment('ALTER TABLE profile_nueva RENAME TO profile')).toHaveLength(1)
    expect(base.findByFragment('CREATE TABLE IF NOT EXISTS incomes')).toHaveLength(1)
    expect(base.findByFragment('PRAGMA user_version = 5')).toHaveLength(1)
  })

  it('no reejecuta la migracion cuando la base ya esta en la version vigente', async () => {
    await closeDatabase()
    const currentBase = initFakeDatabase()

    await loadSettings()

    expect(currentBase.findByFragment('CREATE TABLE IF NOT EXISTS incomes')).toHaveLength(0)
    expect(currentBase.findByFragment('PRAGMA user_version = 5')).toHaveLength(0)
  })
})
