/**
 * Pruebas de integracion del formulario en modo edicion.
 * Cubren precarga de valores y el flujo de eliminacion con
 * confirmacion propia (sin Alert nativo).
 */

import { fireEvent, render } from '@testing-library/react-native'

import { ExpenseForm } from '@src/components/organisms/ExpenseForm'

import { wait } from '../helpers/wait'
import { buildFixedExpense } from '../helpers/factories'

describe('ExpenseForm en modo edicion', () => {
  it('precarga datos del gasto y muestra boton de eliminar', async () => {
    const pantalla = await render(
      <ExpenseForm initialExpense={buildFixedExpense()} onSave={jest.fn()} onDelete={jest.fn()} />
    )
    await wait(250)

    expect(pantalla.getByDisplayValue('Netflix')).toBeTruthy()
    expect(await pantalla.findByText('Eliminar gasto')).toBeTruthy()
  }, 15000)

  it('elimina solo tras confirmar en el dialogo propio', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined)
    const { getByText, queryByText } = await render(
      <ExpenseForm initialExpense={buildFixedExpense()} onSave={jest.fn()} onDelete={onDelete} />
    )
    await wait()

    fireEvent.press(getByText('Eliminar gasto'))
    await wait()

    expect(getByText('Esta accion no se puede deshacer.')).toBeTruthy()
    await wait()

    fireEvent.press(getByText('Cancelar'))
    await wait(120)

    expect(queryByText('Esta accion no se puede deshacer.')).toBeNull()
    expect(onDelete).not.toHaveBeenCalled()

    fireEvent.press(getByText('Eliminar gasto'))
    await wait()
    fireEvent.press(getByText('Eliminar'))
    await wait(150)

    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
