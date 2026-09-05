/**
 * Pruebas de contraste de color segun WCAG 2.1 AA.
 * Validan las combinaciones texto/fondo usadas por el sistema
 * de diseno para garantizar legibilidad sin depender del render.
 */

import { DARK_COLORS, LIGHT_COLORS } from '@src/constants/theme'

import { AA_NORMAL_TEXT_RATIO, contrastRatio } from '../helpers/contrast'

/** Umbral exigido al proyecto para todo texto */
const UMBRAL = AA_NORMAL_TEXT_RATIO

describe('contraste WCAG AA de la paleta clara', () => {
  it.each([
    ['texto principal sobre papel', LIGHT_COLORS.ink, LIGHT_COLORS.paper],
    ['texto principal sobre tarjeta', LIGHT_COLORS.ink, LIGHT_COLORS.card],
    ['texto secundario sobre tarjeta', LIGHT_COLORS.muted, LIGHT_COLORS.card],
    ['texto secundario sobre papel', LIGHT_COLORS.muted, LIGHT_COLORS.paper],
    ['texto auxiliar sobre tarjeta', LIGHT_COLORS.faint, LIGHT_COLORS.card],
    ['texto auxiliar sobre papel', LIGHT_COLORS.faint, LIGHT_COLORS.paper],
    ['etiqueta accent sobre tarjeta', LIGHT_COLORS.accent, LIGHT_COLORS.card]
  ])('%s cumple AA normal', (_nombre, frente, fondo) => {
    expect(contrastRatio(frente, fondo)).toBeGreaterThanOrEqual(UMBRAL)
  })

  it.each([
    ['texto papel sobre boton primario', LIGHT_COLORS.paper, LIGHT_COLORS.accent],
    ['texto peligro sobre su fondo suave', LIGHT_COLORS.danger, LIGHT_COLORS.dangerSoft],
    ['texto atencion sobre su fondo suave', LIGHT_COLORS.warn, LIGHT_COLORS.warnSoft],
    ['texto accent sobre fondo suave', LIGHT_COLORS.accent, LIGHT_COLORS.accentSoft]
  ])('%s cumple AA normal', (_nombre, frente, fondo) => {
    expect(contrastRatio(frente, fondo)).toBeGreaterThanOrEqual(UMBRAL)
  })
})

describe('contraste WCAG AA de la paleta oscura (estilo OpenCode)', () => {
  it.each([
    ['texto principal sobre papel', DARK_COLORS.ink, DARK_COLORS.paper],
    ['texto principal sobre tarjeta', DARK_COLORS.ink, DARK_COLORS.card],
    ['texto secundario sobre tarjeta', DARK_COLORS.muted, DARK_COLORS.card],
    ['texto secundario sobre papel', DARK_COLORS.muted, DARK_COLORS.paper],
    ['texto auxiliar sobre tarjeta', DARK_COLORS.faint, DARK_COLORS.card],
    ['texto auxiliar sobre papel', DARK_COLORS.faint, DARK_COLORS.paper],
    ['etiqueta accent sobre tarjeta', DARK_COLORS.accent, DARK_COLORS.card]
  ])('%s cumple AA normal', (_nombre, frente, fondo) => {
    expect(contrastRatio(frente, fondo)).toBeGreaterThanOrEqual(UMBRAL)
  })

  it.each([
    ['texto papel sobre boton primario', DARK_COLORS.paper, DARK_COLORS.accent],
    ['texto peligro sobre su fondo suave', DARK_COLORS.danger, DARK_COLORS.dangerSoft],
    ['texto atencion sobre su fondo suave', DARK_COLORS.warn, DARK_COLORS.warnSoft],
    ['texto accent sobre fondo suave', DARK_COLORS.accent, DARK_COLORS.accentSoft]
  ])('%s cumple AA normal', (_nombre, frente, fondo) => {
    expect(contrastRatio(frente, fondo)).toBeGreaterThanOrEqual(UMBRAL)
  })

  // Los bordes hairline (line) son decorativos y estan exentos del
  // criterio 1.4.11: la jerarquia visual no depende de ellos.
})
