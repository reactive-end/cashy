/**
 * Hook useSettings: preferencias del usuario compartidas entre pantallas.
 * Usa un cache a nivel de modulo con suscriptores, de modo que cambiar
 * la moneda base en Ajustes se refleja al instante en Inicio y Gastos
 * sin volver a consultar la base de datos ni la red.
 */

import { useCallback, useEffect, useState } from 'react'

import { loadSettings, saveSettings } from '@src/db/settings'
import { cancelAllReminders, syncBcvNotice, syncReminders } from '@src/lib/notifications'
import { getExchangeRates } from '@src/services/rates'
import type { AppSettings, BaseCurrency, ThemePreference } from '@src/types/domain'

/** Cache compartido: una sola fuente de verdad en toda la app */
let sharedCache: AppSettings | null = null

/** Carga inicial en vuelo para evitar lecturas duplicadas */
let inFlightLoad: Promise<AppSettings> | null = null

/** Suscriptores notificados en cada cambio */
const listeners = new Set<(settings: AppSettings) => void>()

/** Generacion para invalidar promesas en vuelo tras reset en pruebas */
let resetGeneration = 0

/**
 * Notifica a todos los consumidores el estado vigente.
 */
function notify(): void {
  if (!sharedCache) return
  for (const listener of listeners) {
    listener(sharedCache)
  }
}

/**
 * Lee los ajustes una sola vez por sesion; las demas llamadas
 * consumen el cache sin tocar almacenamiento ni red.
 */
async function ensureLoaded(): Promise<AppSettings> {
  if (sharedCache) return sharedCache

  const gen = resetGeneration
  if (!inFlightLoad) {
    inFlightLoad = loadSettings()
      .then((loaded) => {
        if (gen === resetGeneration) {
          sharedCache = loaded
          notify()
        }
        return loaded
      })
      .catch(() => {
        if (gen === resetGeneration) {
          inFlightLoad = null
        }
        throw new Error('No se pudieron leer los ajustes')
      })
  }

  return inFlightLoad
}

/**
 * Persiste y propaga inmediatamente un conjunto completo de ajustes.
 * @param settings Estado nuevo ya validado
 */
function persist(settings: AppSettings): void {
  sharedCache = settings
  notify()
  void saveSettings(settings)
}

/** Estado y acciones expuestos por el hook de ajustes */
export interface UseSettingsResult {
  /** Ajustes actuales; null durante la primera lectura */
  settings: AppSettings | null
  /** Cambia la moneda base y persiste de inmediato */
  changeBaseCurrency: (currency: BaseCurrency) => Promise<void>
  /** Cambia hora y minuto de recordatorios, persiste y reagenda */
  changeReminderTime: (hour: number, minute: number) => Promise<void>
  /** Cambia hora y minuto del aviso BCV, persiste y reagenda */
  changeBcvTime: (hour: number, minute: number) => Promise<void>
  /** Activa o apaga los recordatorios y aplica el cambio al instante */
  setRemindersEnabled: (enabled: boolean) => Promise<void>
  /** Activa o apaga el aviso BCV y aplica el cambio al instante */
  setBcvEnabled: (enabled: boolean) => Promise<void>
  /** Activa o desactiva la proteccion por bloqueo biometrico */
  setBiometricsEnabled: (enabled: boolean) => Promise<void>
  /** Cambia la preferencia de tema (sistema, claro u oscuro) */
  changeThemePreference: (theme: ThemePreference) => Promise<void>
}

/**
 * Administra las preferencias del usuario con escritura inmediata
 * y propagacion instantanea a todos los consumidores montados.
 * @returns Estado reactivo compartido con acciones de modificacion
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings | null>(sharedCache)

  useEffect(() => {
    const listener = (updated: AppSettings) => setSettings(updated)
    listeners.add(listener)

    void ensureLoaded().catch(() => {
      // Ante fallo de lectura los ajustes quedan en null y la UI usa defaults.
    })

    return () => {
      listeners.delete(listener)
    }
  }, [])

  const changeBaseCurrency = useCallback(async (currency: BaseCurrency) => {
    const current = await ensureLoaded()
    persist({ ...current, baseCurrency: currency })
  }, [])

  const changeReminderTime = useCallback(async (hour: number, minute: number) => {
    const current = await ensureLoaded()
    const updated: AppSettings = {
      ...current,
      reminderHour: Math.min(23, Math.max(0, hour)),
      reminderMinute: Math.min(59, Math.max(0, minute))
    }
    persist(updated)

    await syncReminders(updated)
  }, [])

  const changeBcvTime = useCallback(async (hour: number, minute: number) => {
    const current = await ensureLoaded()
    const updated: AppSettings = {
      ...current,
      bcvHour: Math.min(23, Math.max(0, hour)),
      bcvMinute: Math.min(59, Math.max(0, minute))
    }
    persist(updated)

    const rates = await getExchangeRates().catch(() => undefined)
    await syncBcvNotice(updated, rates)
  }, [])

  const setRemindersEnabled = useCallback(async (enabled: boolean) => {
    const current = await ensureLoaded()
    const updated: AppSettings = { ...current, remindersEnabled: enabled }
    persist(updated)

    if (enabled) {
      await syncReminders(updated)
      return
    }

    await cancelAllReminders()
  }, [])

  const setBcvEnabled = useCallback(async (enabled: boolean) => {
    const current = await ensureLoaded()
    const updated: AppSettings = { ...current, bcvEnabled: enabled }
    persist(updated)

    if (!enabled) {
      await syncBcvNotice(updated)
      return
    }

    const rates = await getExchangeRates().catch(() => undefined)
    await syncBcvNotice(updated, rates)
  }, [])

  const setBiometricsEnabled = useCallback(async (enabled: boolean) => {
    const current = await ensureLoaded()
    const updated: AppSettings = { ...current, biometricsEnabled: enabled }
    persist(updated)
  }, [])

  const changeThemePreference = useCallback(async (theme: ThemePreference) => {
    const current = await ensureLoaded()
    const updated: AppSettings = { ...current, themePreference: theme }
    persist(updated)
  }, [])

  return {
    settings,
    changeBaseCurrency,
    changeReminderTime,
    changeBcvTime,
    setRemindersEnabled,
    setBcvEnabled,
    setBiometricsEnabled,
    changeThemePreference
  }
}

/**
 * Restablece el cache compartido de ajustes.
 * Exclusivo para pruebas: garantiza estado limpio entre casos.
 */
export function __resetCacheForTests(): void {
  resetGeneration++
  sharedCache = null
  inFlightLoad = null
  listeners.clear()
}
