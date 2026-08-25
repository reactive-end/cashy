/**
 * Hook useAppUpdate: detecta releases nuevos en GitHub y expone el
 * estado del dialogo "Nueva version" para el updater binario.
 * Solo activo en builds distribuidos por GitHub (canal github);
 * en Expo Go y builds de Play queda inerte por diseno.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Updates from 'expo-updates'
import { useCallback, useEffect, useState } from 'react'

import {
  consultarUltimoRelease,
  descargarApk,
  hayActualizacionDisponible,
  instalarApk
} from '@src/services/appUpdate'
import type { UltimoRelease } from '@src/services/appUpdate'

/** Clave de storage con el release descartado por el usuario */
const CLAVE_DESCARTADA = 'cashy.update-descartada'

/** Estado y acciones del updater binario expuestos por el hook */
export interface UseAppUpdateResult {
  /** Release nuevo pendiente de decision, o null si no hay aviso */
  disponible: UltimoRelease | null
  /** Progreso de descarga en curso (0-1) */
  progreso: number
  /** true mientras se descarga el APK */
  descargando: boolean
  /** Descarga el APK y lanza el instalador del sistema */
  confirmar: () => Promise<void>
  /** Cierra el aviso y no vuelve a ofrecer esta version */
  descartar: () => Promise<void>
}

/**
 * Observa GitHub Releases y gestiona el ciclo de vida del aviso de
 * nueva version binaria. El chequeo corre una vez por sesion.
 * @returns Estado del updater con acciones de confirmar y descartar
 */
export function useAppUpdate(): UseAppUpdateResult {
  const [disponible, setDisponible] = useState<UltimoRelease | null>(null)
  const [progreso, setProgreso] = useState(0)
  const [descargando, setDescargando] = useState(false)

  useEffect(() => {
    if (!Updates.isEnabled || Updates.channel !== 'github') return

    let activo = true

    async function verificar(): Promise<void> {
      const release = await consultarUltimoRelease()

      if (!release || !activo || !hayActualizacionDisponible(release)) return

      const descartada = await AsyncStorage.getItem(CLAVE_DESCARTADA)

      if (descartada === release.version) return

      setDisponible(release)
    }

    void verificar()

    return () => {
      activo = false
    }
  }, [])

  const confirmar = useCallback(async () => {
    if (!disponible) return

    setDescargando(true)
    setProgreso(0)

    try {
      const archivo = await descargarApk(disponible.urlApk, setProgreso)
      await instalarApk(archivo)
    } catch {
      // Fallo silencioso: el aviso queda disponible para reintentar.
    } finally {
      setDescargando(false)
    }
  }, [disponible])

  const descartar = useCallback(async () => {
    if (disponible) await AsyncStorage.setItem(CLAVE_DESCARTADA, disponible.version)
    setDisponible(null)
  }, [disponible])

  return { disponible, progreso, descargando, confirmar, descartar }
}
