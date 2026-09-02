/**
 * Pruebas unitarias para la molecula ConfirmDialog.
 * Verifica el renderizado de titulos, mensajes, botones y contenido hijo opcional.
 */

import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'

import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renderiza el titulo y mensaje cuando esta visible', async () => {
    await render(
      <ConfirmDialog
        visible={true}
        title="Título de prueba"
        message="Mensaje explicativo del diálogo"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    )

    expect(screen.getByText('Título de prueba')).toBeDefined()
    expect(screen.getByText('Mensaje explicativo del diálogo')).toBeDefined()
  })

  it('renderiza contenido hijo personalizado cuando se provee', async () => {
    await render(
      <ConfirmDialog
        visible={true}
        title="Actualización"
        message="Descargando nueva versión..."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      >
        <Text testID="custom-progress">Barra de progreso de prueba</Text>
      </ConfirmDialog>
    )

    expect(screen.getByTestId('custom-progress')).toBeDefined()
    expect(screen.getByText('Barra de progreso de prueba')).toBeDefined()
  })
})
