/**
 * Pruebas unitarias del repositorio de ajustes sobre SQLite simulado.
 */

import { closeDatabase } from '@src/db/base'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@src/db/settings'

import { FakeDatabase, initFakeDatabase } from '../../helpers/expoSqliteMock'

describe('repositorio de ajustes', () => {
  let base: FakeDatabase

  beforeEach(async () => {
    await closeDatabase()
    base = initFakeDatabase()
  })

  it('expone los valores por defecto esperados', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      baseCurrency: 'USD',
      reminderHour: 9,
      reminderMinute: 0,
      bcvHour: 9,
      bcvMinute: 0,
      remindersEnabled: true,
      bcvEnabled: true,
      biometricsEnabled: false,
      themePreference: 'system'
    })
  })

  it('devuelve los valores por defecto cuando no hay fila guardada', async () => {
    await expect(loadSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('hace ida y vuelta completa de guardar a leer', async () => {
    const guardados = {
      baseCurrency: 'VES',
      reminderHour: 19,
      reminderMinute: 30,
      bcvHour: 8,
      bcvMinute: 15,
      remindersEnabled: false,
      bcvEnabled: false,
      biometricsEnabled: false,
      themePreference: 'dark'
    } as const

    await saveSettings(guardados)

    expect(base.findByFragment('INSERT INTO settings')[0].sql).toContain('ON CONFLICT(key)')

    base.queue([{ value: JSON.stringify(guardados) }])

    await expect(loadSettings()).resolves.toEqual(guardados)
  })

  it('completa con defaults los campos ausentes de un JSON antiguo', async () => {
    base.queue([{ value: JSON.stringify({ baseCurrency: 'VES', reminderHour: 19 }) }])

    await expect(loadSettings()).resolves.toEqual({
      baseCurrency: 'VES',
      reminderHour: 19,
      reminderMinute: 0,
      bcvHour: 9,
      bcvMinute: 0,
      remindersEnabled: true,
      bcvEnabled: true,
      biometricsEnabled: false,
      themePreference: 'system'
    })
  })

  it('recupera los defaults ante JSON corrupto persistido', async () => {
    base.queue([{ value: '{moneda roto' }])

    await expect(loadSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('rechaza moneda base desconocida y cae a defaults', async () => {
    base.queue([{ value: JSON.stringify({ baseCurrency: 'GBP', reminderHour: 8 }) }])

    await expect(loadSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })
})
