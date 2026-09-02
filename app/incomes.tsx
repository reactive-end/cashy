/**
 * Pantalla dedicada de Ingresos (app/incomes.tsx):
 * Administracion de fuentes de ingreso con busqueda, paginacion,
 * confirmacion de cobros pendientes y navegacion hacia el detalle.
 * La logica de enriquecimiento y busqueda reside en useIncomesScreen.
 */

import { useRouter } from 'expo-router'
import { Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { EmptyState } from '@src/components/molecules/EmptyState'
import { IncomeItem } from '@src/components/molecules/IncomeItem'
import { Pagination } from '@src/components/molecules/Pagination'
import { SearchBar } from '@src/components/molecules/SearchBar'
import { useIncomesScreen } from '@src/hooks/useIncomesScreen'
import { formatAmount } from '@src/lib/format'

export default function IncomesScreen() {
  const router = useRouter()
  const {
    searchText,
    handleSearchChange,
    handleSearch,
    currentPage,
    totalPages,
    setPage,
    paginatedRows,
    totalRowsCount,
    visiblePendingConfirmations,
    handleConfirmReceipt,
    refreshing,
    onRefresh,
    openCreateIncome,
    openIncomeDetail
  } = useIncomesScreen()

  return (
    <Screen scrollable refreshing={refreshing} onRefresh={onRefresh}>
      <View className="gap-6 pt-6 pb-12">
        {/* Cabecera con boton volver y titulo */}
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a Finanzas"
            onPress={() => router.back()}
            className="size-10 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
          >
            <Icon name="back" size={20} color="#1C1C1A" />
          </Pressable>
          <Typography variant="display">Ingresos</Typography>
        </View>

        {/* Cobros pendientes de confirmacion del mes */}
        {visiblePendingConfirmations.length > 0 ? (
          <Card className="border-accent/30 bg-accent-soft/40 gap-3">
            <View className="flex-row items-center gap-2">
              <Icon name="savings" size={18} color="#0D8A58" />
              <Typography variant="figure" className="text-accent">
                Cobros pendientes por confirmar
              </Typography>
            </View>

            <View className="gap-2">
              {visiblePendingConfirmations.map((income) => (
                <View
                  key={income.id}
                  className="flex-row items-center justify-between py-1.5 border-b border-accent/20 last:border-b-0"
                >
                  <View className="flex-1 min-w-0 pr-2">
                    <Typography variant="body" className="font-sans-semibold" numberOfLines={1}>
                      {income.name}
                    </Typography>
                    <Typography variant="caption" className="text-muted">
                      Dia {income.paydayDay} • {formatAmount(income.amount, income.currency)}
                    </Typography>
                  </View>

                  <Button
                    label="Recibido"
                    variant="primary"
                    onPress={() => void handleConfirmReceipt(income)}
                  />
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Busqueda y boton de nuevo ingreso */}
        <SearchBar
          value={searchText}
          onChangeText={handleSearchChange}
          onSearch={handleSearch}
          onAdd={openCreateIncome}
          placeholder="Buscar ingresos..."
          addAccessibilityLabel="Agregar ingreso"
        />

        {/* Lista paginada de ingresos */}
        {totalRowsCount === 0 ? (
          <Card>
            <EmptyState
              icon="savings"
              title={searchText ? 'Sin resultados' : 'Sin ingresos todavia'}
              message={
                searchText
                  ? 'No hay fuentes que coincidan con la busqueda.'
                  : 'Registra tus fuentes de ingreso habituales.'
              }
              action={
                !searchText ? (
                  <Button label="Agregar ingreso" icon="add" fullWidth onPress={openCreateIncome} />
                ) : undefined
              }
            />
          </Card>
        ) : (
          <View className="gap-3">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(next) => setPage(next)}
            />

            <Card>
              <View>
                {paginatedRows.map((row) => (
                  <IncomeItem
                    key={row.id}
                    testID={`income-item-${row.id}`}
                    name={row.name}
                    paydayDay={row.paydayDay}
                    formattedAmount={row.formattedAmount}
                    formattedOriginalAmount={row.formattedOriginalAmount}
                    isConfirmed={row.isConfirmed}
                    onPress={() => openIncomeDetail(row.id)}
                  />
                ))}
              </View>
            </Card>
          </View>
        )}
      </View>
    </Screen>
  )
}
