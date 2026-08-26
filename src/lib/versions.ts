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
function parseSegments(version: string): number[] {
  const cleaned = version.trim().replace(/^v/i, '')

  return cleaned.split('.').map((part) => {
    const number = Number.parseInt(part, 10)
    return Number.isFinite(number) ? number : 0
  })
}

/**
 * Compara dos versiones semanticas.
 * @param actual Version instalada, por ejemplo "1.0.1"
 * @param candidata Version candidata, por ejemplo "v1.2.0"
 * @returns -1 si candidata es mayor, 1 si actual es mayor, 0 si equivalentes
 */
export function compareVersions(current: string, candidate: string): number {
  const currentParts = parseSegments(current)
  const candidateParts = parseSegments(candidate)
  const maxSegments = Math.max(currentParts.length, candidateParts.length)

  for (let index = 0; index < maxSegments; index += 1) {
    const a = currentParts[index] ?? 0
    const b = candidateParts[index] ?? 0

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
export function isNewerVersion(current: string, candidate: string): boolean {
  return compareVersions(current, candidate) < 0
}
