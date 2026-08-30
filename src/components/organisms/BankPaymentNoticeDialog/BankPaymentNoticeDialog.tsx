/**
 * Organismo BankPaymentNoticeDialog: modal emergente que consulta al usuario
 * si desea registrar una notificacion de pago movil bancario como ingreso unico.
 * Muestra monto en Bs, equivalencia en divisa y concepto editable.
 */

import { useState } from 'react'
import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Icon } from '@src/components/atoms/Icon'
import { Input } from '@src/components/atoms/Input'
import { Typography } from '@src/components/atoms/Typography'
import { ModalBackdrop } from '@src/components/molecules/ModalBackdrop'
import { COLORS } from '@src/constants/theme'
import type { ParsedBankNotification } from '@src/lib/bankNotifications'
import { convert } from '@src/lib/conversions'
import { formatAmount } from '@src/lib/format'

import type { BankPaymentNoticeDialogProps } from './BankPaymentNoticeDialog.d'

/**
 * Genera el concepto inicial sugerido para el pago movil.
 * @param bankName Nombre comercial del banco (ej. BNC)
 * @param sender Remitente o telefono de origen si existe
 * @returns Cadena de concepto inicial
 */
function defaultConcept(bankName: string, sender?: string): string {
  return sender ? `Pago Móvil ${bankName} (${sender})` : `Pago Móvil ${bankName}`
}

/**
 * Contenido interno con estado local de concepto inicializado de forma pura por clave.
 */
function BankPaymentNoticeDialogContent({
  notification,
  visible,
  rates,
  baseCurrency,
  onConfirm,
  onDismiss,
  loading
}: BankPaymentNoticeDialogProps & { notification: ParsedBankNotification }) {
  const [concept, setConcept] = useState(() =>
    defaultConcept(notification.bankName, notification.sender)
  )

  const formattedAmount = formatAmount(notification.amount, notification.currency)
  const equivalent =
    rates && notification.currency !== baseCurrency
      ? convert(notification.amount, notification.currency, baseCurrency, rates)
      : null

  return (
    <ModalBackdrop visible={visible} onRequestClose={onDismiss}>
      <View className="gap-4">
        <View className="flex-row items-center justify-between">
          <Typography variant="label">¿Registrar pago móvil recibido?</Typography>
          <View className="rounded-full bg-accent-soft px-2.5 py-0.5">
            <Typography variant="caption" className="text-[11px] font-semibold text-accent">
              {notification.bankName}
            </Typography>
          </View>
        </View>

        {/* Recuadro de monto y equivalencia */}
        <View className="flex-row items-center gap-3 rounded-2xl border border-line bg-paper/70 p-3.5">
          <View className="size-11 items-center justify-center rounded-full bg-accent-soft">
            <Icon name="savings" size={22} color={COLORS.accent} />
          </View>
          <View className="flex-1 min-w-0">
            <Typography variant="display" className="text-[18px] leading-[22px] text-accent">
              {formattedAmount}
            </Typography>
            {equivalent !== null ? (
              <Typography variant="caption" className="text-faint font-medium">
                ≈ {formatAmount(equivalent, baseCurrency)} (Tasa oficial)
              </Typography>
            ) : null}
            {notification.sender ? (
              <Typography variant="caption" className="text-faint text-[11px]">
                De: {notification.sender}
              </Typography>
            ) : null}
          </View>
        </View>

        {/* Campo de concepto editable */}
        <Input
          label="Concepto del ingreso"
          value={concept}
          onChangeText={setConcept}
          placeholder="Concepto del pago móvil"
          testID="bank-payment-concept"
        />

        <Typography variant="caption" className="text-faint text-[12px] leading-[16px]">
          Se registrará como un ingreso único para mantener tu balance y finanzas al día.
        </Typography>

        {/* Botones de accion */}
        <View className="gap-2 pt-1">
          <Button
            label="Registrar como ingreso"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={!concept.trim()}
            onPress={() => onConfirm(concept.trim())}
            testID="bank-payment-confirm"
          />
          <Button
            label="Descartar"
            variant="ghost"
            fullWidth
            disabled={loading}
            onPress={onDismiss}
            testID="bank-payment-dismiss"
          />
        </View>
      </View>
    </ModalBackdrop>
  )
}

/**
 * Renderiza el modal de confirmacion de ingreso por pago movil.
 * @param props Datos de la notificacion, estado de tasas, callbacks y carga
 * @returns Dialogo modal centrado
 */
export function BankPaymentNoticeDialog(props: BankPaymentNoticeDialogProps) {
  if (!props.notification) return null

  return (
    <BankPaymentNoticeDialogContent
      key={props.notification.detectedAt}
      {...props}
      notification={props.notification}
    />
  )
}
