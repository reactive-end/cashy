/**
 * Tipos publicos del atomo Badge.
 * Pastilla pequena para estados y metadatos contextuales.
 */

/** Tonos disponibles segun la semantica del mensaje */
export type BadgeTone =
  /** Gris neutro para metadatos sin urgencia */
  | 'neutral'
  /** Verde suave para estados positivos o pagado */
  | 'success'
  /** Ambar suave para vencimientos proximos */
  | 'warning'
  /** Rojo suave para vencidos o errores */
  | 'danger'

/** Propiedades del atomo Badge */
export interface BadgeProps {
  /** Texto corto que muestra la pastilla */
  text: string
  /** Tono semantico del fondo y el texto; por defecto neutro */
  tone?: BadgeTone
}
