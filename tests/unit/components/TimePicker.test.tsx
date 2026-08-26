/**
 * Pruebas unitarias del organismo TimePicker.
 * Verifica el flujo de dos pasos sobre la esfera (hora, luego
 * minutos), el periodo am/pm, el ajuste fino y la confirmacion.
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native'

import { TimePicker } from '@src/components/organisms/TimePicker'

const ETIQUETA = 'Hora del aviso'

async function montar(overrides: { hour?: number; minute?: number; onChange?: jest.Mock } = {}) {
  const onChange = overrides.onChange ?? jest.fn()

  const pantalla = await render(
    <TimePicker
      hour={overrides.hour ?? 9}
      minute={overrides.minute ?? 0}
      onChange={onChange}
      accessibilityLabel={ETIQUETA}
    />
  )

  return { ...pantalla, onChange }
}

describe('organismo TimePicker', () => {
  it('muestra en el campo la hora vigente con minutos', async () => {
    const { getByText, queryByText } = await montar({ hour: 19, minute: 30 })

    expect(getByText('7:30 p.m.')).toBeTruthy()
    expect(queryByText('Selecciona la hora')).toBeNull()
  })

  it('abre el reloj al presionar el campo y arranca en el paso de hora', async () => {
    const { getByLabelText, getByText, getByTestId, queryAllByText, findByTestId } = await montar({
      hour: 19,
      minute: 30
    })

    expect(queryAllByText('Selecciona la hora')).toHaveLength(0)

    fireEvent.press(getByLabelText(ETIQUETA))
    await findByTestId('timepicker-hour-12')

    expect(getByLabelText('Hora 7 p.m.')).toBeTruthy()
    expect(getByText('Toca la hora sobre la esfera')).toBeTruthy()
  })

  it('pasa al paso de minutos tras elegir una hora y permite ajuste fino', async () => {
    const { getByLabelText, getByTestId, getByText, findByTestId } = await montar({
      hour: 9,
      minute: 0
    })

    fireEvent.press(getByLabelText(ETIQUETA))
    await findByTestId('timepicker-hour-7')

    fireEvent.press(getByTestId('timepicker-hour-7'))
    await findByTestId('timepicker-minute-5')
    expect(getByText('Toca los minutos o afina con los botones')).toBeTruthy()

    fireEvent.press(getByTestId('timepicker-minute-5'))
    await waitFor(() => expect(getByText('05 min')).toBeTruthy())

    fireEvent.press(getByLabelText('-1 min'))
    await waitFor(() => expect(getByText('04 min')).toBeTruthy())

    fireEvent.press(getByLabelText('+1 min'))
    await waitFor(() => expect(getByText('05 min')).toBeTruthy())
  })

  it('confirma la combinacion elegida convirtiendo am/pm a 24 horas', async () => {
    const { getAllByText, getByLabelText, getByTestId, findByTestId, onChange } = await montar({
      hour: 9,
      minute: 0
    })

    fireEvent.press(getByLabelText(ETIQUETA))
    await findByTestId('timepicker-hour-7')

    fireEvent.press(getByLabelText('PM'))
    await waitFor(() => expect(getByLabelText('Hora 7 p.m.')).toBeTruthy())

    fireEvent.press(getByTestId('timepicker-hour-7'))
    await findByTestId('timepicker-minute-30')

    fireEvent.press(getByTestId('timepicker-minute-30'))
    await waitFor(() => expect(getAllByText('7:30 p.m.').length).toBeGreaterThan(0))

    fireEvent.press(getByLabelText('Aceptar'))

    expect(onChange).toHaveBeenCalledWith(19, 30)
    expect(getByLabelText(ETIQUETA)).toBeTruthy()
  })

  it('mediodia y medianoche se representan como 12 PM y 12 AM', async () => {
    const { getAllByText, getByLabelText, getByTestId, findByTestId, onChange } = await montar({
      hour: 12,
      minute: 0
    })

    expect(getAllByText('12:00 p.m.').length).toBeGreaterThan(0)

    fireEvent.press(getByLabelText(ETIQUETA))
    await findByTestId('timepicker-hour-12')

    fireEvent.press(getByLabelText('AM'))
    await waitFor(() => expect(getAllByText('12:00 a.m.').length).toBeGreaterThan(0))

    fireEvent.press(getByTestId('timepicker-hour-12'))
    await findByTestId('timepicker-minute-15')

    fireEvent.press(getByTestId('timepicker-minute-15'))
    await waitFor(() => expect(getAllByText('12:15 a.m.').length).toBeGreaterThan(0))
    fireEvent.press(getByLabelText('Aceptar'))

    expect(onChange).toHaveBeenCalledWith(0, 15)
  })

  it('cancelar cierra el reloj sin invocar onChange', async () => {
    const { getByLabelText, queryByText, onChange } = await montar()

    fireEvent.press(getByLabelText(ETIQUETA))
    await waitFor(() => expect(getByLabelText('Cancelar')).toBeTruthy())

    fireEvent.press(getByLabelText('Cancelar'))

    await waitFor(() => expect(queryByText('Selecciona la hora')).toBeNull())
    expect(onChange).not.toHaveBeenCalled()
  })
})
