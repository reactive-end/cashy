/**
 * Public types of the Pagination molecule.
 */

/** Propiedades del paginador */
export interface PaginationProps {
  /** Pagina actual (base 1) */
  page: number
  /** Total de paginas disponibles; minimo 1 */
  totalPages: number
  /** Callback al cambiar de pagina; recibe la pagina destino */
  onPageChange: (page: number) => void
}
