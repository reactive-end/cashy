/**
 * Organismo ExpenseForm: formulario completo para gastos fijos y unicos.
 * Ajusta los campos segun el tipo elegido (recurrencia y fecha solo en fijos),
 * usa el CalendarPicker propio para fechas y ConfirmDialog propio
 * para la eliminacion, sin depender de componentes nativos del sistema.
 */

import { Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Input } from '@src/components/atoms/Input'
import { Typography } from '@src/components/atoms/Typography'
import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog'
import { ModalBackdrop } from '@src/components/molecules/ModalBackdrop'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { CalendarPicker } from '@src/components/organisms/CalendarPicker'
import { COLORS } from '@src/constants/theme'
import { currencySymbol } from '@src/lib/format'
import { CURRENCIES, RECURRENCES, type Recurrence, type ExpenseType } from '@src/types/domain'

import type { ExpenseFormProps } from './ExpenseForm.d'
import { RECURRENCE_LABELS, useExpenseForm } from './useExpenseForm'

/** Opciones del segmento de tipo de gasto */
const TYPE_OPTIONS = [
  { value: 'unique' as ExpenseType, label: 'Unico' },
  { value: 'fixed' as ExpenseType, label: 'Fijo' }
]

/**
 * Renderiza el formulario con todos sus campos condicionales.
 * @param props Gasto inicial, callbacks de guardado y eliminacion
 * @returns Formulario listo para pantallas de creacion y edicion
 */
export function ExpenseForm({ initialExpense = null, onSave, onDelete }: ExpenseFormProps) {
  const form = useExpenseForm(initialExpense ?? null, onSave, onDelete)

  return (
    <View className="gap-5">
      <SegmentedControl options={TYPE_OPTIONS} value={form.type} onChange={form.setType} />

      <Card className="gap-4">
        <Input
          testID="input-nombre"
          label="Nombre"
          value={form.name}
          onChangeText={form.setName}
          placeholder="Netflix, alquiler, licuadora..."
          errorMessage={form.errors.name}
        />

        <Input
          testID="input-monto"
          label="Monto"
          value={form.amountText}
          onChangeText={form.setAmountText}
          placeholder="0,00"
          numeric
          prefix={currencySymbol(form.currency)}
          errorMessage={form.errors.amount}
        />

        <View className="gap-1.5">
          <Typography variant="label">Moneda</Typography>
          <SegmentedControl
            options={CURRENCIES.map((moneda) => ({ value: moneda, label: currencySymbol(moneda) }))}
            value={form.currency}
            onChange={form.setCurrency}
          />
        </View>

        <Input
          label="Categoria (opcional)"
          value={form.category}
          onChangeText={form.setCategory}
          placeholder="Suscripciones, hogar, antojos..."
        />

        <Input
          label="Nota (opcional)"
          value={form.note}
          onChangeText={form.setNote}
          placeholder="Detalles del gasto"
          multiline
        />
      </Card>

      {form.type === 'fixed' ? (
        <Card className="gap-4">
          <View className="flex-row items-center gap-2">
            <Icon name="repeat" size={16} color={COLORS.muted} />
            <Typography variant="label">Repeticion</Typography>
          </View>

          <SegmentedControl
            options={RECURRENCES.map((recurrencia: Recurrence) => ({
              value: recurrencia,
              label: RECURRENCE_LABELS[recurrencia]
            }))}
            value={form.recurrence}
            onChange={form.setRecurrence}
          />

          <View className="gap-1.5">
            <Typography variant="label">Proximo vencimiento</Typography>
            <Pressable
              onPress={form.openDatePicker}
              className="flex-row items-center justify-between rounded-xl border border-line bg-card px-3.5 py-3 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel={`Proximo vencimiento: ${form.dueDateLabel}`}
              testID="due-date-trigger"
            >
              <Typography variant="figure">{form.dueDateLabel}</Typography>
              <Icon name="calendar" size={18} color={COLORS.muted} />
            </Pressable>
            <Typography variant="caption">
              Te avisamos un dia antes a la hora configurada.
            </Typography>
          </View>
        </Card>
      ) : null}

      <Button
        label={initialExpense ? 'Guardar cambios' : 'Registrar gasto'}
        icon="check"
        size="large"
        fullWidth
        loading={form.saving}
        onPress={() => void form.submit()}
      />

      {initialExpense && onDelete ? (
        <Button
          label="Eliminar gasto"
          icon="trash"
          variant="danger"
          size="large"
          fullWidth
          onPress={form.requestDeleteConfirmation}
        />
      ) : null}

      {form.showDatePicker ? (
        <ModalBackdrop visible onRequestClose={form.closeDatePicker}>
          <View className="gap-4">
            <Typography variant="title">Elegir fecha</Typography>
            <CalendarPicker value={form.dueDateISO} onChange={form.pickDueDate} />
          </View>
        </ModalBackdrop>
      ) : null}

      <ConfirmDialog
        visible={form.deleteConfirmationVisible}
        title="Eliminar gasto"
        message="Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => void form.confirmDelete()}
        onCancel={form.dismissDeleteConfirmation}
      />
    </View>
  )
}
