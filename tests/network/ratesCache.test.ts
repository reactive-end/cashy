/**
 * Pruebas del cache de tasas sobre el mock oficial de AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

import { clearRates, loadRates, saveRates } from '@src/services/rates-cache'

import { buildRates } from '../helpers/factories'

describe('rates-cache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  it('devuelve null cuando nunca se guardo un snapshot', async () => {
    await expect(loadRates()).resolves.toBeNull()
  })

  it('hace ida y vuelta completa de guardado a lectura', async () => {
    const snapshot = buildRates()

    await saveRates(snapshot)

    await expect(loadRates()).resolves.toEqual(snapshot)
  })

  it('descarta contenido corrupto en almacenamiento', async () => {
    await AsyncStorage.setItem('cashy.rates', '{json roto')

    await expect(loadRates()).resolves.toBeNull()
  })

  it('descarta snapshots con campos faltantes o de otro tipo', async () => {
    await AsyncStorage.setItem(
      'cashy.rates',
      JSON.stringify({ bcvUsd: 'gratis', fetchedAt: 'ayer' })
    )

    await expect(loadRates()).resolves.toBeNull()
  })

  it('elimina el snapshot con clearRates', async () => {
    await saveRates(buildRates())

    await clearRates()

    await expect(loadRates()).resolves.toBeNull()
  })
})
