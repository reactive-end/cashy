/**
 * Organismo IncomeEditor: formulario de alta/edicion de una fuente
 * de ingreso (concepto, monto cents-first, moneda y dia de cobro).
 * Valida en tiempo real desde el primer caracter y bloquea la
 * confirmacion mientras existan campos invalidos.
 */

import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Input } from '@src/components/atoms/Input'
import { Typography } from '@src/components/atoms/Typography'
import { MoneyInput } from '@src/components/molecules/MoneyInput'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { currencySymbol } from '@src/lib/format'
import { CURRENCIES } from '@src/types/domain'

import type { IncomeEditorProps } from './IncomeEditor.d'
import { useIncomeRowValidation } from './useIncomeEditor'

/** Opciones de moneda del control segmentado */
const CURRENCY_OPTIONS = CURRENCIES.map((moneda) => ({ value: moneda, label: moneda }))

/**
 * Renderiza los cuatro campos de la fila con sus errores en vivo.
 * @param props Valores, callbacks de cambio/confirmacion/cancelacion
 * @returns Formulario de ingreso para modales y pasos del wizard
 */
export function IncomeEditor({
  values,
  onChange,
  actionLabel,
  onConfirm,
  onCancel,
  testIDBase
}: IncomeEditorProps) {
  const { errors, isRowValid } = useIncomeRowValidation({ values })

  const testId = (suffix: string): string | undefined =>
    testIDBase ? `${testIDBase}-${suffix}` : undefined

  return (
    <View className="gap-3">
      <Input
        label="Concepto"
        value={values.name}
        onChangeText={(text) => onChange({ ...values, name: text })}
        placeholder="Ej. Salario, Ingresos pasivos"
        errorMessage={errors.name ?? undefined}
        testID={testId('name')}
      />

      <View className="gap-1">
        <Typography variant="label">Monto mensual</Typography>
        <MoneyInput
          symbol={currencySymbol(values.currency)}
          onCents={(cents) => onChange({ ...values, amountCents: cents })}
          testID={testId('amount')}
        />
        {errors.amount ? (
          <Typography variant="caption" className="text-danger">
            {errors.amount}
          </Typography>
        ) : null}
      </View>

      <SegmentedControl
        options={CURRENCY_OPTIONS}
        value={values.currency}
        onChange={(currency) => onChange({ ...values, currency })}
      />

      <Input
        label="Dia de cobro (1-31)"
        value={values.paydayDayText}
        onChangeText={(text) => onChange({ ...values, paydayDayText: text })}
        placeholder="Ej. 5"
        numeric
        errorMessage={errors.paydayDay ?? undefined}
        testID={testId('day')}
      />

      <View className="flex-row gap-2">
        {onCancel ? <Button label="Cancelar" variant="ghost" fullWidth onPress={onCancel} /> : null}
        <Button
          label={actionLabel}
          variant="primary"
          fullWidth
          disabled={!isRowValid}
          onPress={onConfirm}
          testID={testId('confirm')}
        />
      </View>
    </View>
  )
}
