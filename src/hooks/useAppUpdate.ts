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
  downloadApk,
  fetchLatestRelease,
  installApk,
  isUpdateAvailable
} from '@src/services/appUpdate'
import type { LatestRelease } from '@src/services/appUpdate'

/** Clave de storage con el release descartado por el usuario */
const DISMISSED_STORAGE_KEY = 'cashy.update-descartada'

/** Estado y acciones del updater binario expuestos por el hook */
export interface UseAppUpdateResult {
  /** Release nuevo pendiente de decision, o null si no hay aviso */
  available: LatestRelease | null
  /** Progreso de descarga en curso (0-1) */
  progress: number
  /** true mientras se descarga el APK */
  downloading: boolean
  /** Descarga el APK y lanza el instalador del sistema */
  confirm: () => Promise<void>
  /** Cierra el aviso y no vuelve a ofrecer esta version */
  dismiss: () => Promise<void>
}

/**
 * Observa GitHub Releases y gestiona el ciclo de vida del aviso de
 * nueva version binaria. El chequeo corre una vez por sesion.
 * @returns Estado del updater con acciones de confirmar y descartar
 */
export function useAppUpdate(): UseAppUpdateResult {
  const [available, setAvailable] = useState<LatestRelease | null>(null)
  const [progress, setProgress] = useState(0)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!Updates.isEnabled || Updates.channel !== 'github') return

    let active = true

    async function checkForUpdate(): Promise<void> {
      const release = await fetchLatestRelease()

      if (!release || !active || !isUpdateAvailable(release)) return

      const dismissedVersion = await AsyncStorage.getItem(DISMISSED_STORAGE_KEY)

      if (dismissedVersion === release.version) return

      setAvailable(release)
    }

    void checkForUpdate()

    return () => {
      active = false
    }
  }, [])

  const confirm = useCallback(async () => {
    if (!available) return

    setDownloading(true)
    setProgress(0)

    try {
      const file = await downloadApk(available.apkUrl, setProgress)
      await installApk(file)
    } catch {
      // Fallo silencioso: el aviso queda disponible para reintentar.
    } finally {
      setDownloading(false)
    }
  }, [available])

  const dismiss = useCallback(async () => {
    if (available) await AsyncStorage.setItem(DISMISSED_STORAGE_KEY, available.version)
    setAvailable(null)
  }, [available])

  return { available, progress, downloading, confirm, dismiss }
}
