/**
 * Pruebas de integracion del formulario de gastos en modo creacion.
 * Cubren validacion, parseo regional y el modo fijo con calendario propio.
 */

import { fireEvent, render } from '@testing-library/react-native'

import { ExpenseForm } from '@src/components/organisms/ExpenseForm'

import { wait } from '../helpers/wait'

describe('ExpenseForm en modo creacion', () => {
  it('oculta recurrencia y fecha para gastos unicos', async () => {
    const { queryByText } = await render(<ExpenseForm onSave={jest.fn()} />)

    expect(queryByText('Proximo vencimiento')).toBeNull()
  })

  it('muestra errores al guardar sin datos y los limpia al corregir', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)
    const { getByText, getByLabelText } = await render(<ExpenseForm onSave={onSave} />)

    fireEvent.press(getByText('Registrar gasto'))
    await wait()

    expect(getByText('Ponle un nombre al gasto')).toBeTruthy()
    expect(getByText('Ingresa un monto mayor que cero')).toBeTruthy()

    fireEvent.changeText(getByLabelText('Nombre'), 'Cafe')
    await wait()
    fireEvent.changeText(getByLabelText('Monto'), '350')
    await wait()
    fireEvent.press(getByText('Registrar gasto'))
    await wait(120)

    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('parsea monto con coma decimal y moneda USDT', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)
    const { getByText, getByLabelText } = await render(<ExpenseForm onSave={onSave} />)

    fireEvent.changeText(getByLabelText('Nombre'), 'Reloj')
    await wait()
    fireEvent.changeText(getByLabelText('Monto'), '1250')
    await wait()
    fireEvent.press(getByText('USDT'))
    await wait()
    fireEvent.press(getByText('Registrar gasto'))
    await wait(120)

    expect(onSave).toHaveBeenCalledWith({
      name: 'Reloj',
      amount: 12.5,
      currency: 'USDT',
      type: 'unique',
      category: undefined,
      note: undefined
    })
  })

  it('al elegir Fijo revela repeticion, fecha y abre el calendario propio', async () => {
    const { getByText, getByTestId, queryByText } = await render(<ExpenseForm onSave={jest.fn()} />)

    fireEvent.press(getByText('Fijo'))
    await wait()

    expect(getByText('Repeticion')).toBeTruthy()

    fireEvent.press(getByTestId('due-date-trigger'))
    await wait()

    expect(getByText('Elegir fecha')).toBeTruthy()

    fireEvent.press(getByText('15'))
    await wait()

    expect(queryByText('Elegir fecha')).toBeNull()
  })
})
