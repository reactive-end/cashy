/**
 * Stub de lucide-react-native para entorno Jest.
 * Los iconos se reducen a vistas vacias etiquetadas; evita
 * transformar el bundle ESM del paquete en pruebas.
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'

interface LucideStubProps {
  size?: number
  color?: string
  strokeWidth?: number
  fill?: string
  children?: ReactNode
}

/**
 * Fabrica de componentes-icono inertes para el arbol de prueba.
 * @param nombre Identificador visible en el arbol depurado
 */
function crearIcono(nombre: string) {
  return function IconoFalso(_props: LucideStubProps) {
    return <View testID={`lucide-${nombre}`} />
  }
}

export const House = crearIcono('house')
export const ReceiptText = crearIcono('receipt-text')
export const Settings = crearIcono('settings')
export const Plus = crearIcono('plus')
export const CalendarDays = crearIcono('calendar-days')
export const BellRing = crearIcono('bell-ring')
export const CircleDollarSign = crearIcono('circle-dollar')
export const Euro = crearIcono('euro')
export const Coins = crearIcono('coins')
export const Pencil = crearIcono('pencil')
export const Trash2 = crearIcono('trash')
export const ArrowLeft = crearIcono('arrow-left')
export const X = crearIcono('x')
export const Check = crearIcono('check')
export const TriangleAlert = crearIcono('triangle-alert')
export const RefreshCw = crearIcono('refresh')
export const Tag = crearIcono('tag')
export const Repeat = crearIcono('repeat')
export const PiggyBank = crearIcono('piggy-bank')
export const ChevronLeft = crearIcono('chevron-left')
export const ChevronRight = crearIcono('chevron-right')
export const Search = crearIcono('search')
export const ChartColumn = crearIcono('chart-column')
export const SlidersHorizontal = crearIcono('sliders-horizontal')
export const Calculator = crearIcono('calculator')
