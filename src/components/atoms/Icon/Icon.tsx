/**
 * Atomo Icon: envoltorio unico sobre lucide-react-native.
 * Garantiza iconografia outlined consistente y evita importar
 * Lucide directamente en pantallas y moleculas.
 */

import {
  House,
  ReceiptText,
  Settings,
  Plus,
  CalendarDays,
  BellRing,
  CircleDollarSign,
  Euro,
  Coins,
  Pencil,
  Trash2,
  ArrowLeft,
  X,
  Check,
  TriangleAlert,
  RefreshCw,
  Tag,
  Repeat,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  Search,
  ChartColumn,
  SlidersHorizontal,
  Calculator,
  Clock,
  UserRound,
  Wallet,
  type LucideIcon
} from 'lucide-react-native'
import { memo } from 'react'

import type { IconName, IconProps } from './Icon.d'

/** Registro tipado de nombre de catalogo a componente Lucide */
const ICON_REGISTRY: Readonly<Record<IconName, LucideIcon>> = {
  home: House,
  expenses: ReceiptText,
  settings: Settings,
  add: Plus,
  calendar: CalendarDays,
  bell: BellRing,
  dollar: CircleDollarSign,
  euro: Euro,
  usdt: Coins,
  edit: Pencil,
  trash: Trash2,
  back: ArrowLeft,
  close: X,
  check: Check,
  alert: TriangleAlert,
  refresh: RefreshCw,
  tag: Tag,
  repeat: Repeat,
  savings: PiggyBank,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  search: Search,
  chart: ChartColumn,
  filter: SlidersHorizontal,
  calculator: Calculator,
  clock: Clock,
  user: UserRound,
  wallet: Wallet
}

/**
 * Renderiza el icono solicitado con trazo outlined fino.
 * @param props Nombre del icono, tamano, color y grosor opcionales
 * @returns Icono vectorial listo para usar en cualquier superficie
 */
function IconBase({ name, size = 20, color, strokeWidth = 1.75 }: IconProps) {
  const IconComponent = ICON_REGISTRY[name]
  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />
}

/**
 * Atomo Icon memorizado para evitar re-renderizados innecesarios en listas.
 */
export const Icon = memo(IconBase)
