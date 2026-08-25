/**
 * Pruebas unitarias del atomo Switch.
 * Valida accesibilidad, estados y notificacion del cambio.
 */

import { fireEvent, render } from '@testing-library/react-native'

import { Switch } from '@src/components/atoms/Switch'

describe('atomo Switch', () => {
  it('expone rol switch con su etiqueta de accesibilidad', async () => {
    const { getByRole } = await render(
      <Switch value={false} onValueChange={jest.fn()} accessibilityLabel="Activar avisos" />
    )

    expect(getByRole('switch', { name: 'Activar avisos' })).toBeTruthy()
  })

  it('refleja el estado inicial en accesibilidad', async () => {
    const { getByRole } = await render(
      <Switch value={true} onValueChange={jest.fn()} accessibilityLabel="Activar avisos" />
    )

    expect(getByRole('switch', { checked: true })).toBeTruthy()
  })

  it('notifica el nuevo estado al alternar', async () => {
    const onValueChange = jest.fn()
    const { getByRole } = await render(
      <Switch value={false} onValueChange={onValueChange} accessibilityLabel="Activar avisos" />
    )

    fireEvent(getByRole('switch'), 'valueChange', true)

    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('propaga el bloqueo al interruptor nativo cuando esta deshabilitado', async () => {
    const onValueChange = jest.fn()
    const { getByRole } = await render(
      <Switch
        value={false}
        onValueChange={onValueChange}
        disabled
        accessibilityLabel="Activar avisos"
      />
    )

    expect(getByRole('switch').props.disabled).toBe(true)
  })
})
