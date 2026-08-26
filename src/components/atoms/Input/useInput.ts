/**
 * Logica del atomo Input: estado de foco y clases visuales derivadas.
 * Mantiene el componente de vista libre de decisiones de estilo condicional.
 */

import { useCallback, useState } from 'react'

/** Resultado expuesto por el hook para pintar el campo */
export interface InputVisualState {
  /** Clases del contenedor segun foco y error */
  containerClasses: string
  /** Clases del prefijo (se atenue sin foco) */
  prefixClasses: string
  /** Handlers de foco listos para pasar al TextInput */
  onFocus: () => void
  onBlur: () => void
}

/**
 * Administra el estado de foco del campo y deriva sus estilos.
 * @param hasError Indica si debe mostrarse el estado de error
 * @param disabled Indica si el campo esta inactivo
 * @returns Clases y handlers calculados
 */
export function useInput(hasError: boolean, disabled: boolean): InputVisualState {
  const [focused, setFocused] = useState(false)

  const onFocus = useCallback(() => setFocused(true), [])
  const onBlur = useCallback(() => setFocused(false), [])

  let borderClass = 'border-line'
  if (hasError) borderClass = 'border-danger'
  else if (focused && !disabled) borderClass = 'border-accent'

  const containerClasses = `flex-row items-center gap-2 rounded-xl border bg-card px-3.5 ${borderClass} ${
    disabled ? 'opacity-50' : ''
  }`

  const prefixClasses = focused ? 'text-accent' : 'text-faint'

  return { containerClasses, prefixClasses, onFocus, onBlur }
}
