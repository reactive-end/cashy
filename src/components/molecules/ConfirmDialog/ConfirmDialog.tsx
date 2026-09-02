/**
 * Molecula ConfirmDialog: pide confirmacion antes de acciones
 * irreversibles como eliminar un gasto. Sustituye al Alert
 * nativo con una tarjeta propia del sistema de diseno.
 */

import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Typography } from '@src/components/atoms/Typography'
import { ModalBackdrop } from '@src/components/molecules/ModalBackdrop'

import type { ConfirmDialogProps } from './ConfirmDialog.d'

/**
 * Renderiza el dialogo con los dos botones de decision.
 * @param props Titulo, mensaje, etiquetas y callbacks de decision
 * @returns Dialogo centrado coherente con la UI del proyecto
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  confirmDisabled = false,
  cancelDisabled = false,
  onConfirm,
  onCancel,
  children
}: ConfirmDialogProps) {
  const handleRequestClose = (): void => {
    if (!cancelDisabled) {
      onCancel()
    }
  }

  return (
    <ModalBackdrop visible={visible} onRequestClose={handleRequestClose}>
      <View className="gap-3">
        <Typography variant="title">{title}</Typography>
        <Typography variant="body" className="text-muted">
          {message}
        </Typography>

        {children}

        <View className="mt-2 flex-row justify-end gap-2">
          <Button
            label={cancelLabel}
            variant="ghost"
            disabled={cancelDisabled}
            onPress={onCancel}
          />
          <Button
            label={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            disabled={confirmDisabled}
            onPress={onConfirm}
          />
        </View>
      </View>
    </ModalBackdrop>
  )
}
