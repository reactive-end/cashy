/**
 * Molecula SearchBar: campo de busqueda compacto con dos acciones de
 * icono a la derecha, buscar y agregar registro nuevo.
 * Diseno sin etiqueta, pensado para caberas de listado segmentado.
 */

import { Pressable, TextInput, View } from 'react-native'

import { Icon } from '@src/components/atoms/Icon'
import { COLORS } from '@src/constants/theme'

import type { SearchBarProps } from './SearchBar.d'

/**
 * Renderiza input de busqueda y botones de icono buscar y agregar.
 * @param props Valor, cambio de texto y callbacks de buscar/agregar
 * @returns Barra horizontal para encabezados de listas
 */
export function SearchBar({
  value,
  onChangeText,
  onSearch,
  onAdd,
  placeholder = 'Buscar gastos...',
  addAccessibilityLabel = 'Agregar gasto'
}: SearchBarProps) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-1 flex-row items-center rounded-xl border border-line bg-card px-3">
        <TextInput
          className="flex-1 py-2.5 font-sans text-[14px] text-ink"
          placeholder={placeholder}
          placeholderTextColor={COLORS.faint}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Buscar"
        className="size-10 items-center justify-center rounded-xl border border-line bg-card active:opacity-60"
        onPress={onSearch}
      >
        <Icon name="search" size={18} color={COLORS.ink} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={addAccessibilityLabel}
        className="size-10 items-center justify-center rounded-xl border border-line bg-card active:opacity-60"
        onPress={onAdd}
      >
        <Icon name="add" size={18} color={COLORS.accent} />
      </Pressable>
    </View>
  )
}
