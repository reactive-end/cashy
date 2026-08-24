/**
 * Tipos publicos de la molecula ConfirmDialog.
 */

/** Propiedades del dialogo de confirmacion */
export interface ConfirmDialogProps {
  /** Controla la visibilidad del dialogo */
  visible: boolean
  /** Titulo breve de la decision */
  title: string
  /** Mensaje explicativo de la consecuencia */
  message: string
  /** Texto del boton de confirmacion; por defecto "Confirmar" */
  confirmLabel?: string
  /** Texto del boton de cancelacion; por defecto "Cancelar" */
  cancelLabel?: string
  /** Usa el tono peligroso en el boton de confirmacion */
  destructive?: boolean
  /** Accion al confirmar */
  onConfirm: () => void
  /** Accion al cancelar o cerrar el dialogo */
  onCancel: () => void
}
