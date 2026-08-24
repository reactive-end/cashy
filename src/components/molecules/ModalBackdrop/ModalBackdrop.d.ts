/**
 * Tipos publicos de la molecula ModalBackdrop.
 * Base reutilizable para modales propios con fondo oscurecido,
 * alternativa consistente a los dialogos nativos del sistema.
 */

import type { ReactNode } from 'react'

/** Propiedades del contenedor modal */
export interface ModalBackdropProps {
  /** Controla la visibilidad del modal */
  visible: boolean
  /** Accion al cerrar (toque fuera, boton atras del sistema) */
  onRequestClose: () => void
  /** Contenido mostrado dentro de la tarjeta central */
  children: ReactNode
}
