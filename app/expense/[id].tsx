/**
 * ExpenseDetail screen: vista de solo lectura de un gasto concreto con
 * acciones de edicion, borrado y pago mensual.
 * La logica de datos, conversion y confirmacion reside en useExpenseDetail.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog'
import { useExpenseDetail } from '@src/hooks/useExpenseDetail'
import { formatAmount, formatDate } from '@src/lib/format'

/**
 * Pantalla de detalles de un gasto concreto con acciones de edicion y borrado.
 * @returns Vista de presentacion con tarjetas de resumen y dialogos
 */
export default function ExpenseDetail() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const {
    expense,
    expenseReceipts,
    loading,
    montoConvertido,
    baseCurrency,
    detailRows,
    marketDetails,
    isPaidThisMonth,
    deleteConfirmationVisible,
    setDeleteConfirmationVisible,
    receiptToRevert,
    setReceiptToRevert,
    markingPaid,
    openEdit,
    handleConfirmDelete,
    handleConfirmRevert,
    handleMarkAsPaid
  } = useExpenseDetail(id)

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

            {marketDetails ? (
              <Card className="gap-3">
                <View className="border-b border-line pb-3">
                  <View className="flex-row items-center gap-2">
                    <Icon name="shoppingBag" size={18} color="#2F6B4F" />
                    <Typography variant="title" className="text-[16px]">
                      Artículos de la compra
                    </Typography>
                  </View>
                  <View className="mt-2 self-start rounded-full bg-accent-soft px-2.5 py-0.5">
                    <Typography variant="caption" className="text-[11px] font-medium text-accent">
                      {`${marketDetails.items.length} ${
                        marketDetails.items.length === 1 ? 'artículo' : 'artículos'
                      }`}
                    </Typography>
                  </View>
                </View>

                <View className="divide-y divide-line/40">
                  {marketDetails.items.map((item, idx) => (
                    <View
                      key={`${item.name}-${idx}`}
                      className="flex-row items-center justify-between py-2.5"
                      testID={`market-item-row-${idx}`}
                    >
                      <View className="flex-1 pr-2">
                        <Typography variant="body" className="font-medium text-ink">
                          {item.name}
                        </Typography>
                        {item.quantity && item.quantity > 1 ? (
                          <Typography variant="caption" className="text-muted text-[12px]">
                            {`Cantidad: ${item.quantity}`}
                          </Typography>
                        ) : null}
                      </View>
                      {item.amountText ? (
                        <Typography variant="figure" className="font-sans-semibold text-accent">
                          {item.amountText}
                        </Typography>
                      ) : null}
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

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
              {expense.type === 'fixed' && !isPaidThisMonth ? (
                <Button
                  label="Marcar como pagado"
                  icon="check"
                  variant="primary"
                  fullWidth
                  loading={markingPaid}
                  onPress={() => void handleMarkAsPaid()}
                />
              ) : null}
              <Button label="Editar" icon="edit" fullWidth onPress={openEdit} />
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
            onConfirm={() => void handleConfirmDelete()}
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
            onConfirm={() => void handleConfirmRevert()}
            onCancel={() => setReceiptToRevert(null)}
          />
        </>
      ) : null}
    </View>
  )
}
