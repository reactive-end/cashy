/**
 * Pruebas de integracion del calendario propio.
 * Verifican grilla, seleccion, navegacion mensual y fecha minima.
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native'

import { CalendarPicker } from '@src/components/organisms/CalendarPicker'

describe('CalendarPicker', () => {
  it('muestra el mes de la fecha inicial y los encabezados de semana', async () => {
    const { getByText } = await render(<CalendarPicker value="2026-08-10" onChange={jest.fn()} />)

    expect(getByText(/agosto de 2026/)).toBeTruthy()
    for (const dia of ['L', 'M', 'X', 'J', 'V', 'S', 'D']) {
      expect(getByText(dia)).toBeTruthy()
    }
  })

  it('notifica la fecha ISO del dia elegido', async () => {
    const onChange = jest.fn()
    const { getByText } = await render(<CalendarPicker value="2026-08-10" onChange={onChange} />)

    fireEvent.press(getByText('20'))

    expect(onChange).toHaveBeenCalledWith('2026-08-20')
  })

  it('navega entre meses con las flechas accesibles', async () => {
    const { getByText, getByLabelText } = await render(
      <CalendarPicker value="2026-08-10" onChange={jest.fn()} />
    )

    fireEvent.press(getByLabelText('Mes siguiente'))
    await waitFor(() => expect(getByText(/septiembre de 2026/)).toBeTruthy())

    fireEvent.press(getByLabelText('Mes anterior'))
    await waitFor(() => expect(getByText(/agosto de 2026/)).toBeTruthy())

    fireEvent.press(getByLabelText('Mes anterior'))
    await waitFor(() => expect(getByText(/julio de 2026/)).toBeTruthy())
  })

  it('bloquea dias anteriores a la fecha minima', async () => {
    const onChange = jest.fn()
    const { getByText } = await render(
      <CalendarPicker value="2026-08-20" minimumDate="2026-08-15" onChange={onChange} />
    )

    fireEvent.press(getByText('10'))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('expone etiquetas largas de dia para lectores de pantalla', async () => {
    const { getByLabelText } = await render(
      <CalendarPicker value="2026-08-10" onChange={jest.fn()} />
    )

    expect(getByLabelText('15 de agosto de 2026')).toBeTruthy()
  })
})
