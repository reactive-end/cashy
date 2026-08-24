/**
 * Espera activa con temporizadores reales para pruebas de integracion.
 * Evita el uso de waitFor (y su act interno) en flujos asincronos,
 * previniendo solapamientos de act entre pruebas.
 * @param ms Milisegundos a esperar; por defecto 50
 */
export function wait(ms = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
