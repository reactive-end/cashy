/**
 * Pruebas unitarias de la molecula HourPicker.
 * Valida el campo, la apertura del modal, la seleccion de horas
 * y el bloqueo cuando esta deshabilitado.
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native'

import { HourPicker } from '@src/components/molecules/HourPicker'
import { wait } from '../../helpers/wait'

const ETIQUETA = 'Hora de prueba'

describe('molecula HourPicker', () => {
  it('muestra la hora vigente en formato 12 horas', async () => {
    const { getByText } = await render(
      <HourPicker value={9} onChange={jest.fn()} accessibilityLabel={ETIQUETA} />
    )

    expect(getByText('9:00 a.m.')).toBeTruthy()
  })

  it('abre el modal con la lista completa de horas y marca la seleccionada', async () => {
    const { getByLabelText, findByRole, findAllByRole, findByText } = await render(
      <HourPicker value={9} onChange={jest.fn()} accessibilityLabel={ETIQUETA} />
    )

    fireEvent.press(getByLabelText(ETIQUETA))

    expect(await findByText('Selecciona la hora')).toBeTruthy()

    // Campo + 24 opciones de hora
    expect((await findAllByRole('button')).length).toBe(25)
    expect(await findByRole('button', { name: '9:00 a.m.', selected: true })).toBeTruthy()
    expect(await findByRole('button', { name: '10:00 a.m.', selected: false })).toBeTruthy()
  })

  it('notifica la hora elegida y cierra el modal', async () => {
    const onChange = jest.fn()
    const pantalla = await render(
      <HourPicker value={9} onChange={onChange} accessibilityLabel={ETIQUETA} />
    )

    fireEvent.press(pantalla.getByLabelText(ETIQUETA))
    fireEvent.press(await pantalla.findByRole('button', { name: '1:00 p.m.' }))

    expect(onChange).toHaveBeenCalledWith(13)
    await waitFor(() => expect(pantalla.queryByText('Selecciona la hora')).toBeNull())
  })

  it('no abre el modal cuando esta deshabilitado', async () => {
    const pantalla = await render(
      <HourPicker value={9} onChange={jest.fn()} disabled accessibilityLabel={ETIQUETA} />
    )

    fireEvent.press(pantalla.getByLabelText(ETIQUETA))
    await wait(100)

    expect(pantalla.queryByText('Selecciona la hora')).toBeNull()
  })
})
