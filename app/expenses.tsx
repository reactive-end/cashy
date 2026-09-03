/**
 * Pantalla dedicada de Gastos: gestion completa de gastos fijos y unicos,
 * busqueda por texto, filtros por categoria y moneda, paginacion y acceso a detalle.
 * La logica de filtrado, ordenamiento y paginacion reside en useExpensesScreen.
 */

import { useRouter } from 'expo-router'
import { Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { EmptyState } from '@src/components/molecules/EmptyState'
import { ExpenseItem } from '@src/components/molecules/ExpenseItem'
import { FilterSheet } from '@src/components/molecules/FilterSheet'
import { MonthNavigator } from '@src/components/molecules/MonthNavigator'
import { Pagination } from '@src/components/molecules/Pagination'
import { SearchBar } from '@src/components/molecules/SearchBar'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { useExpensesScreen } from '@src/hooks/useExpensesScreen'

export default function ExpensesScreen() {
  const router = useRouter()
  const {
    segment,
    handleSegmentChange,
    searchText,
    handleSearchChange,
    handleSearch,
    filterSheetVisible,
    setFilterSheetVisible,
    filters,
    setFilters,
    sortOrder,
    setSortOrder,
    activeFiltersCount,
    availableCategories,
    availableCurrencies,
    currentPage,
    totalPages,
    setPage,
    paginatedRows,
    totalRowsCount,
    refreshing,
    onRefresh,
    openExpenseDetail,
    openCreateExpense,
    selectedYearMonth,
    handleMonthChange,
    showAllMonths,
    toggleShowAllMonths
  } = useExpensesScreen()

  return (
    <Screen scrollable refreshing={refreshing} onRefresh={onRefresh}>
      <View className="gap-6 pt-6 pb-12">
        {/* Cabecera con boton volver, titulo y boton de filtros */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver a Finanzas"
              onPress={() => router.back()}
              className="size-10 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
            >
              <Icon name="back" size={20} color="#1C1C1A" />
            </Pressable>
            <Typography variant="display">Mis gastos</Typography>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtrar gastos"
            onPress={() => setFilterSheetVisible(true)}
            className="relative size-10 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
          >
            <Icon name="filter" size={18} color="#1C1C1A" />
            {activeFiltersCount > 0 ? (
              <View className="absolute -top-1 -right-1 size-4 items-center justify-center rounded-full bg-accent">
                <Typography variant="caption" className="text-[10px] text-white">
                  {activeFiltersCount}
                </Typography>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* Alternador Fijos / Unicos */}
        <SegmentedControl
          options={[
            { value: 'fixed', label: 'Fijos' },
            { value: 'unique', label: 'Unicos' }
          ]}
          value={segment}
          onChange={handleSegmentChange}
        />

        {/* Navegador de mes y alternador de periodo SOLO para gastos unicos */}
        {segment === 'unique' ? (
          <View className="gap-2.5">
            {!showAllMonths ? (
              <MonthNavigator
                currentYearMonth={selectedYearMonth}
                onMonthChange={handleMonthChange}
              />
            ) : null}

            <Button
              fullWidth
              variant="primary"
              label={showAllMonths ? 'Filtrar por mes' : 'Ver historial completo'}
              icon={showAllMonths ? 'calendar' : 'repeat'}
              onPress={toggleShowAllMonths}
            />
          </View>
        ) : null}

        {/* Busqueda con boton de agregar gasto nuevo */}
        <SearchBar
          value={searchText}
          onChangeText={handleSearchChange}
          onSearch={handleSearch}
          onAdd={openCreateExpense}
        />

        {/* Lista paginada de gastos */}
        {totalRowsCount === 0 ? (
          <Card>
            <EmptyState
              icon={segment === 'fixed' ? 'repeat' : 'tag'}
              title={
                searchText || activeFiltersCount > 0
                  ? 'Sin resultados'
                  : segment === 'fixed'
                    ? 'Sin gastos fijos'
                    : 'Sin gastos unicos'
              }
              message={
                searchText || activeFiltersCount > 0
                  ? 'Prueba modificando los filtros o el termino de busqueda.'
                  : segment === 'fixed'
                    ? 'Agrega tus suscripciones o servicios recurrentes.'
                    : 'Registra compras puntuales del dia a dia.'
              }
              action={
                !searchText && activeFiltersCount === 0 ? (
                  <Button
                    label="Registrar gasto"
                    icon="add"
                    fullWidth
                    onPress={openCreateExpense}
                  />
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
                  <ExpenseItem
                    key={row.id}
                    icon={row.icon}
                    name={row.name}
                    detail={row.detail}
                    formattedAmount={row.formattedAmount}
                    formattedOriginalAmount={row.formattedOriginalAmount}
                    badge={row.badge}
                    onPress={() => openExpenseDetail(row.id)}
                  />
                ))}
              </View>
            </Card>
          </View>
        )}
      </View>

      <FilterSheet
        visible={filterSheetVisible}
        categories={availableCategories}
        currencies={availableCurrencies}
        filters={filters}
        sortOrder={sortOrder}
        onApply={(newFilters, newSort) => {
          setFilters(newFilters)
          setSortOrder(newSort)
          setPage(1)
          setFilterSheetVisible(false)
        }}
        onClose={() => setFilterSheetVisible(false)}
      />
    </Screen>
  )
}
