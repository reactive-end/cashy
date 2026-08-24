/**
 * Pruebas unitarias del bus de eventos entre instancias.
 */

import { emit, subscribe } from '@src/lib/events'

describe('bus de eventos', () => {
  it('notifica a todos los oyentes suscritos', () => {
    const oyenteA = jest.fn()
    const oyenteB = jest.fn()
    const desuscribirA = subscribe('expenses-changed', oyenteA)
    const desuscribirB = subscribe('expenses-changed', oyenteB)

    emit('expenses-changed')

    expect(oyenteA).toHaveBeenCalledTimes(1)
    expect(oyenteB).toHaveBeenCalledTimes(1)

    desuscribirA()
    desuscribirB()
  })

  it('deja de notificar tras la desuscripcion', () => {
    const oyente = jest.fn()
    const desuscribir = subscribe('expenses-changed', oyente)

    desuscribir()
    emit('expenses-changed')

    expect(oyente).not.toHaveBeenCalled()
  })

  it('un oyente que lanza no bloquea a los demas', () => {
    const oyenteSano = jest.fn()
    const desuscribirRoto = subscribe('expenses-changed', () => {
      throw new Error('oyente roto')
    })

    expect(() => emit('expenses-changed')).not.toThrow()
    expect(oyenteSano).not.toHaveBeenCalled()

    const desuscribirSano = subscribe('expenses-changed', oyenteSano)
    emit('expenses-changed')

    expect(oyenteSano).toHaveBeenCalledTimes(1)

    desuscribirRoto()
    desuscribirSano()
  })
})
