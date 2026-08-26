/**
 * Molecula Pagination: navegacion anterior/siguiente con botones tipo
 * pastilla, indicador de pagina resaltado y barra de progress fina.
 * Coherente con el sistema minimalista: bordes line, acento verde.
 */

import { Pressable, View } from 'react-native'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'

import type { PaginationProps } from './Pagination.d'

/**
 * Clases del boton pastilla segun su estado.
 * @param deshabilitado true cuando el boton no es pulsable
 * @returns Clases tailwind del boton
 */
function buttonClasses(disabled: boolean): string {
  return `h-10 flex-row items-center gap-1 rounded-full border px-4 active:opacity-60 ${
    disabled ? 'border-line opacity-40' : 'border-line bg-card'
  }`
}

/**
 * Renderiza la barra de paginacion: botones pastilla deshabilitables
 * en los extremos, pildora central "Pagina X de Y" en tono acento y
 * una barra de progress proporcional cuando hay mas de una pagina.
 * @param props Pagina actual, total de paginas y callback de cambio
 * @returns Barra de navegacion paginada para listas largas
 */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const safeTotal = Math.max(1, totalPages)
  const onFirstPage = page <= 1
  const onLastPage = page >= safeTotal
  const progress = Math.round((page / safeTotal) * 100)

  return (
    <View className="gap-2 pt-2">
      <View className="flex-row items-center justify-between gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pagina anterior"
          className={buttonClasses(onFirstPage)}
          disabled={onFirstPage}
          onPress={() => onPageChange(Math.max(1, page - 1))}
        >
          <Icon name="chevronLeft" size={16} color={onFirstPage ? COLORS.faint : COLORS.accent} />
          <Typography variant="body" className="text-[13px]">
            Anterior
          </Typography>
        </Pressable>

        <View className="min-w-[96px] items-center rounded-full bg-accent-soft px-4 py-1.5">
          <Typography variant="figure" className="text-[12px] text-accent">
            {`Página ${page} de ${safeTotal}`}
          </Typography>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pagina siguiente"
          className={buttonClasses(onLastPage)}
          disabled={onLastPage}
          onPress={() => onPageChange(Math.min(safeTotal, page + 1))}
        >
          <Typography variant="body" className="text-[13px]">
            Siguiente
          </Typography>
          <Icon name="chevronRight" size={16} color={onLastPage ? COLORS.faint : COLORS.accent} />
        </Pressable>
      </View>

      {safeTotal > 1 ? (
        <View
          testID="pagination-progress"
          className="h-1 w-full overflow-hidden rounded-full bg-line"
        >
          <View className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
        </View>
      ) : null}
    </View>
  )
}
