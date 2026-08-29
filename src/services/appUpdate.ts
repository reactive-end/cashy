/**
 * GitHub Releases based binary updater for sideloaded APK builds.
 * Consults the latest release, compares versions, downloads the
 * APK asset and hands it to the Android package installer.
 * Every network step fails silently to keep the updater unobtrusive.
 */

import Constants from 'expo-constants'
import * as Crypto from 'expo-crypto'
import { Directory, File, Paths } from 'expo-file-system'
import * as IntentLauncher from 'expo-intent-launcher'

import { isNewerVersion } from '@src/lib/versions'

/** Ruta del repositorio donde se publican los releases */
const REPOSITORY = 'reactive-end/cashy'

/** Carpeta relativa al cache donde se descarga el APK */
const DOWNLOAD_FOLDER = 'actualizaciones'

/** Forma cruda de un asset adjunto a un release de GitHub */
interface GithubAsset {
  name?: string
  browser_download_url?: string
}

/** Forma cruda de la respuesta del endpoint releases/latest */
interface GithubRelease {
  tag_name?: string
  body?: string
  assets?: GithubAsset[]
}

/** Informacion tipada del ultimo release utilizable */
export interface LatestRelease {
  /** Version normalizada sin prefijo "v" */
  version: string
  /** URL de descarga directa del asset APK */
  apkUrl: string
  /** Notas de la version publicadas en el release */
  notes: string
  /** Hash SHA-256 opcional para verificar integridad */
  sha256?: string
}

/**
 * Valida que un objeto suelto responde a la forma de un release
 * de GitHub con al menos un asset APK descargable.
 * @param value Objeto sin tipo leido desde la API
 * @returns Release validado o null cuando la forma no es utilizable
 */
function validateRelease(value: object): LatestRelease | null {
  const candidate = value as GithubRelease

  if (typeof candidate.tag_name !== 'string' || candidate.tag_name.length === 0) return null

  const apk = candidate.assets?.find(
    (asset) =>
      typeof asset.browser_download_url === 'string' &&
      typeof asset.name === 'string' &&
      asset.name.toLowerCase().endsWith('.apk')
  )

  if (!apk || typeof apk.browser_download_url !== 'string') return null

  const shaMatch = candidate.body?.match(/(?:SHA256|sha256):\s*([a-fA-F0-9]{64})/)
  const sha256 = shaMatch ? shaMatch[1].toLowerCase() : undefined

  return {
    version: candidate.tag_name.replace(/^v/i, ''),
    apkUrl: apk.browser_download_url,
    notes: typeof candidate.body === 'string' ? candidate.body : '',
    sha256
  }
}

/**
 * Version instalada de la aplicacion segun la configuracion expo.
 * @returns Version actual o cadena vacia si no esta disponible
 */
export function installedVersion(): string {
  return Constants.expoConfig?.version ?? ''
}

/**
 * Consulta el ultimo release publicado en GitHub y lo valida.
 * @returns Datos del release con APK, o null si no hay release
 * utilizable o la consulta falla
 */
export async function fetchLatestRelease(): Promise<LatestRelease | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' }
    })

    if (!response.ok) return null

    const body: object = await response.json()

    return validateRelease(body)
  } catch {
    return null
  }
}

/**
 * Determina si existe una actualizacion binaria disponible.
 * @param release Ultimo release consultado
 * @returns true cuando la version del release supera a la instalada
 */
export function isUpdateAvailable(release: LatestRelease): boolean {
  const current = installedVersion()

  if (!current) return false

  return isNewerVersion(current, release.version)
}

/**
 * Descarga el APK del release en el cache de la aplicacion
 * y verifica su integridad criptografica si se provee el hash esperado.
 * @param apkUrl URL de descarga directa del asset
 * @param onProgress Callback opcional con progreso 0-1
 * @param expectedSha256 Hash SHA-256 opcional para verificar integridad
 * @returns Archivo descargado listo para instalarse
 */
export async function downloadApk(
  apkUrl: string,
  onProgress?: (progress: number) => void,
  expectedSha256?: string
): Promise<File> {
  const folder = new Directory(Paths.cache, DOWNLOAD_FOLDER)
  folder.create({ idempotent: true, intermediates: true, overwrite: true })

  const task = File.createDownloadTask(apkUrl, folder, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (onProgress && totalBytes > 0) onProgress(bytesWritten / totalBytes)
    }
  })

  const file = await task.downloadAsync()

  if (!file) throw new Error('Download cancelled')

  if (expectedSha256) {
    const buffer = await file.arrayBuffer()
    const digestBuffer = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, buffer)
    const hashHex = Array.from(new Uint8Array(digestBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toLowerCase()

    if (hashHex !== expectedSha256.toLowerCase()) {
      try {
        file.delete()
      } catch {
        // Ignora fallo al limpiar archivo corrupto
      }
      throw new Error('Integrity check failed: APK SHA-256 does not match release checksum')
    }
  }

  return file
}

/**
 * Lanza el instalador del sistema con el APK descargado.
 * Android mostrara su dialogo de confirmacion de instalacion.
 * @param archivo APK descargado en el cache
 */
export async function installApk(file: File): Promise<void> {
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: file.contentUri,
    type: 'application/vnd.android.package-archive',
    flags: 1
  })
}
