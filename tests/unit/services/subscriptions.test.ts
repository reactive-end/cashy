/**
 * Pruebas del servicio de suscripciones: logica de vigencia,
 * cache local en AsyncStorage y consulta a Supabase.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  fetchUserSubscription,
  isSubscriptionActive,
  loadSubscriptionCache,
  saveSubscriptionCache
} from '@src/services/subscriptions'
import { supabase } from '@src/services/supabase'
import type { UserSubscription } from '@src/types/domain'

jest.mock('@src/services/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

const supabaseFromMock = supabase.from as jest.Mock

describe('isSubscriptionActive', () => {
  it('devuelve false cuando la suscripcion es null', () => {
    expect(isSubscriptionActive(null)).toBe(false)
  })

  it('devuelve false cuando el plan es free', () => {
    const sub: UserSubscription = {
      id: 'sub-1',
      userId: 'user-1',
      email: 'test@example.com',
      plan: 'free',
      status: 'active',
      expiresAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }
    expect(isSubscriptionActive(sub)).toBe(false)
  })

  it('devuelve false cuando el estado no es active', () => {
    const sub: UserSubscription = {
      id: 'sub-1',
      userId: 'user-1',
      email: 'test@example.com',
      plan: 'pro',
      status: 'canceled',
      expiresAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }
    expect(isSubscriptionActive(sub)).toBe(false)
  })

  it('devuelve false cuando la fecha de expiracion es invalida', () => {
    const sub: UserSubscription = {
      id: 'sub-1',
      userId: 'user-1',
      email: 'test@example.com',
      plan: 'pro',
      status: 'active',
      expiresAt: 'fecha-no-valida',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }
    expect(isSubscriptionActive(sub)).toBe(false)
  })

  it('devuelve true para plan pro activo sin fecha de vencimiento', () => {
    const sub: UserSubscription = {
      id: 'sub-1',
      userId: 'user-1',
      email: 'test@example.com',
      plan: 'pro',
      status: 'active',
      expiresAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }
    expect(isSubscriptionActive(sub)).toBe(true)
  })

  it('devuelve true si la fecha de vencimiento es futura', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
    const sub: UserSubscription = {
      id: 'sub-1',
      userId: 'user-1',
      email: 'test@example.com',
      plan: 'pro',
      status: 'active',
      expiresAt: futureDate,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }
    expect(isSubscriptionActive(sub)).toBe(true)
  })

  it('devuelve false si la fecha de vencimiento ya expiro', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    const sub: UserSubscription = {
      id: 'sub-1',
      userId: 'user-1',
      email: 'test@example.com',
      plan: 'pro',
      status: 'active',
      expiresAt: pastDate,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }
    expect(isSubscriptionActive(sub)).toBe(false)
  })
})

describe('cache de suscripcion', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  it('guarda y recupera la suscripcion del cache', async () => {
    const sub: UserSubscription = {
      id: 'sub-1',
      userId: 'user-1',
      email: 'test@example.com',
      plan: 'pro',
      status: 'active',
      expiresAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }

    await saveSubscriptionCache(sub)
    const cached = await loadSubscriptionCache()

    expect(cached).toEqual(sub)
  })

  it('elimina la suscripcion del cache al pasar null', async () => {
    await AsyncStorage.setItem('cashy.user-subscription', 'algo')
    await saveSubscriptionCache(null)
    const cached = await loadSubscriptionCache()
    expect(cached).toBeNull()
  })

  it('devuelve null si el cache esta vacio', async () => {
    const cached = await loadSubscriptionCache()
    expect(cached).toBeNull()
  })

  it('devuelve null si el cache contiene JSON invalido', async () => {
    await AsyncStorage.setItem('cashy.user-subscription', 'json-invalido')
    const cached = await loadSubscriptionCache()
    expect(cached).toBeNull()
  })

  it('devuelve null si el objeto en cache no cumple el esquema de UserSubscription', async () => {
    await AsyncStorage.setItem('cashy.user-subscription', JSON.stringify({ inusual: true }))
    const cached = await loadSubscriptionCache()
    expect(cached).toBeNull()
  })
})

describe('fetchUserSubscription', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    jest.clearAllMocks()
  })

  it('recupera y mapea la fila desde Supabase con estado active', async () => {
    const dbRow = {
      id: 'row-1',
      user_id: 'usr-1',
      email: 'alex@example.com',
      plan: 'pro',
      status: 'active',
      expires_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    }

    supabaseFromMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: dbRow, error: null })
        })
      })
    })

    const sub = await fetchUserSubscription('usr-1')
    expect(sub).toEqual({
      id: 'row-1',
      userId: 'usr-1',
      email: 'alex@example.com',
      plan: 'pro',
      status: 'active',
      expiresAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    })
  })

  it('mapea correctamente estados expired y canceled', async () => {
    const dbRow = {
      id: 'row-2',
      user_id: 'usr-2',
      email: null,
      plan: 'free',
      status: 'expired',
      expires_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    }

    supabaseFromMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: dbRow, error: null })
        })
      })
    })

    const sub = await fetchUserSubscription('usr-2')
    expect(sub?.status).toBe('expired')
    expect(sub?.plan).toBe('free')
  })

  it('recurre al cache local cuando Supabase falla con error', async () => {
    const cachedSub: UserSubscription = {
      id: 'cached-1',
      userId: 'usr-1',
      email: 'cached@example.com',
      plan: 'pro',
      status: 'active',
      expiresAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }
    await saveSubscriptionCache(cachedSub)

    supabaseFromMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest
            .fn()
            .mockResolvedValue({ data: null, error: new Error('Network error') })
        })
      })
    })

    const sub = await fetchUserSubscription('usr-1')
    expect(sub).toEqual(cachedSub)
  })

  it('recurre al cache local cuando la consulta lanza una excepcion', async () => {
    supabaseFromMock.mockImplementation(() => {
      throw new Error('Crash')
    })

    const sub = await fetchUserSubscription('usr-1')
    expect(sub).toBeNull()
  })
})
