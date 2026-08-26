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

  it('v4 a v6 recrea perfil con columnas en ingles, crea ingresos, recibos y sella la version 6', async () => {
    // La consulta de existencia de expenses devuelve vacio (no hay tabla previa);
    // la de profile devuelve la tabla antigua para ejercitar el renombre.
    base.queue([])
    base.queue([{ name: 'profile' }])

    await loadSettings()

    expect(base.findByFragment('CREATE TABLE profile_nueva')).toHaveLength(1)
    expect(base.findByFragment('ALTER TABLE profile_nueva RENAME TO profile')).toHaveLength(1)
    expect(base.findByFragment('CREATE TABLE IF NOT EXISTS incomes')).toHaveLength(1)
    expect(base.findByFragment('CREATE TABLE IF NOT EXISTS income_receipts')).toHaveLength(1)
    expect(base.findByFragment('PRAGMA user_version = 6')).toHaveLength(1)
  })

  it('no reejecuta la migracion cuando la base ya esta en la version vigente', async () => {
    await closeDatabase()
    const currentBase = initFakeDatabase()

    await loadSettings()

    expect(currentBase.findByFragment('CREATE TABLE IF NOT EXISTS incomes')).toHaveLength(0)
    expect(currentBase.findByFragment('CREATE TABLE IF NOT EXISTS income_receipts')).toHaveLength(0)
    expect(currentBase.findByFragment('PRAGMA user_version = 6')).toHaveLength(0)
  })
})
