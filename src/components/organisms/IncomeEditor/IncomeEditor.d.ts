/**
 * Tipos publicos del organismo IncomeEditor.
 * Formulario de una fuente de ingreso con validacion en tiempo real.
 */

import type { Currency } from '@src/types/domain'

/** Estado del formulario de una fila de ingreso */
export interface IncomeDraft {
  /** Concepto del ingreso, por ejemplo Salario */
  name: string
  /** Monto mensual capturado en centavos (patron cents-first) */
  amountCents: number
  /** Moneda en que se percibe */
  currency: Currency
  /** Texto crudo del dia de cobro capturado en el campo */
  paydayDayText: string
}

/** Propiedades del organismo IncomeEditor */
export interface IncomeEditorProps {
  /** Valores vigentes del formulario */
  values: IncomeDraft
  /** Callback al modificar cualquier campo del formulario */
  onChange: (values: IncomeDraft) => void
  /** Etiqueta del boton principal (Agregar o Guardar cambios) */
  actionLabel: string
  /** Accion al confirmar; solo se dispara con la fila valida */
  onConfirm: () => void
  /** Accion opcional para descartar la edicion en curso */
  onCancel?: () => void
  /** testID base para automatizacion */
  testIDBase?: string
}
