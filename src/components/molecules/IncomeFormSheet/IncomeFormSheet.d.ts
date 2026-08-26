/**
 * Tipos publicos de la molecula IncomeFormSheet.
 * Modal propio que envuelve el editor de ingresos para altas y
 * ediciones desde la pestana de finanzas.
 */

import type { IncomeDraft } from '@src/components/organisms/IncomeEditor'

/** Propiedades de la molecula IncomeFormSheet */
export interface IncomeFormSheetProps {
  /** Controla la visibilidad del modal */
  visible: boolean
  /** Valores vigentes del formulario de la fila */
  values: IncomeDraft
  /** Callback al modificar cualquier campo del formulario */
  onChange: (values: IncomeDraft) => void
  /** Etiqueta del boton principal (Agregar o Guardar cambios) */
  actionLabel: string
  /** Accion al confirmar; solo se dispara con la fila valida */
  onConfirm: () => void
  /** Accion al cerrar el modal sin guardar */
  onClose: () => void
  /** Titulo mostrado en la cabecera del modal */
  title: string
  /** testID base delegado al editor */
  testIDBase?: string
}
