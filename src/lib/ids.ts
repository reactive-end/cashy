/**
 * Generador de identificadores unicos suficientes para registros locales.
 * Evita depender de crypto.randomUUID en entornos donde no este disponible.
 * @returns Cadena combinando marca temporal y aleatoriedad en base 36
 */
export function generateId(): string {
  const tiempo = Date.now().toString(36)
  const azar = Math.random().toString(36).slice(2, 10)
  return `${tiempo}-${azar}`
}
