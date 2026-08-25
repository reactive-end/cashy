/**
 * Semantic version comparison helpers for the in-app updater.
 * Pure functions with no dependencies; tolerant to the "v" prefix
 * used in Git tags and to missing patch segments.
 */

/**
 * Normaliza una cadena de version eliminando el prefijo "v" y
 * espacios; devuelve los segmentos numericos encontrados.
 * @param version Cadena tipo "1.2.3" o "v1.2"
 * @returns Segmentos numericos de la version
 */
function segmentos(version: string): number[] {
  const limpia = version.trim().replace(/^v/i, '')

  return limpia.split('.').map((parte) => {
    const numero = Number.parseInt(parte, 10)
    return Number.isFinite(numero) ? numero : 0
  })
}

/**
 * Compara dos versiones semanticas.
 * @param actual Version instalada, por ejemplo "1.0.1"
 * @param candidata Version candidata, por ejemplo "v1.2.0"
 * @returns -1 si candidata es mayor, 1 si actual es mayor, 0 si equivalentes
 */
export function compararVersiones(actual: string, candidata: string): number {
  const partesActual = segmentos(actual)
  const partesCandidata = segmentos(candidata)
  const largo = Math.max(partesActual.length, partesCandidata.length)

  for (let indice = 0; indice < largo; indice += 1) {
    const a = partesActual[indice] ?? 0
    const b = partesCandidata[indice] ?? 0

    if (a !== b) return a < b ? -1 : 1
  }

  return 0
}

/**
 * Indica si la version candidata es mas nueva que la actual.
 * @param actual Version instalada
 * @param candidata Version candidata con o sin prefijo "v"
 * @returns true solo cuando candidata estrictamente mayor
 */
export function esVersionMasNueva(actual: string, candidata: string): boolean {
  return compararVersiones(actual, candidata) < 0
}
