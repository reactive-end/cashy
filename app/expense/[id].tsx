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
import { getExpense } from '@src/db/expenses'
import { useExpenses } from '@src/hooks/useExpenses'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { convert } from '@src/lib/conversions'
import { formatAmount, formatDate } from '@src/lib/format'
import { RECURRENCE_LABELS, type BaseCurrency, type Expense } from '@src/types/domain'

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
  const [loading, setLoading] = useState(true)
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)

  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const gastos = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)

  // Recarga en cada foco: al volver de la edicion el detalle refleja los cambios.
  useFocusEffect(
    useCallback(() => {
      let activo = true

      if (typeof id === 'string') {
        getExpense(id).then((encontrado) => {
          if (!activo) return
          setExpense(encontrado)
          setLoading(false)
        })
      }

      return () => {
        activo = false
      }
    }, [id])
  )

  const montoConvertido =
    expense && ratesState.rates && expense.currency !== baseCurrency
      ? convert(expense.amount, expense.currency, baseCurrency, ratesState.rates)
      : null

  const filas: { etiqueta: string; valor: string }[] = []

  if (expense) {
    filas.push({
      etiqueta: 'Tipo',
      valor: expense.type === 'fixed' ? 'Gasto fijo' : 'Gasto unico'
    })
    filas.push({
      etiqueta: 'Categoria',
      valor: expense.category?.trim() || 'Sin categoria'
    })

    if (expense.type === 'fixed' && expense.recurrence) {
      filas.push({
        etiqueta: 'Repeticion',
        valor: RECURRENCE_LABELS[expense.recurrence]
      })
    }

    if (expense.nextDueDate) {
      filas.push({ etiqueta: 'Proximo vencimiento', valor: formatDate(expense.nextDueDate) })
    }

    if (expense.note?.trim()) {
      filas.push({ etiqueta: 'Nota', valor: expense.note.trim() })
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
              {filas.map((fila) => (
                <View key={fila.etiqueta} className="flex-row items-start justify-between gap-4">
                  <Typography variant="caption" className="text-faint">
                    {fila.etiqueta}
                  </Typography>
                  <Typography variant="body" className="flex-1 text-right">
                    {fila.valor}
                  </Typography>
                </View>
              ))}
            </Card>

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
                onPress={() => setConfirmarBorrado(true)}
              />
            </View>
          </>
        )}
        {/* Espaciador con altura del area segura: evita style dinamico en el ScrollView */}
        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>

      {expense ? (
        <ConfirmDialog
          visible={confirmarBorrado}
          title="Eliminar gasto"
          message={`Se eliminara "${expense.name}" de forma permanente.`}
          confirmLabel="Eliminar"
          destructive
          onConfirm={() => {
            setConfirmarBorrado(false)
            void gastos.removeExpense(expense.id).then(() => router.back())
          }}
          onCancel={() => setConfirmarBorrado(false)}
        />
      ) : null}
    </View>
  )
}
