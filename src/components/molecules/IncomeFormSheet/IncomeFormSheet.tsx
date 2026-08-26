/**
 * Molecula IncomeFormSheet: modal con fondo atenuado que presenta
 * el editor de una fuente de ingreso. Reutiliza IncomeEditor y
 * ModalBackdrop manteniendo la estetica propia del proyecto.
 */

import { ScrollView } from 'react-native'

import { Typography } from '@src/components/atoms/Typography'
import { ModalBackdrop } from '@src/components/molecules/ModalBackdrop'
import { IncomeEditor } from '@src/components/organisms/IncomeEditor'

import type { IncomeFormSheetProps } from './IncomeFormSheet.d'

/**
 * Renderiza el modal de alta/edicion de un ingreso.
 * @param props Visibilidad, valores, callbacks y titulo
 * @returns Hoja de formulario lista para la pestana de finanzas
 */
export function IncomeFormSheet({
  visible,
  values,
  onChange,
  actionLabel,
  onConfirm,
  onClose,
  title,
  testIDBase
}: IncomeFormSheetProps) {
  return (
    <ModalBackdrop visible={visible} onRequestClose={onClose}>
      <Typography variant="label">{title}</Typography>

      <ScrollView className="mt-3" nestedScrollEnabled showsVerticalScrollIndicator={false}>
        <IncomeEditor
          values={values}
          onChange={onChange}
          actionLabel={actionLabel}
          onConfirm={onConfirm}
          onCancel={onClose}
          testIDBase={testIDBase}
        />
      </ScrollView>
    </ModalBackdrop>
  )
}
