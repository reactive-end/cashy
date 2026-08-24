/**
 * Utilidades de contraste WCAG 2.1 para las pruebas de accesibilidad.
 * Calculan luminancia relativa y ratio de contraste sobre la paleta del tema.
 */

/** Color hexadecimal en formato #RRGGBB */
export type Hex = string

/**
 * Convierte un color hex a sus componentes RGB normalizados.
 * @param hex Cadena #RRGGBB
 * @returns Tupla [r, g, b] en escala 0-1
 */
export function hexToRgb(hex: Hex): [number, number, number] {
  const limpio = hex.replace('#', '')
  const r = parseInt(limpio.slice(0, 2), 16) / 255
  const g = parseInt(limpio.slice(2, 4), 16) / 255
  const b = parseInt(limpio.slice(4, 6), 16) / 255
  return [r, g, b]
}

/**
 * Canal linealizado segun la formula WCAG.
 * @param canal Valor 0-1 del canal
 * @returns Valor lineal 0-1
 */
function linearizar(canal: number): number {
  return canal <= 0.03928 ? canal / 12.92 : Math.pow((canal + 0.055) / 1.055, 2.4)
}

/**
 * Luminancia relativa WCAG de un color.
 * @param hex Color a medir
 * @returns Luminancia entre 0 y 1
 */
export function luminancia(hex: Hex): number {
  const [r, g, b] = hexToRgb(hex).map(linearizar)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Ratio de contraste entre dos colores segun WCAG.
 * @param a Primer color
 * @param b Segundo color
 * @returns Ratio entre 1 y 21
 */
export function contrastRatio(a: Hex, b: Hex): number {
  const la = luminancia(a)
  const lb = luminancia(b)
  const clara = Math.max(la, lb)
  const oscura = Math.min(la, lb)
  return (clara + 0.05) / (oscura + 0.05)
}

/** Minimo AA para texto normal (menor a 18pt) */
export const AA_TEXTO_NORMAL = 4.5
