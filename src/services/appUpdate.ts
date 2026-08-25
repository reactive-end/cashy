/**
 * GitHub Releases based binary updater for sideloaded APK builds.
 * Consults the latest release, compares versions, downloads the
 * APK asset and hands it to the Android package installer.
 * Every network step fails silently to keep the updater unobtrusive.
 */

import Constants from 'expo-constants'
import { Directory, File, Paths } from 'expo-file-system'
import * as IntentLauncher from 'expo-intent-launcher'

import { esVersionMasNueva } from '@src/lib/versiones'

/** Ruta del repositorio donde se publican los releases */
const REPOSITORIO = 'reactive-end/cashy'

/** Carpeta relativa al cache donde se descarga el APK */
const CARPETA_DESCARGA = 'actualizaciones'

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
export interface UltimoRelease {
  /** Version normalizada sin prefijo "v" */
  version: string
  /** URL de descarga directa del asset APK */
  urlApk: string
  /** Notas de la version publicadas en el release */
  notas: string
}

/**
 * Valida que un objeto suelto responde a la forma de un release
 * de GitHub con al menos un asset APK descargable.
 * @param value Objeto sin tipo leido desde la API
 * @returns Release validado o null cuando la forma no es utilizable
 */
function validarRelease(value: object): UltimoRelease | null {
  const candidato = value as GithubRelease

  if (typeof candidato.tag_name !== 'string' || candidato.tag_name.length === 0) return null

  const apk = candidato.assets?.find(
    (asset) =>
      typeof asset.browser_download_url === 'string' &&
      typeof asset.name === 'string' &&
      asset.name.toLowerCase().endsWith('.apk')
  )

  if (!apk || typeof apk.browser_download_url !== 'string') return null

  return {
    version: candidato.tag_name.replace(/^v/i, ''),
    urlApk: apk.browser_download_url,
    notas: typeof candidato.body === 'string' ? candidato.body : ''
  }
}

/**
 * Version instalada de la aplicacion segun la configuracion expo.
 * @returns Version actual o cadena vacia si no esta disponible
 */
export function versionInstalada(): string {
  return Constants.expoConfig?.version ?? ''
}

/**
 * Consulta el ultimo release publicado en GitHub y lo valida.
 * @returns Datos del release con APK, o null si no hay release
 * utilizable o la consulta falla
 */
export async function consultarUltimoRelease(): Promise<UltimoRelease | null> {
  try {
    const respuesta = await fetch(`https://api.github.com/repos/${REPOSITORIO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' }
    })

    if (!respuesta.ok) return null

    const cuerpo: object = await respuesta.json()

    return validarRelease(cuerpo)
  } catch {
    return null
  }
}

/**
 * Determina si existe una actualizacion binaria disponible.
 * @param release Ultimo release consultado
 * @returns true cuando la version del release supera a la instalada
 */
export function hayActualizacionDisponible(release: UltimoRelease): boolean {
  const actual = versionInstalada()

  if (!actual) return false

  return esVersionMasNueva(actual, release.version)
}

/**
 * Descarga el APK del release en el cache de la aplicacion.
 * @param urlApk URL de descarga directa del asset
 * @param alProgresar Callback opcional con progreso 0-1
 * @returns Archivo descargado listo para instalarse
 */
export async function descargarApk(
  urlApk: string,
  alProgresar?: (progreso: number) => void
): Promise<File> {
  const carpeta = new Directory(Paths.cache, CARPETA_DESCARGA)
  carpeta.create({ idempotent: true, intermediates: true, overwrite: true })

  const tarea = File.createDownloadTask(urlApk, carpeta, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (alProgresar && totalBytes > 0) alProgresar(bytesWritten / totalBytes)
    }
  })

  const archivo = await tarea.downloadAsync()

  if (!archivo) throw new Error('Descarga cancelada')

  return archivo
}

/**
 * Lanza el instalador del sistema con el APK descargado.
 * Android mostrara su dialogo de confirmacion de instalacion.
 * @param archivo APK descargado en el cache
 */
export async function instalarApk(archivo: File): Promise<void> {
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: archivo.contentUri,
    type: 'application/vnd.android.package-archive',
    flags: 1
  })
}
