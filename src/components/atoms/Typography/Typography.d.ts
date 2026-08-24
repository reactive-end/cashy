/**
 * Tipos publicos del atomo Typography.
 * Define las variantes tipograficas del sistema de diseno.
 */

import type { TextProps } from 'react-native'

/** Variantes tipograficas disponibles en la escala del sistema */
export type TypographyVariant =
  /** Titulo editorial grande de pantalla (Fraunces) */
  | 'display'
  /** Encabezado de seccion (Fraunces) */
  | 'title'
  /** Texto principal de lectura (Manrope) */
  | 'body'
  /** Texto enfatizado dentro de listas y cifras (Manrope semibold) */
  | 'figure'
  /** Etiquetas de campos y controles, en mayusculas suaves */
  | 'label'
  /** Texto auxiliar pequeno para metadatos */
  | 'caption'

/** Propiedades del atomo Typography */
export interface TypographyProps extends TextProps {
  /** Variante visual a aplicar; por defecto cuerpo */
  variant?: TypographyVariant
}
