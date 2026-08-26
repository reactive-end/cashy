/**
 * Molecula PaydayNoticeDialog: modal emergente que consulta al usuario
 * si efectivamente recibio un ingreso programado llegado su dia de cobro.
 * Permite confirmar la recepcion del dinero o posponer el aviso.
 */

import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { ModalBackdrop } from '@src/components/molecules/ModalBackdrop'
import { COLORS } from '@src/constants/theme'
import { formatAmount } from '@src/lib/format'

import type { PaydayNoticeDialogProps } from './PaydayNoticeDialog.d'

/**
 * Renderiza el modal de confirmacion de cobro de ingreso.
 * @param props Ingreso a confirmar, visibilidad, carga y callbacks
 * @returns Dialogo centrado con backdrop
 */
export function PaydayNoticeDialog({
  visible,
  income,
  onConfirm,
  onDismiss,
  loading = false
}: PaydayNoticeDialogProps) {
  if (!income) return null

  const formattedAmount = formatAmount(income.amount, income.currency)

  return (
    <ModalBackdrop visible={visible} onRequestClose={onDismiss}>
      <View className="gap-4">
        <Typography variant="label">¿Recibiste este ingreso?</Typography>

        <View className="flex-row items-center gap-3">
          <View className="size-11 items-center justify-center rounded-full bg-accent-soft">
            <Icon name="savings" size={22} color={COLORS.accent} />
          </View>
          <View className="flex-1 min-w-0">
            <Typography variant="body" className="font-sans-semibold">
              {income.name}
            </Typography>
            <Typography variant="caption" className="text-faint">
              {formattedAmount}
            </Typography>
          </View>
        </View>

        <Typography variant="body" className="text-muted">
          Hoy es el dia de cobro de {income.name} ({formattedAmount}). Confirma si ya tienes el
          dinero disponible para sumarlo a tu balance real.
        </Typography>

        <View className="gap-2 pt-2">
          <Button
            label="Si, recibido"
            variant="primary"
            fullWidth
            loading={loading}
            onPress={onConfirm}
          />
          <Button
            label="Aun no / Mas tarde"
            variant="ghost"
            fullWidth
            disabled={loading}
            onPress={onDismiss}
          />
        </View>
      </View>
    </ModalBackdrop>
  )
}
