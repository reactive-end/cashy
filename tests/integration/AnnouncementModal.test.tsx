/**
 * Pruebas de integracion para el organismo AnnouncementModal.
 */

import { render, userEvent } from '@testing-library/react-native'
import { Linking } from 'react-native'

import { AnnouncementModal } from '@src/components/organisms/AnnouncementModal'
import type { AppAnnouncement } from '@src/types/marketing'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, navigate: mockPush })
}))

const sampleAnnouncements: AppAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Actualización Importante',
    message: 'Hemos mejorado la velocidad. Más detalles en https://cashy.app/docs',
    category: 'news',
    tone: 'accent',
    display_type: 'modal',
    is_dismissible: true,
    target_plan: 'all',
    priority: 10,
    is_active: true,
    primary_cta_label: 'Saber más',
    primary_cta_action: 'url',
    primary_cta_payload: 'https://cashy.app/blog'
  },
  {
    id: 'ann-2',
    title: 'Mantenimiento de Tasas',
    message: 'El fin de semana habrá mantenimiento programado.',
    category: 'maintenance',
    tone: 'warning',
    display_type: 'modal',
    is_dismissible: true,
    target_plan: 'all',
    priority: 5,
    is_active: true
  }
]

describe('AnnouncementModal', () => {
  const onDismissMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true)
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)
  })

  it('no renderiza nada si visible es false o la lista esta vacia', async () => {
    const { toJSON: toJSON1 } = await render(
      <AnnouncementModal
        visible={false}
        announcements={sampleAnnouncements}
        onDismiss={onDismissMock}
      />
    )
    expect(toJSON1()).toBeNull()

    const { toJSON: toJSON2 } = await render(
      <AnnouncementModal visible={true} announcements={[]} onDismiss={onDismissMock} />
    )
    expect(toJSON2()).toBeNull()
  })

  it('muestra el primer comunicado y permite avanzar y retroceder en carrusel', async () => {
    const screen = await render(
      <AnnouncementModal
        visible={true}
        announcements={sampleAnnouncements}
        onDismiss={onDismissMock}
      />
    )
    const user = userEvent.setup()

    expect(screen.getByText('Actualización Importante')).toBeTruthy()
    expect(screen.getByText('1 de 2')).toBeTruthy()

    // Avanza a la segunda noticia
    await user.press(screen.getByText('Siguiente'))

    expect(screen.getByText('Mantenimiento de Tasas')).toBeTruthy()
    expect(screen.getByText('2 de 2')).toBeTruthy()

    // Retrocede a la primera noticia
    await user.press(screen.getByText('Anterior'))

    expect(screen.getByText('Actualización Importante')).toBeTruthy()
    expect(screen.getByText('1 de 2')).toBeTruthy()
  })

  it('cierra la modal al pulsar el boton de cerrar X en la cabecera', async () => {
    const screen = await render(
      <AnnouncementModal
        visible={true}
        announcements={sampleAnnouncements}
        onDismiss={onDismissMock}
      />
    )
    const user = userEvent.setup()

    const closeBtn = screen.getByLabelText('Cerrar ventana de comunicados')
    await user.press(closeBtn)

    expect(onDismissMock).toHaveBeenCalledTimes(1)
  })

  it('abre enlace clickeable embebido en el texto del mensaje', async () => {
    const screen = await render(
      <AnnouncementModal
        visible={true}
        announcements={sampleAnnouncements}
        onDismiss={onDismissMock}
      />
    )
    const user = userEvent.setup()

    const linkText = screen.getByLabelText('Enlace a https://cashy.app/docs')
    await user.press(linkText)

    expect(Linking.canOpenURL).toHaveBeenCalledWith('https://cashy.app/docs')
    expect(Linking.openURL).toHaveBeenCalledWith('https://cashy.app/docs')
  })

  it('ejecuta la accion del boton primario y descarta la modal', async () => {
    const screen = await render(
      <AnnouncementModal
        visible={true}
        announcements={sampleAnnouncements}
        onDismiss={onDismissMock}
      />
    )
    const user = userEvent.setup()

    await user.press(screen.getByText('Saber más'))

    expect(Linking.openURL).toHaveBeenCalledWith('https://cashy.app/blog')
    expect(onDismissMock).toHaveBeenCalledTimes(1)
  })
})
