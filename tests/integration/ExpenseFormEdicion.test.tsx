/**
 * Pruebas de integracion del formulario en modo edicion.
 * Cubren precarga de valores y el flujo de eliminacion con
 * confirmacion propia (sin Alert nativo).
 */

import { fireEvent, render } from '@testing-library/react-native'

import { ExpenseForm } from '@src/components/organisms/ExpenseForm'

import { espera } from '../helpers/espera'
import { buildFixedExpense } from '../helpers/factories'

describe('ExpenseForm en modo edicion', () => {
  it('precarga datos del gasto y muestra boton de eliminar', async () => {
    const pantalla = await render(
      <ExpenseForm initialExpense={buildFixedExpense()} onSave={jest.fn()} onDelete={jest.fn()} />
    )
    await espera(250)

    expect(pantalla.getByDisplayValue('Netflix')).toBeTruthy()
    expect(await pantalla.findByText('Eliminar gasto')).toBeTruthy()
  }, 15000)

  it('elimina solo tras confirmar en el dialogo propio', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined)
    const { getByText, queryByText } = await render(
      <ExpenseForm initialExpense={buildFixedExpense()} onSave={jest.fn()} onDelete={onDelete} />
    )
    await espera()

    fireEvent.press(getByText('Eliminar gasto'))
    await espera()

    expect(getByText('Esta accion no se puede deshacer.')).toBeTruthy()
    await espera()

    fireEvent.press(getByText('Cancelar'))
    await espera(120)

    expect(queryByText('Esta accion no se puede deshacer.')).toBeNull()
    expect(onDelete).not.toHaveBeenCalled()

    fireEvent.press(getByText('Eliminar gasto'))
    await espera()
    fireEvent.press(getByText('Eliminar'))
    await espera(150)

    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
