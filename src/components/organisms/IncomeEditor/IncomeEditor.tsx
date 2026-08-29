/**
 * Organismo IncomeEditor: formulario de alta/edicion de una fuente
 * de ingreso (concepto, monto cents-first, moneda y dia de cobro).
 * Valida en tiempo real desde el primer caracter y bloquea la
 * confirmacion mientras existan campos invalidos.
 */

import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Input } from '@src/components/atoms/Input'
import { Typography } from '@src/components/atoms/Typography'
import { MoneyInput } from '@src/components/molecules/MoneyInput'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { COLORS } from '@src/constants/theme'
import { currencySymbol } from '@src/lib/format'
import { CURRENCIES, type ExpenseType, type Recurrence } from '@src/types/domain'

import type { IncomeEditorProps } from './IncomeEditor.d'
import { useIncomeRowValidation } from './useIncomeEditor'

/** Opciones de tipo de ingreso */
const TYPE_OPTIONS = [
  { value: 'fixed', label: 'Fijo' },
  { value: 'unique', label: 'Unico' }
]

/** Opciones de recurrencia para ingresos fijos */
const RECURRENCE_OPTIONS = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'weekly', label: 'Semanal' }
]

/** Opciones de moneda del control segmentado */
const CURRENCY_OPTIONS = CURRENCIES.map((moneda) => ({ value: moneda, label: moneda }))

/**
 * Renderiza los campos de la fila con sus errores en vivo y diseno en tarjetas.
 * @param props Valores, callbacks de cambio/confirmacion/cancelacion
 * @returns Formulario de ingreso estructurado y estilizado para pantallas y wizards
 */
export function IncomeEditor({
  values,
  onChange,
  actionLabel,
  onConfirm,
  onCancel,
  loading = false,
  testIDBase
}: IncomeEditorProps) {
  const { errors, isRowValid } = useIncomeRowValidation({ values })

  const testId = (suffix: string): string | undefined =>
    testIDBase ? `${testIDBase}-${suffix}` : undefined

  const isFixed = (values.type ?? 'fixed') === 'fixed'

  return (
    <View className="gap-4">
      {/* Modalidad de ingreso */}
      <Card className="gap-3">
        <View className="flex-row items-center gap-2.5">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-accent-soft">
            <Icon name="wallet" size={16} color={COLORS.accent} />
          </View>
          <View className="flex-1">
            <Typography variant="label" className="font-semibold text-ink">
              Modalidad de ingreso
            </Typography>
            <Typography variant="caption" className="text-[12px] text-muted">
              {isFixed ? 'Entrada fija periódica habitual' : 'Cobro puntual o esporádico'}
            </Typography>
          </View>
        </View>

        <SegmentedControl
          options={TYPE_OPTIONS}
          value={values.type ?? 'fixed'}
          onChange={(type) => onChange({ ...values, type: type as ExpenseType })}
        />
      </Card>

      {/* Datos principales: Concepto y Monto */}
      <Card className="gap-4">
        <View className="flex-row items-center gap-2.5">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-accent-soft">
            <Icon name="dollar" size={16} color={COLORS.accent} />
          </View>
          <View className="flex-1">
            <Typography variant="label" className="font-semibold text-ink">
              Monto y concepto
            </Typography>
            <Typography variant="caption" className="text-[12px] text-muted">
              Identifica la procedencia y cantidad del dinero
            </Typography>
          </View>
        </View>

        <Input
          label="Concepto o fuente"
          value={values.name}
          onChangeText={(text) => onChange({ ...values, name: text })}
          placeholder="Ej. Salario, Honorarios, Alquiler"
          errorMessage={errors.name ?? undefined}
          testID={testId('name')}
        />

        {/* Hero container para captura de monto */}
        <View className="gap-2.5 rounded-2xl border border-line bg-paper/70 p-4">
          <View className="flex-row items-center justify-between">
            <Typography variant="caption" className="font-medium text-muted">
              {isFixed ? 'Monto regular estimado' : 'Monto total a percibir'}
            </Typography>
            <View className="rounded-full bg-accent-soft px-2 py-0.5">
              <Typography variant="caption" className="text-[11px] font-semibold text-accent">
                {values.currency}
              </Typography>
            </View>
          </View>

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

          <View className="mt-1 border-t border-line/70 pt-3">
            <Typography variant="caption" className="mb-1.5 text-[12px] text-muted">
              Moneda de cobro
            </Typography>
            <SegmentedControl
              options={CURRENCY_OPTIONS}
              value={values.currency}
              onChange={(currency) => onChange({ ...values, currency })}
            />
          </View>
        </View>
      </Card>

      {/* Programacion y frecuencia para ingresos fijos */}
      {isFixed ? (
        <Card className="gap-4">
          <View className="flex-row items-center gap-2.5">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-accent-soft">
              <Icon name="calendar" size={16} color={COLORS.accent} />
            </View>
            <View className="flex-1">
              <Typography variant="label" className="font-semibold text-ink">
                Calendario de cobro
              </Typography>
              <Typography variant="caption" className="text-[12px] text-muted">
                Día y recurrencia en que recibes este ingreso
              </Typography>
            </View>
          </View>

          <View className="gap-1.5">
            <Typography variant="label">Periodicidad</Typography>
            <SegmentedControl
              options={RECURRENCE_OPTIONS}
              value={values.recurrence ?? 'monthly'}
              onChange={(recurrence) =>
                onChange({ ...values, recurrence: recurrence as Recurrence })
              }
            />
          </View>

          <View className="gap-1">
            <Input
              label="Dia de cobro (1-31)"
              value={values.paydayDayText}
              onChangeText={(text) => onChange({ ...values, paydayDayText: text })}
              placeholder="Ej. 5, 15, 30"
              numeric
              errorMessage={errors.paydayDay ?? undefined}
              testID={testId('day')}
            />
            <Typography variant="caption" className="text-[12px] text-faint">
              Usado para avisarte cuando llegue el día y proyectar tu flujo mensual.
            </Typography>
          </View>
        </Card>
      ) : null}

      {/* Botones de accion */}
      <View className="flex-row gap-3 pt-2">
        {onCancel ? (
          <View className="flex-1">
            <Button label="Cancelar" variant="ghost" fullWidth onPress={onCancel} />
          </View>
        ) : null}
        <View className={onCancel ? 'flex-1' : 'w-full'}>
          <Button
            label={actionLabel}
            variant="primary"
            fullWidth
            disabled={!isRowValid}
            loading={loading}
            onPress={onConfirm}
            testID={testId('confirm')}
          />
        </View>
      </View>
    </View>
  )
}
