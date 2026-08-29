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
function createIcon(nombre: string) {
  return function FakeIcon(_props: LucideStubProps) {
    return <View testID={`lucide-${nombre}`} />
  }
}

export const House = createIcon('house')
export const ReceiptText = createIcon('receipt-text')
export const Settings = createIcon('settings')
export const Plus = createIcon('plus')
export const CalendarDays = createIcon('calendar-days')
export const BellRing = createIcon('bell-ring')
export const CircleDollarSign = createIcon('circle-dollar')
export const Euro = createIcon('euro')
export const Coins = createIcon('coins')
export const Pencil = createIcon('pencil')
export const Trash2 = createIcon('trash')
export const ArrowLeft = createIcon('arrow-left')
export const X = createIcon('x')
export const Check = createIcon('check')
export const TriangleAlert = createIcon('triangle-alert')
export const RefreshCw = createIcon('refresh')
export const Tag = createIcon('tag')
export const Repeat = createIcon('repeat')
export const PiggyBank = createIcon('piggy-bank')
export const ChevronLeft = createIcon('chevron-left')
export const ChevronRight = createIcon('chevron-right')
export const Search = createIcon('search')
export const ChartColumn = createIcon('chart-column')
export const SlidersHorizontal = createIcon('sliders-horizontal')
export const Calculator = createIcon('calculator')
export const Clock = createIcon('clock')
export const Wallet = createIcon('wallet')
export const UserRound = createIcon('user-round')
export const Copy = createIcon('copy')
export const Eye = createIcon('eye')
export const EyeOff = createIcon('eye-off')
export const Lock = createIcon('lock')
export const Shield = createIcon('shield')
export const ShoppingBag = createIcon('shopping-bag')
