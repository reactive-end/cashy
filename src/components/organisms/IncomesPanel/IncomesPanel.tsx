/**
 * Organismo IncomesPanel: vista de ingresos de la pestana Finanzas.
 * Muestra el total mensual convertido a la moneda base, la tabla
 * de fuentes con sus dias de cobro y un estado vacio accionable.
 */

import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Typography } from '@src/components/atoms/Typography'
import { EmptyState } from '@src/components/molecules/EmptyState'
import { IncomesTable } from '@src/components/organisms/IncomesTable'
import { formatAmount, formatNumber } from '@src/lib/format'

import type { IncomesPanelProps } from './IncomesPanel.d'

/**
 * Renderiza resumen, tabla o vacio segun los datos vigentes.
 * @param props Ingresos, resumen, moneda base y callbacks
 * @returns Panel completo para la pestana Finanzas
 */
export function IncomesPanel({
  incomes,
  monthlyTotal,
  baseCurrency,
  loading,
  onAdd,
  onEdit,
  onRemove
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
    <View className="gap-3">
      <Card className="gap-1">
        <Typography variant="caption" className="text-faint">
          Ingreso mensual estimado
        </Typography>
        <Typography variant="title">
          {monthlyTotal !== null
            ? formatAmount(monthlyTotal, baseCurrency)
            : `${formatNumber(0)} ${baseCurrency}`}
        </Typography>
        <Typography variant="caption" className="text-faint">
          {incomes.length} fuente{incomes.length === 1 ? '' : 's'} de ingreso
        </Typography>
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
