/**
 * Pruebas de contraste de color segun WCAG 2.1 AA.
 * Validan las combinaciones texto/fondo usadas por el sistema
 * de diseno para garantizar legibilidad sin depender del render.
 */

import { COLORS } from '@src/constants/theme'

import { AA_NORMAL_TEXT_RATIO, contrastRatio } from '../helpers/contrast'

/** Umbral exigido al proyecto para todo texto */
const UMBRAL = AA_NORMAL_TEXT_RATIO

describe('contraste WCAG AA de la paleta', () => {
  it.each([
    ['texto principal sobre papel', COLORS.ink, COLORS.paper],
    ['texto principal sobre tarjeta', COLORS.ink, COLORS.card],
    ['texto secundario sobre tarjeta', COLORS.muted, COLORS.card],
    ['texto secundario sobre papel', COLORS.muted, COLORS.paper],
    ['texto auxiliar sobre tarjeta', COLORS.faint, COLORS.card],
    ['texto auxiliar sobre papel', COLORS.faint, COLORS.paper],
    ['etiqueta accent sobre tarjeta', COLORS.accent, COLORS.card]
  ])('%s cumple AA normal', (_nombre, frente, fondo) => {
    expect(contrastRatio(frente, fondo)).toBeGreaterThanOrEqual(UMBRAL)
  })

  it.each([
    ['texto papel sobre boton primario', COLORS.paper, COLORS.accent],
    ['texto peligro sobre su fondo suave', COLORS.danger, COLORS.dangerSoft],
    ['texto atencion sobre su fondo suave', COLORS.warn, COLORS.warnSoft],
    ['texto accent sobre fondo suave', COLORS.accent, COLORS.accentSoft]
  ])('%s cumple AA normal', (_nombre, frente, fondo) => {
    expect(contrastRatio(frente, fondo)).toBeGreaterThanOrEqual(UMBRAL)
  })

  // Los bordes hairline (line) son decorativos y estan exentos del
  // criterio 1.4.11: la jerarquia visual no depende de ellos.
})
