/**
 * Molecula FilterSheet: panel modal de filtros para el listado de
 * gastos. Ofrece chips multi-seleccion de categorias y monedas,
 * ordenacion por recientes, monto o nombre, y acciones limpiar y
 * aplicar. Sobre ModalBackdrop para mantener la estetica propia.
 */

import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Typography } from '@src/components/atoms/Typography'
import { ModalBackdrop } from '@src/components/molecules/ModalBackdrop'
import type { Currency } from '@src/types/domain'

import type { ExpenseSortOrder, FilterSheetProps } from './FilterSheet.d'

/** Etiquetas visibles de cada criterio de ordenacion */
const SORT_LABELS: Record<ExpenseSortOrder, string> = {
  recent: 'Mas recientes',
  amountDesc: 'Mayor monto',
  amountAsc: 'Menor monto',
  name: 'Nombre A-Z'
}

/** Ordenes disponibles en el panel */
const SORT_OPTIONS = Object.keys(SORT_LABELS) as ExpenseSortOrder[]

interface ChipProps {
  label: string
  selected: boolean
  onPress: () => void
}

/**
 * Chip redondo de seleccion con tono acento al activarse.
 * @param props Etiqueta, estado y callback de pulsado
 * @returns Pastilla de filtro
 */
function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={`rounded-full border px-3.5 py-2 active:opacity-60 ${
        selected ? 'border-accent bg-accent' : 'border-line bg-card'
      }`}
      onPress={onPress}
    >
      <Typography variant="caption" className={selected ? 'text-white' : ''}>
        {label}
      </Typography>
    </Pressable>
  )
}

/**
 * Contenido del panel; se monta al abrir para que la seleccion
 * parta siempre de los filtros ya aplicados, sin efectos.
 * @param props Catalogos, valores actuales y callbacks de aplicar/cerrar
 * @returns Secciones de chips y acciones del panel
 */
function FilterSheetContent({
  categories,
  currencies,
  filters,
  sortOrder,
  onApply,
  onClose
}: FilterSheetProps) {
  const [draftCategories, setDraftCategories] = useState<string[]>(filters.categories)
  const [draftCurrencies, setDraftCurrencies] = useState<Currency[]>(filters.currencies)
  const [draftSortOrder, setDraftSortOrder] = useState<ExpenseSortOrder>(sortOrder)

  const toggleCategory = (category: string) => {
    setDraftCategories((current) =>
      current.includes(category)
        ? current.filter((value) => value !== category)
        : [...current, category]
    )
  }

  const toggleCurrency = (currency: Currency) => {
    setDraftCurrencies((current) =>
      current.includes(currency)
        ? current.filter((value) => value !== currency)
        : [...current, currency]
    )
  }

  const clearAll = () => {
    setDraftCategories([])
    setDraftCurrencies([])
    setDraftSortOrder('recent')
  }

  const confirm = () => {
    onApply({ categories: draftCategories, currencies: draftCurrencies }, draftSortOrder)
    onClose()
  }

  // Sets de busqueda: evitan .includes dentro del render de cada chip.
  const selectedCategories = new Set(draftCategories)
  const selectedCurrencies = new Set(draftCurrencies)

  return (
    <>
      <Typography variant="title">Filtros</Typography>

      <ScrollView className="mt-4 max-h-[420px]" showsVerticalScrollIndicator={false}>
        <View className="gap-5 pb-1">
          <View className="gap-2">
            <Typography variant="caption" className="text-faint">
              Categoria
            </Typography>
            <View className="flex-row flex-wrap gap-2">
              {categories.length === 0 ? (
                <Typography variant="caption">Sin categorias registradas</Typography>
              ) : (
                categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    selected={selectedCategories.has(category)}
                    onPress={() => toggleCategory(category)}
                  />
                ))
              )}
            </View>
          </View>

          <View className="gap-2">
            <Typography variant="caption" className="text-faint">
              Moneda
            </Typography>
            <View className="flex-row flex-wrap gap-2">
              {currencies.map((currency) => (
                <Chip
                  key={currency}
                  label={currency}
                  selected={selectedCurrencies.has(currency)}
                  onPress={() => toggleCurrency(currency)}
                />
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Typography variant="caption" className="text-faint">
              Ordenar por
            </Typography>
            <View className="flex-row flex-wrap gap-2">
              {SORT_OPTIONS.map((order) => (
                <Chip
                  key={order}
                  label={SORT_LABELS[order]}
                  selected={draftSortOrder === order}
                  onPress={() => setDraftSortOrder(order)}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="mt-5 flex-row items-center gap-3">
        <Button label="Limpiar" variant="secondary" onPress={clearAll} />
        <View className="flex-1">
          <Button label="Aplicar" fullWidth onPress={confirm} />
        </View>
      </View>
    </>
  )
}

/**
 * Renderiza el panel modal de filtros; el contenido se remonta en
 * cada apertura para reiniciar la seleccion desde los aplicados.
 * @param props Visibilidad, catalogos, valores actuales y callbacks
 * @returns Panel de filtros listo para usar en pantallas de listado
 */
export function FilterSheet(props: FilterSheetProps) {
  return (
    <ModalBackdrop visible={props.visible} onRequestClose={props.onClose}>
      {props.visible ? <FilterSheetContent {...props} /> : null}
    </ModalBackdrop>
  )
}
