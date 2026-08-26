/**
 * Molecula AlertDialog: aviso modal centrado vertical y horizontalmente
 * con icono semantico, mensaje y boton Aceptar. Sustituye a los
 * avisos flotantes para feedback de acciones importantes.
 */

import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { ModalBackdrop } from '@src/components/molecules/ModalBackdrop'
import { COLORS } from '@src/constants/theme'

import type { AlertDialogProps, AlertDialogTone } from './AlertDialog.d'

/** Configuracion visual por tono */
const CONFIG_BY_TONE: Readonly<
  Record<AlertDialogTone, { icon: 'check' | 'alert'; color: string }>
> = {
  success: { icon: 'check', color: COLORS.accent },
  danger: { icon: 'alert', color: COLORS.danger }
}

/**
 * Renderiza el dialogo centrado con icono, mensaje y Aceptar.
 * @param props Visibilidad, titulo opcional, mensaje, tono y cierre
 * @returns Dialogo de aviso alineado con la estetica del sistema
 */
export function AlertDialog({
  visible,
  title,
  message,
  tone = 'success',
  onClose
}: AlertDialogProps) {
  const config = CONFIG_BY_TONE[tone]

  return (
    <ModalBackdrop visible={visible} onRequestClose={onClose}>
      <View className="items-center gap-3">
        <View className="size-12 items-center justify-center rounded-full bg-paper border border-line">
          <Icon name={config.icon} size={24} color={config.color} />
        </View>

        {title ? <Typography variant="title">{title}</Typography> : null}

        <Typography variant="body" className="text-center text-muted">
          {message}
        </Typography>

        <View className="mt-2 w-full">
          <Button label="Aceptar" fullWidth onPress={onClose} />
        </View>
      </View>
    </ModalBackdrop>
  )
}
