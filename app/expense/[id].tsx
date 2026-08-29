/**
 * ExpenseDetail screen: read only view of an existing expense with
 * actions to edit or delete it. Editing happens in /edit-expense/[id]
 * so the detail screen never mutates data directly.
 */

import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog'
import { getExpenseReceiptsByExpense } from '@src/db/expenseReceipts'
import { getExpense } from '@src/db/expenses'
import { useExpenses } from '@src/hooks/useExpenses'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { convert } from '@src/lib/conversions'
import { formatAmount, formatDate } from '@src/lib/format'
import {
  RECURRENCE_LABELS,
  type BaseCurrency,
  type Expense,
  type ExpenseReceipt
} from '@src/types/domain'

/**
 * Pantalla de detalles de un gasto concreto con acciones de edicion
 * y borrado.
 * @returns Vista de solo lectura con botones Editar y Eliminar
 */
export default function ExpenseDetail() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [expense, setExpense] = useState<Expense | null>(null)
  const [expenseReceipts, setExpenseReceipts] = useState<ExpenseReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false)
  const [receiptToRevert, setReceiptToRevert] = useState<ExpenseReceipt | null>(null)

  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const expensesState = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)

  // Recarga en cada foco: al volver de la edicion el detalle refleja los cambios.
  useFocusEffect(
    useCallback(() => {
      let active = true

      if (typeof id === 'string') {
        Promise.all([getExpense(id), getExpenseReceiptsByExpense(id)]).then(
          ([encontrado, receipts]) => {
            if (!active) return
            setExpense(encontrado)
            setExpenseReceipts(receipts)
            setLoading(false)
          }
        )
      }

      return () => {
        active = false
      }
    }, [id])
  )

  const montoConvertido =
    expense && ratesState.rates && expense.currency !== baseCurrency
      ? convert(expense.amount, expense.currency, baseCurrency, ratesState.rates)
      : null

  const detailRows: { label: string; value: string }[] = []

  if (expense) {
    detailRows.push({
      label: 'Tipo',
      value: expense.type === 'fixed' ? 'Gasto fijo' : 'Gasto unico'
    })
    detailRows.push({
      label: 'Categoria',
      value: expense.category?.trim() || 'Sin categoria'
    })

    if (expense.type === 'fixed' && expense.recurrence) {
      detailRows.push({
        label: 'Repeticion',
        value: RECURRENCE_LABELS[expense.recurrence]
      })
    }

    if (expense.nextDueDate) {
      detailRows.push({ label: 'Proximo vencimiento', value: formatDate(expense.nextDueDate) })
    }

    if (expense.note?.trim()) {
      detailRows.push({ label: 'Nota', value: expense.note.trim() })
    }
  }

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-3 px-5 py-4">
        <Pressable onPress={() => router.back()} className="active:opacity-60">
          <Icon name="back" size={22} color="#6B6B66" />
        </Pressable>
        <Typography variant="title">Detalle del gasto</Typography>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 gap-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Typography variant="caption">Cargando...</Typography>
        ) : !expense ? (
          <Typography variant="body">Este gasto ya no existe.</Typography>
        ) : (
          <>
            <Card className="items-center gap-2 py-6">
              <View className="size-12 items-center justify-center rounded-full bg-accent-soft">
                <Icon
                  name={expense.type === 'fixed' ? 'repeat' : 'tag'}
                  size={22}
                  color="#2F6B4F"
                />
              </View>

              <Typography variant="title" className="text-center">
                {expense.name}
              </Typography>

              <Typography variant="display" numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(expense.amount, expense.currency)}
              </Typography>

              {montoConvertido !== null ? (
                <Typography variant="caption">{`≈ ${formatAmount(
                  montoConvertido,
                  baseCurrency
                )}`}</Typography>
              ) : null}
            </Card>

            <Card className="gap-3">
              {detailRows.map((row) => (
                <View key={row.label} className="flex-row items-start justify-between gap-4">
                  <Typography variant="caption" className="text-faint">
                    {row.label}
                  </Typography>
                  <Typography variant="body" className="flex-1 text-right">
                    {row.value}
                  </Typography>
                </View>
              ))}
            </Card>

            {expense.type === 'fixed' ? (
              <Card className="gap-3">
                <Typography variant="title" className="text-[16px]">
                  Historial de pagos
                </Typography>
                {expenseReceipts.length === 0 ? (
                  <Typography variant="caption" className="text-faint">
                    Aun no hay pagos registrados para este gasto.
                  </Typography>
                ) : (
                  <View className="gap-2.5">
                    {expenseReceipts.map((receipt) => (
                      <View
                        key={receipt.id}
                        className="flex-row items-center justify-between border-b border-line pb-2.5 last:border-b-0 last:pb-0"
                      >
                        <View className="gap-0.5">
                          <Typography variant="body" className="font-semibold">
                            {receipt.yearMonth}
                          </Typography>
                          <Typography variant="caption" className="text-faint">
                            {`Pagado el ${formatDate(receipt.paidAt.split('T')[0])}`}
                          </Typography>
                        </View>

                        <View className="flex-row items-center gap-3">
                          <Typography variant="body" className="font-medium text-accent">
                            {formatAmount(receipt.amount, receipt.currency)}
                          </Typography>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Deshacer pago de ${receipt.yearMonth}`}
                            onPress={() => setReceiptToRevert(receipt)}
                            hitSlop={8}
                            className="rounded-full p-1 active:opacity-60"
                          >
                            <Icon name="close" size={16} color="#6B6B66" />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            ) : null}

            <View className="gap-3">
              <Button
                label="Editar"
                icon="edit"
                fullWidth
                onPress={() =>
                  router.push({ pathname: '/edit-expense/[id]', params: { id: expense.id } })
                }
              />
              <Button
                label="Eliminar"
                icon="trash"
                variant="danger"
                fullWidth
                onPress={() => setDeleteConfirmationVisible(true)}
              />
            </View>
          </>
        )}
        {/* Espaciador con altura del area segura: evita style dinamico en el ScrollView */}
        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>

      {expense ? (
        <>
          <ConfirmDialog
            visible={deleteConfirmationVisible}
            title="Eliminar gasto"
            message={`Se eliminara "${expense.name}" de forma permanente.`}
            confirmLabel="Eliminar"
            destructive
            onConfirm={() => {
              setDeleteConfirmationVisible(false)
              void expensesState.removeExpense(expense.id).then(() => router.back())
            }}
            onCancel={() => setDeleteConfirmationVisible(false)}
          />

          <ConfirmDialog
            visible={receiptToRevert !== null}
            title="Deshacer pago"
            message={
              receiptToRevert
                ? `Deseas revertir el pago registrado para ${receiptToRevert.yearMonth}? El vencimiento retrocedera al periodo anterior.`
                : ''
            }
            confirmLabel="Deshacer pago"
            destructive
            onConfirm={() => {
              if (receiptToRevert && expense) {
                const target = receiptToRevert
                setReceiptToRevert(null)
                void expensesState.unmarkAsPaid(expense, target.yearMonth).then(async () => {
                  const [updatedReceipts, updatedExpense] = await Promise.all([
                    getExpenseReceiptsByExpense(expense.id),
                    getExpense(expense.id)
                  ])
                  setExpenseReceipts(updatedReceipts)
                  if (updatedExpense) setExpense(updatedExpense)
                })
              }
            }}
            onCancel={() => setReceiptToRevert(null)}
          />
        </>
      ) : null}
    </View>
  )
}
