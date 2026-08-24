/**
 * Public types of the AlertDialog molecule.
 */

/** Tonos semanticos que definen el icono del dialogo */
export type AlertDialogTone = 'success' | 'danger'

/** Propiedades del dialogo de aviso con boton Aceptar */
export interface AlertDialogProps {
  /** Controla la visibilidad del dialogo */
  visible: boolean
  /** Titulo corto opcional sobre el mensaje */
  title?: string
  /** Mensaje principal del aviso */
  message: string
  /** Tono semantico del icono; por defecto success */
  tone?: AlertDialogTone
  /** Callback al pulsar Aceptar o cerrar el modal */
  onClose: () => void
}
