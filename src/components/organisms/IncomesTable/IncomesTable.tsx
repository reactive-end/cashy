/**
 * Organismo IncomesTable: tabla de ingresos del usuario donde cada
 * fila muestra concepto, monto con moneda y dia de cobro, con
 * acciones para editar o quitar la fuente. Admite multiples filas.
 */

import { Pressable, View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'
import { formatAmount } from '@src/lib/format'

import type { IncomesTableProps } from './IncomesTable.d'

/**
 * Renderiza el listado completo con una fila por fuente de ingreso.
 * @param props Ingresos vigentes y callbacks de edicion/borrado
 * @returns Tabla lista para el wizard y la pestana de finanzas
 */
export function IncomesTable({ incomes, onEdit, onRemove, testIDBase }: IncomesTableProps) {
  return (
    <Card noPadding className="divide-y divide-line px-4">
      {incomes.map((income, index) => (
        <View key={income.id} className="flex-row items-center gap-2 py-3">
          <View className="min-w-0 flex-1 gap-0.5">
            <Typography variant="body" numberOfLines={1}>
              {income.name}
            </Typography>
            <Typography variant="caption" className="text-faint">
              {formatAmount(income.amount, income.currency)} · cobra el dia {income.paydayDay}
            </Typography>
          </View>

          <Pressable
            onPress={() => onEdit(income.id)}
            className="size-9 items-center justify-center rounded-full border border-line active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel={`Editar ${income.name}`}
            testID={testIDBase ? `${testIDBase}-edit-${index}` : undefined}
          >
            <Icon name="edit" size={16} color={COLORS.muted} />
          </Pressable>

          <Pressable
            onPress={() => onRemove(income.id)}
            className="size-9 items-center justify-center rounded-full border border-line active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${income.name}`}
            testID={testIDBase ? `${testIDBase}-remove-${index}` : undefined}
          >
            <Icon name="trash" size={16} color={COLORS.danger} />
          </Pressable>
        </View>
      ))}
    </Card>
  )
}
