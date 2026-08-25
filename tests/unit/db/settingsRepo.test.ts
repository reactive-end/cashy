/**
 * Pruebas unitarias del repositorio de ajustes sobre SQLite simulado.
 */

import { closeDatabase } from '@src/db/base'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@src/db/settings'

import { FakeDatabase, iniciarBaseFalsa } from '../../helpers/expoSqliteMock'

describe('repositorio de ajustes', () => {
  let base: FakeDatabase

  beforeEach(async () => {
    await closeDatabase()
    base = iniciarBaseFalsa()
  })

  it('expone los valores por defecto esperados', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      baseCurrency: 'USD',
      reminderHour: 9,
      bcvHour: 9,
      remindersEnabled: true,
      bcvEnabled: true
    })
  })

  it('devuelve los valores por defecto cuando no hay fila guardada', async () => {
    await expect(loadSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('hace ida y vuelta completa de guardar a leer', async () => {
    const guardados = {
      baseCurrency: 'VES',
      reminderHour: 19,
      bcvHour: 8,
      remindersEnabled: false,
      bcvEnabled: false
    } as const

    await saveSettings(guardados)

    expect(base.buscar('INSERT INTO settings')[0].sql).toContain('ON CONFLICT(key)')

    base.encolar([{ value: JSON.stringify(guardados) }])

    await expect(loadSettings()).resolves.toEqual(guardados)
  })

  it('completa con defaults los campos ausentes de un JSON antiguo', async () => {
    base.encolar([{ value: JSON.stringify({ baseCurrency: 'VES', reminderHour: 19 }) }])

    await expect(loadSettings()).resolves.toEqual({
      baseCurrency: 'VES',
      reminderHour: 19,
      bcvHour: 9,
      remindersEnabled: true,
      bcvEnabled: true
    })
  })

  it('recupera los defaults ante JSON corrupto persistido', async () => {
    base.encolar([{ value: '{moneda roto' }])

    await expect(loadSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('rechaza moneda base desconocida y cae a defaults', async () => {
    base.encolar([{ value: JSON.stringify({ baseCurrency: 'GBP', reminderHour: 8 }) }])

    await expect(loadSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })
})
