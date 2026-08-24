/**
 * Hook useSettings: preferencias del usuario compartidas entre pantallas.
 * Usa un cache a nivel de modulo con suscriptores, de modo que cambiar
 * la moneda base en Ajustes se refleja al instante en Inicio y Gastos
 * sin volver a consultar la base de datos ni la red.
 */

import { useCallback, useEffect, useState } from 'react'

import { loadSettings, saveSettings } from '@src/db/settings'
import type { AppSettings, BaseCurrency } from '@src/types/domain'

/** Cache compartido: una sola fuente de verdad en toda la app */
let cacheCompartido: AppSettings | null = null

/** Carga inicial en vuelo para evitar lecturas duplicadas */
let cargaEnVuelo: Promise<AppSettings> | null = null

/** Suscriptores notificados en cada cambio */
const oyentes = new Set<(ajustes: AppSettings) => void>()

/**
 * Notifica a todos los consumidores el estado vigente.
 */
function notificar(): void {
  if (!cacheCompartido) return
  for (const oyente of oyentes) {
    oyente(cacheCompartido)
  }
}

/**
 * Lee los ajustes una sola vez por sesion; las demas llamadas
 * consumen el cache sin tocar almacenamiento ni red.
 */
async function asegurarCargados(): Promise<AppSettings> {
  if (cacheCompartido) return cacheCompartido

  if (!cargaEnVuelo) {
    cargaEnVuelo = loadSettings()
      .then((leidos) => {
        cacheCompartido = leidos
        notificar()
        return leidos
      })
      .catch(() => {
        cargaEnVuelo = null
        throw new Error('No se pudieron leer los ajustes')
      })
  }

  return cargaEnVuelo
}

/**
 * Persiste y propaga inmediatamente un conjunto completo de ajustes.
 * @param ajustes Estado nuevo ya validado
 */
function persistir(ajustes: AppSettings): void {
  cacheCompartido = ajustes
  notificar()
  void saveSettings(ajustes)
}

/** Estado y acciones expuestos por el hook de ajustes */
export interface UseSettingsResult {
  /** Ajustes actuales; null durante la primera lectura */
  settings: AppSettings | null
  /** Cambia la moneda base y persiste de inmediato */
  changeBaseCurrency: (currency: BaseCurrency) => Promise<void>
  /** Cambia la hora de recordatorio (0-23) y persiste */
  changeReminderHour: (hour: number) => Promise<void>
}

/**
 * Administra las preferencias del usuario con escritura inmediata
 * y propagacion instantanea a todos los consumidores montados.
 * @returns Estado reactivo compartido con acciones de modificacion
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings | null>(cacheCompartido)

  useEffect(() => {
    const oyente = (nuevos: AppSettings) => setSettings(nuevos)
    oyentes.add(oyente)

    void asegurarCargados().catch(() => {
      // Ante fallo de lectura los ajustes quedan en null y la UI usa defaults.
    })

    return () => {
      oyentes.delete(oyente)
    }
  }, [])

  const changeBaseCurrency = useCallback(async (moneda: BaseCurrency) => {
    const actuales = await asegurarCargados()
    persistir({ ...actuales, baseCurrency: moneda })
  }, [])

  const changeReminderHour = useCallback(async (hora: number) => {
    const actuales = await asegurarCargados()
    persistir({ ...actuales, reminderHour: Math.min(23, Math.max(0, hora)) })
  }, [])

  return { settings, changeBaseCurrency, changeReminderHour }
}

/**
 * Restablece el cache compartido de ajustes.
 * Exclusivo para pruebas: garantiza estado limpio entre casos.
 */
export function __reiniciarCacheParaPruebas(): void {
  cacheCompartido = null
  cargaEnVuelo = null
  oyentes.clear()
}
