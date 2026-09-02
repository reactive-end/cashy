/**
 * Molecula DueExpenseNoticeDialog: modal emergente no bloqueante que consulta al
 * usuario si efectivamente pago un gasto fijo llegado su dia de vencimiento.
 * Permite marcarlo como pagado emitiendo comprobante o posponer el aviso.
 */

import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { ModalBackdrop } from '@src/components/molecules/ModalBackdrop'
import { COLORS } from '@src/constants/theme'
import { formatAmount } from '@src/lib/format'

import type { DueExpenseNoticeDialogProps } from './DueExpenseNoticeDialog.d'

/**
 * Renderiza el modal de aviso y confirmacion de pago de gasto fijo.
 * @param props Gasto a confirmar, visibilidad, carga y callbacks
 * @returns Dialogo centrado con backdrop
 */
export function DueExpenseNoticeDialog({
  visible,
  expense,
  onConfirm,
  onDismiss,
  loading = false
}: DueExpenseNoticeDialogProps) {
  if (!expense) return null

  const formattedAmount = formatAmount(expense.amount, expense.currency)

  return (
    <ModalBackdrop visible={visible} onRequestClose={onDismiss}>
      <View className="gap-4">
        <Typography variant="label">Pago pendiente para hoy</Typography>

        <View className="flex-row items-center gap-3">
          <View className="size-11 items-center justify-center rounded-full bg-warn-soft">
            <Icon name="repeat" size={22} color={COLORS.warn} />
          </View>
          <View className="flex-1 min-w-0">
            <Typography variant="body" className="font-sans-semibold">
              {expense.name}
            </Typography>
            <Typography variant="caption" className="text-faint">
              {formattedAmount}
            </Typography>
          </View>
        </View>

        <Typography variant="body" className="text-muted">
          Hoy corresponde pagar {expense.name} ({formattedAmount}). Confirma si ya realizaste este
          pago para registrar tu comprobante de este mes y avanzar la próxima fecha.
        </Typography>

        <View className="gap-2 pt-2">
          <Button
            label="Marcar como pagado"
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
