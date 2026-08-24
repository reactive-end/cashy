/**
 * Safe error handling utilities.
 * Extract legible messages from caught values without using
 * any or unknown anywhere in the project.
 */

/**
 * Extrae un mensaje legible de cualquier valor capturado en un catch.
 * El generico evita anotar la variable implicita del catch manteniendo
 * la inferencia segura mediante estrechamiento con instanceof.
 * @param error Valor recibido en el catch
 * @returns Mensaje descriptivo listo para mostrar al usuario
 */
export function getErrorMessage<T>(error: T): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
