/**
 * Tipos publicos del componente AppLockGate.
 */

import type { ReactNode } from 'react'

/** Propiedades del organismo AppLockGate */
export interface AppLockGateProps {
  /** Elementos hijos que seran protegidos tras la autenticacion */
  children: ReactNode
}
