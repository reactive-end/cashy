/**
 * Organismo IncomesPanel: vista de ingresos de la pestana Finanzas.
 * Muestra el total cobrado, el estimado mensual, cobros pendientes
 * de confirmacion y la tabla de fuentes con acciones de edicion/baja.
 */

import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { EmptyState } from '@src/components/molecules/EmptyState'
import { IncomesTable } from '@src/components/organisms/IncomesTable'
import { COLORS } from '@src/constants/theme'
import { formatAmount, formatNumber } from '@src/lib/format'

import type { IncomesPanelProps } from './IncomesPanel.d'

/**
 * Renderiza resumen, cobros pendientes y tabla de ingresos.
 * @param props Ingresos, resumenes, cobros pendientes, moneda base y callbacks
 * @returns Panel completo para la pestana Finanzas
 */
export function IncomesPanel({
  incomes,
  monthlyTotal,
  confirmedTotal = null,
  pendingConfirmations = [],
  baseCurrency,
  loading,
  onAdd,
  onEdit,
  onRemove,
  onConfirmReceipt
}: IncomesPanelProps) {
  if (loading) {
    return <Typography variant="caption">Cargando ingresos...</Typography>
  }

  if (incomes.length === 0) {
    return (
      <EmptyState
        className="min-h-96"
        icon="savings"
        title="Sin ingresos todavia"
        message="Agrega tu salario, ingresos pasivos u otras fuentes para ver tu flujo mensual."
        action={<Button label="Agregar ingreso" icon="add" fullWidth onPress={onAdd} />}
      />
    )
  }

  return (
    <View className="gap-4">
      {pendingConfirmations.length > 0 ? (
        <Card highlighted className="gap-3">
          <View className="flex-row items-center gap-2">
            <Icon name="savings" size={18} color={COLORS.accent} />
            <Typography variant="label">Cobros pendientes por confirmar</Typography>
          </View>

          <View className="gap-2">
            {pendingConfirmations.map((income) => (
              <View
                key={income.id}
                className="flex-row items-center justify-between gap-3 rounded-xl bg-card p-3 border border-line"
              >
                <View className="flex-1 min-w-0">
                  <Typography variant="body" numberOfLines={1}>
                    {income.name}
                  </Typography>
                  <Typography variant="caption" className="text-faint">
                    Dia {income.paydayDay} • {formatAmount(income.amount, income.currency)}
                  </Typography>
                </View>
                {onConfirmReceipt ? (
                  <Button
                    label="Recibido"
                    variant="primary"
                    onPress={() => onConfirmReceipt(income)}
                  />
                ) : null}
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Typography variant="label">Resumen de ingresos</Typography>
          <Typography variant="caption" className="text-faint">
            {incomes.length} fuente{incomes.length === 1 ? '' : 's'}
          </Typography>
        </View>

        <View className="flex-row justify-between divide-x divide-line">
          <View className="flex-1 pr-3">
            <Typography variant="caption" className="text-faint">
              Cobrado este mes
            </Typography>
            <Typography variant="display" className="text-[18px] leading-[22px] text-accent">
              {confirmedTotal !== null
                ? formatAmount(confirmedTotal, baseCurrency)
                : `${formatNumber(0)} ${baseCurrency}`}
            </Typography>
            <Typography variant="caption" className="text-faint">
              efectivo
            </Typography>
          </View>

          <View className="flex-1 pl-3">
            <Typography variant="caption" className="text-faint">
              Total proyectado
            </Typography>
            <Typography variant="display" className="text-[18px] leading-[22px]">
              {monthlyTotal !== null
                ? formatAmount(monthlyTotal, baseCurrency)
                : `${formatNumber(0)} ${baseCurrency}`}
            </Typography>
            <Typography variant="caption" className="text-faint">
              al mes
            </Typography>
          </View>
        </View>
      </Card>

      <Button label="Agregar ingreso" icon="add" fullWidth onPress={onAdd} />

      <IncomesTable
        incomes={incomes}
        onEdit={(id) => {
          const target = incomes.find((income) => income.id === id)

          if (target) onEdit(target)
        }}
        onRemove={onRemove}
        testIDBase="incomes-panel"
      />
    </View>
  )
}
