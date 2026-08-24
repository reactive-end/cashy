/**
 * Tipos publicos de la molecula SectionHeader.
 */

/** Propiedades del encabezado de seccion */
export interface SectionHeaderProps {
  /** Titulo de la seccion */
  title: string
  /** Texto de la accion secundaria a la derecha; oculta si se omite */
  actionLabel?: string
  /** Accion al pulsar el texto secundario */
  onActionPress?: () => void
}
