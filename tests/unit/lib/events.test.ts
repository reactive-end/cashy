/**
 * Pruebas unitarias del bus de eventos entre instancias.
 */

import { emit, subscribe } from '@src/lib/events'

describe('bus de eventos', () => {
  it('notifica a todos los oyentes suscritos', () => {
    const listenerA = jest.fn()
    const listenerB = jest.fn()
    const unsubscribeA = subscribe('expenses-changed', listenerA)
    const unsubscribeB = subscribe('expenses-changed', listenerB)

    emit('expenses-changed')

    expect(listenerA).toHaveBeenCalledTimes(1)
    expect(listenerB).toHaveBeenCalledTimes(1)

    unsubscribeA()
    unsubscribeB()
  })

  it('deja de notificar tras la desuscripcion', () => {
    const listener = jest.fn()
    const unsubscribe = subscribe('expenses-changed', listener)

    unsubscribe()
    emit('expenses-changed')

    expect(listener).not.toHaveBeenCalled()
  })

  it('un oyente que lanza no bloquea a los demas', () => {
    const healthyListener = jest.fn()
    const unsubscribeBroken = subscribe('expenses-changed', () => {
      throw new Error('broken listener')
    })

    expect(() => emit('expenses-changed')).not.toThrow()
    expect(healthyListener).not.toHaveBeenCalled()

    const unsubscribeHealthy = subscribe('expenses-changed', healthyListener)
    emit('expenses-changed')

    expect(healthyListener).toHaveBeenCalledTimes(1)

    unsubscribeBroken()
    unsubscribeHealthy()
  })
})
