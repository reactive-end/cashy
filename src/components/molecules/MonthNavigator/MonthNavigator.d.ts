/**
 * Tipos publicos del componente MonthNavigator.
 */

export interface MonthNavigatorProps {
  /** Mes seleccionado actual en formato 'yyyy-mm' */
  currentYearMonth: string
  /** Callback invocado al cambiar de mes */
  onMonthChange: (nextYearMonth: string) => void
  /** Opcional: limite superior en formato 'yyyy-mm' */
  maxYearMonth?: string
  /** Identificador de pruebas */
  testID?: string
}
