/**
 * Organismo UpcomingPayments: agenda corta de vencimientos de gastos fijos
 * para los proximos siete dias, con insignias de urgencia.
 */

import { View } from 'react-native'

import type { BadgeTone } from '@src/components/atoms/Badge/Badge.d'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { ExpenseItem } from '@src/components/molecules/ExpenseItem'
import { COLORS } from '@src/constants/theme'
import { formatAmount, formatDate } from '@src/lib/format'

import type { UpcomingPaymentsProps } from './UpcomingPayments.d'

/**
 * Determina el tono de la insignia segun la cercania del vencimiento.
 * @param daysRemaining Dias hasta el pago
 * @returns Tono semantico correspondiente
 */
function toneByDays(daysRemaining: number): BadgeTone {
  if (daysRemaining <= 1) return 'danger'
  if (daysRemaining <= 3) return 'warning'
  return 'neutral'
}

/**
 * Etiqueta legible segun la cercania del vencimiento.
 * @param daysRemaining Dias hasta el pago
 * @returns Texto tipo "Hoy", "Manana" o "en N dias"
 */
function labelByDays(daysRemaining: number): string {
  if (daysRemaining === 0) return 'vence hoy'
  if (daysRemaining === 1) return 'mañana'
  return `${daysRemaining} dias`
}

/**
 * Renderiza la lista de pagos proximos o un mensaje de calma.
 * @param props Pagos calculados por useExpenses y callback de navegacion
 * @returns Seccion de agenda para la pantalla de inicio
 */
export function UpcomingPayments({ payments, onPaymentPress }: UpcomingPaymentsProps) {
  if (payments.length === 0) {
    return (
      <View className="flex-row items-center gap-2 rounded-2xl border border-line bg-card p-4">
        <Icon name="check" size={18} color={COLORS.accent} />
        <Typography variant="caption" className="flex-1 text-[13px] leading-[18px]">
          Nada vence en los proximos siete dias. Todo en orden.
        </Typography>
      </View>
    )
  }

  return (
    <View className="rounded-2xl border border-line bg-card px-4 py-1">
      {payments.map(({ expense, daysRemaining }) => (
        <ExpenseItem
          key={expense.id}
          icon="calendar"
          name={expense.name}
          detail={`Vence ${formatDate(expense.nextDueDate as string)}`}
          formattedAmount={formatAmount(expense.amount, expense.currency)}
          badge={{ text: labelByDays(daysRemaining), tone: toneByDays(daysRemaining) }}
          onPress={() => onPaymentPress?.(expense.id)}
        />
      ))}
    </View>
  )
}
