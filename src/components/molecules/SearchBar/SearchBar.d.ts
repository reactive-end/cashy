/**
 * Tipos publicos de la molecula SearchBar.
 */

/** Propiedades de la barra de busqueda con acciones */
export interface SearchBarProps {
  /** Texto actual del campo de busqueda */
  value: string
  /** Cambio del texto mientras se escribe */
  onChangeText: (texto: string) => void
  /** Aplica el texto escrito como filtro de busqueda */
  onSearch: () => void
  /** Abre el flujo de creacion de un registro nuevo */
  onAdd: () => void
}
