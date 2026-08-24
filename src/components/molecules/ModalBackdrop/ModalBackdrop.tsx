/**
 * Molecula ModalBackdrop: contenedor modal propio del proyecto.
 * Compone el Modal de React Native con un velo oscurecido y una
 * tarjeta estilo papel, reemplazando los dialogos nativos del sistema.
 */

import { Modal, Pressable, View } from 'react-native'

import type { ModalBackdropProps } from './ModalBackdrop.d'

/** Handler vacio para bloquear la propagacion del toque al velo */
const STOP_PROPAGATION = () => undefined

/**
 * Renderiza el modal centrado con fondo atenuado.
 * Un toque sobre el velo invoca onRequestClose para cerrarlo,
 * mientras el contenido interior bloquea el cierre accidental.
 * @param props Visibilidad, callback de cierre y contenido
 * @returns Superficie modal alineada con la estetica minimalista
 */
export function ModalBackdrop({ visible, onRequestClose, children }: ModalBackdropProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Pressable
        onPress={onRequestClose}
        className="flex-1 items-center justify-center bg-ink/40 px-6"
      >
        <Pressable onPress={STOP_PROPAGATION} className="w-full max-w-sm">
          <View className="rounded-2xl border border-line bg-card p-5">{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
