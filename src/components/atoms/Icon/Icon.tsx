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
  Minus,
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
  ChevronDown,
  Search,
  ChartColumn,
  SlidersHorizontal,
  Calculator,
  Clock,
  Copy,
  UserRound,
  Wallet,
  Eye,
  EyeOff,
  Lock,
  Shield,
  ShoppingBag,
  Building2,
  Info,
  Laptop,
  Moon,
  Sun,
  type LucideIcon
} from 'lucide-react-native'
import { memo } from 'react'

import { DARK_COLORS, LIGHT_COLORS, type ThemeColors } from '@src/constants/theme'
import { useTheme } from '@src/hooks/useTheme'

import type { IconName, IconProps } from './Icon.d'

/** Registro tipado de nombre de catalogo a componente Lucide */
const ICON_REGISTRY: Readonly<Record<IconName, LucideIcon>> = {
  home: House,
  expenses: ReceiptText,
  settings: Settings,
  add: Plus,
  minus: Minus,
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
  chevronDown: ChevronDown,
  search: Search,
  chart: ChartColumn,
  filter: SlidersHorizontal,
  calculator: Calculator,
  clock: Clock,
  copy: Copy,
  user: UserRound,
  wallet: Wallet,
  eye: Eye,
  eyeOff: EyeOff,
  lock: Lock,
  shield: Shield,
  shoppingBag: ShoppingBag,
  building: Building2,
  info: Info,
  moon: Moon,
  sun: Sun,
  laptop: Laptop
}

/**
 * Renderiza el icono solicitado con trazo outlined fino y resolucion
 * automatica de contraste para modo claro y modo oscuro.
 * @param props Nombre del icono, tamano, color y grosor opcionales
 * @returns Icono vectorial listo para usar en cualquier superficie
 */
function IconBase({ name, size = 20, color, strokeWidth = 1.75 }: IconProps) {
  const { colors, isDark } = useTheme()

  let resolvedColor = typeof color === 'string' ? color : undefined
  if (!resolvedColor) {
    resolvedColor = colors.ink
  } else if (resolvedColor in colors) {
    resolvedColor = colors[resolvedColor as keyof ThemeColors]
  } else if (isDark) {
    if (
      resolvedColor === LIGHT_COLORS.ink ||
      resolvedColor === '#1C1C1A' ||
      resolvedColor === '#1c1c1a'
    ) {
      resolvedColor = DARK_COLORS.ink
    } else if (
      resolvedColor === LIGHT_COLORS.muted ||
      resolvedColor === '#6B6B66' ||
      resolvedColor === '#6b6b66'
    ) {
      resolvedColor = DARK_COLORS.muted
    } else if (
      resolvedColor === LIGHT_COLORS.faint ||
      resolvedColor === '#70706A' ||
      resolvedColor === '#70706a'
    ) {
      resolvedColor = DARK_COLORS.faint
    } else if (
      resolvedColor === LIGHT_COLORS.accent ||
      resolvedColor === '#2F6B4F' ||
      resolvedColor === '#2f6b4f'
    ) {
      resolvedColor = DARK_COLORS.accent
    } else if (
      resolvedColor === LIGHT_COLORS.warn ||
      resolvedColor === '#7E6229' ||
      resolvedColor === '#7e6229'
    ) {
      resolvedColor = DARK_COLORS.warn
    } else if (
      resolvedColor === LIGHT_COLORS.danger ||
      resolvedColor === '#A63D3D' ||
      resolvedColor === '#a63d3d'
    ) {
      resolvedColor = DARK_COLORS.danger
    }
  }

  const IconComponent = ICON_REGISTRY[name]
  return <IconComponent size={size} color={resolvedColor} strokeWidth={strokeWidth} />
}

/**
 * Atomo Icon memorizado para evitar re-renderizados innecesarios en listas.
 */
export const Icon = memo(IconBase)
