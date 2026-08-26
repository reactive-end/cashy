/**
 * Pantalla de Detalle de Ingreso (app/income/[id].tsx): vista completa de una
 * fuente de ingreso con su dia de cobro, estado de cobro en el mes, accion de
 * marcar/desmarcar como recibido, edicion y eliminacion.
 */

import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Badge } from '@src/components/atoms/Badge'
import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog'
import { IncomeFormSheet } from '@src/components/molecules/IncomeFormSheet'
import type { IncomeDraft } from '@src/components/organisms/IncomeEditor'
import { getIncome } from '@src/db/incomes'
import { useIncomes } from '@src/hooks/useIncomes'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { convert } from '@src/lib/conversions'
import { formatAmount } from '@src/lib/format'
import { isValidIncomeRow } from '@src/lib/validation'
import type { BaseCurrency, Income } from '@src/types/domain'

export default function IncomeDetail() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [income, setIncome] = useState<Income | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false)

  // Estado de edicion modal
  const [editSheetVisible, setEditSheetVisible] = useState(false)
  const [incomeRow, setIncomeRow] = useState<IncomeDraft>({
    name: '',
    amountCents: 0,
    currency: 'USD',
    paydayDayText: ''
  })

  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const incomesState = useIncomes(ratesState.rates, baseCurrency)

  // Carga inicial y recarga al recibir foco tras una edicion
  useFocusEffect(
    useCallback(() => {
      let active = true

      if (typeof id === 'string') {
        getIncome(id).then((encontrado) => {
          if (!active) return
          setIncome(encontrado)
          setLoading(false)
        })
      }

      return () => {
        active = false
      }
    }, [id])
  )

  const isConfirmed = income ? incomesState.receipts.some((r) => r.incomeId === income.id) : false

  const montoConvertido =
    income && ratesState.rates && income.currency !== baseCurrency
      ? convert(income.amount, income.currency, baseCurrency, ratesState.rates)
      : null

  function openEdit(): void {
    if (!income) return
    setIncomeRow({
      name: income.name,
      amountCents: Math.round(income.amount * 100),
      currency: income.currency,
      paydayDayText: String(income.paydayDay)
    })
    setEditSheetVisible(true)
  }

  async function handleConfirmEdit(): Promise<void> {
    if (!income || !isValidIncomeRow(incomeRow)) return

    const content = {
      name: incomeRow.name.trim(),
      amount: incomeRow.amountCents / 100,
      currency: incomeRow.currency,
      paydayDay: Number.parseInt(incomeRow.paydayDayText.trim(), 10)
    }

    const updated = await incomesState.edit(income.id, content)
    setIncome(updated)
    setEditSheetVisible(false)
  }

  async function handleToggleReceipt(): Promise<void> {
    if (!income) return
    if (isConfirmed) {
      await incomesState.unconfirmReceipt(income.id)
    } else {
      await incomesState.confirmReceipt(income)
    }
  }

  const detailRows: { label: string; value: string }[] = []

  if (income) {
    detailRows.push({
      label: 'Concepto',
      value: income.name
    })
    detailRows.push({
      label: 'Dia de cobro',
      value: `Dia ${income.paydayDay} de cada mes`
    })
    detailRows.push({
      label: 'Moneda original',
      value: income.currency
    })
  }

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-3 px-5 py-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a Ingresos"
          onPress={() => router.back()}
          className="size-10 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
        >
          <Icon name="back" size={20} color="#1C1C1A" />
        </Pressable>
        <Typography variant="title">Detalle del ingreso</Typography>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 gap-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Typography variant="caption">Cargando...</Typography>
        ) : !income ? (
          <Typography variant="body">Este ingreso ya no existe.</Typography>
        ) : (
          <>
            <Card className="items-center gap-2 py-6">
              <View className="size-12 items-center justify-center rounded-full bg-accent-soft">
                <Icon name="savings" size={22} color="#0D8A58" />
              </View>

              <Typography variant="title" className="text-center">
                {income.name}
              </Typography>

              <Typography variant="display" numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(income.amount, income.currency)}
              </Typography>

              {montoConvertido !== null ? (
                <Typography variant="caption">{`≈ ${formatAmount(
                  montoConvertido,
                  baseCurrency
                )}`}</Typography>
              ) : null}

              <View className="pt-1">
                <Badge
                  text={isConfirmed ? 'Cobrado este mes' : 'Pendiente de cobro'}
                  tone={isConfirmed ? 'success' : 'neutral'}
                />
              </View>
            </Card>

            <Card className="gap-3">
              {detailRows.map((row) => (
                <View key={row.label} className="flex-row items-start justify-between gap-4">
                  <Typography variant="caption" className="text-faint">
                    {row.label}
                  </Typography>
                  <Typography variant="body" className="flex-1 text-right font-sans-semibold">
                    {row.value}
                  </Typography>
                </View>
              ))}
            </Card>

            {/* Acciones principales */}
            <View className="gap-3">
              <Button
                label={isConfirmed ? 'Desmarcar cobro recibido' : 'Marcar como recibido'}
                icon={isConfirmed ? 'close' : 'check'}
                variant={isConfirmed ? 'secondary' : 'primary'}
                fullWidth
                onPress={handleToggleReceipt}
              />

              <Button label="Editar" icon="edit" variant="secondary" fullWidth onPress={openEdit} />

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

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>

      {/* Modal de edicion */}
      <IncomeFormSheet
        visible={editSheetVisible}
        values={incomeRow}
        onChange={setIncomeRow}
        title="Editar ingreso"
        actionLabel="Guardar cambios"
        testIDBase="income-sheet"
        onConfirm={handleConfirmEdit}
        onClose={() => setEditSheetVisible(false)}
      />

      {/* Dialogo de confirmacion de borrado */}
      {income ? (
        <ConfirmDialog
          visible={deleteConfirmationVisible}
          title="Eliminar ingreso"
          message={`Se eliminara "${income.name}" de forma permanente.`}
          confirmLabel="Eliminar"
          destructive
          onConfirm={() => {
            setDeleteConfirmationVisible(false)
            void incomesState.remove(income.id).then(() => router.back())
          }}
          onCancel={() => setDeleteConfirmationVisible(false)}
        />
      ) : null}
    </View>
  )
}
