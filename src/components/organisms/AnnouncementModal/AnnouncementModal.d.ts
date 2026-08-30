/**
 * Tipos para el organismo AnnouncementModal.
 */

import type { AppAnnouncement } from '@src/types/marketing'

/** Props del componente AnnouncementModal */
export interface AnnouncementModalProps {
  /** Indica si la modal debe mostrarse */
  visible: boolean
  /** Lista de comunicados activos a desplegar */
  announcements: AppAnnouncement[]
  /** Callback ejecutado al cerrar o descartar la modal */
  onDismiss: () => void
}
