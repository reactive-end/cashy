/**
 * Pantalla de Detalle de Ingreso (app/income/[id].tsx): vista completa de una
 * fuente de ingreso con su dia de cobro, estado de cobro en el mes, accion de
 * marcar/desmarcar como recibido, edicion y eliminacion.
 * La logica de datos, conversiones y mutaciones reside en useIncomeDetail.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Badge } from '@src/components/atoms/Badge'
import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog'
import { useIncomeDetail } from '@src/hooks/useIncomeDetail'
import { formatAmount } from '@src/lib/format'

export default function IncomeDetail() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const {
    income,
    loading,
    isConfirmed,
    montoConvertido,
    baseCurrency,
    detailRows,
    deleteConfirmationVisible,
    setDeleteConfirmationVisible,
    openEdit,
    handleToggleReceipt,
    handleConfirmDelete
  } = useIncomeDetail(id)

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

              <View className="mt-1">
                {isConfirmed ? (
                  <Badge text="Cobro registrado este mes" tone="success" />
                ) : (
                  <Badge text="Pendiente de cobro" tone="neutral" />
                )}
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
                onPress={() => void handleToggleReceipt()}
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

      {/* Dialogo de confirmacion de borrado */}
      {income ? (
        <ConfirmDialog
          visible={deleteConfirmationVisible}
          title="Eliminar ingreso"
          message={`Se eliminara "${income.name}" de forma permanente.`}
          confirmLabel="Eliminar"
          destructive
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => setDeleteConfirmationVisible(false)}
        />
      ) : null}
    </View>
  )
}
