/**
 * Atomo Typography: unico punto de entrada al sistema tipografico.
 * Combina Fraunces (display editorial) con Manrope (UI legible)
 * segun la variante solicitada.
 */

import { Text } from 'react-native'

import type { TypographyProps, TypographyVariant } from './Typography.d'

/** Mapa de variantes a clases Tailwind del sistema de diseno */
const CLASSES_BY_VARIANT: Readonly<Record<TypographyVariant, string>> = {
  display: 'font-display text-[30px] leading-[36px] text-ink',
  title: 'font-title text-[20px] leading-[26px] text-ink',
  body: 'font-sans text-[15px] leading-[22px] text-ink',
  figure: 'font-sans-semibold text-[16px] leading-[22px] text-ink',
  label: 'font-sans-semibold text-[12px] leading-[16px] uppercase tracking-widest text-muted',
  caption: 'font-sans text-[12px] leading-[16px] text-faint'
}

/**
 * Renderiza texto aplicando la variante tipografica indicada.
 * Las variantes de encabezado exponen rol header para lectores de pantalla.
 * Las clases recibidas por el consumidor se fusionan al final,
 * permitiendo sobreescribir color o tamano puntualmente.
 * @param props Variante tipografica y propiedades nativas de Text
 * @returns Texto estilizado segun el sistema de diseno
 */
export function Typography({ variant = 'body', className, ...rest }: TypographyProps) {
  const clases = `${CLASSES_BY_VARIANT[variant]} ${className ?? ''}`
  const esEncabezado = variant === 'display' || variant === 'title'

  return (
    <Text className={clases} accessibilityRole={esEncabezado ? 'header' : undefined} {...rest} />
  )
}
