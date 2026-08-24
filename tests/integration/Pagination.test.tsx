/**
 * Pruebas de integracion de la molecula Pagination.
 */

import { fireEvent, render } from '@testing-library/react-native'

import { Pagination } from '@src/components/molecules/Pagination'

import { wait } from '../helpers/wait'

describe('Pagination', () => {
  it('deshabilita Anterior en la primera pagina y Siguiente en la ultima', async () => {
    const { getByRole } = await render(
      <Pagination page={1} totalPages={3} onPageChange={jest.fn()} />
    )

    expect(getByRole('button', { name: 'Pagina anterior' }).props.accessibilityState).toEqual({
      disabled: true
    })
    expect(getByRole('button', { name: 'Pagina siguiente' }).props.accessibilityState).toEqual({
      disabled: false
    })
  })

  it('muestra la barra de progreso solo con mas de una pagina', async () => {
    const { queryByTestId, rerender } = await render(
      <Pagination page={1} totalPages={3} onPageChange={jest.fn()} />
    )
    await wait(30)

    expect(queryByTestId('pagination-progress')).toBeTruthy()

    rerender(<Pagination page={1} totalPages={1} onPageChange={jest.fn()} />)
    await wait(30)

    expect(queryByTestId('pagination-progress')).toBeNull()
  })

  it('notifica la pagina destino al avanzar y retroceder', async () => {
    const onPageChange = jest.fn()
    const { getByText } = await render(
      <Pagination page={2} totalPages={3} onPageChange={onPageChange} />
    )

    fireEvent.press(getByText('Siguiente'))
    expect(onPageChange).toHaveBeenLastCalledWith(3)

    fireEvent.press(getByText('Anterior'))
    expect(onPageChange).toHaveBeenLastCalledWith(1)
  })
})
