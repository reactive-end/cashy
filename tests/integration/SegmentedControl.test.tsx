/**
 * Pruebas de integracion del control segmentado.
 */

import { fireEvent, render } from '@testing-library/react-native'

import { SegmentedControl } from '@src/components/molecules/SegmentedControl'

const OPCIONES = [
  { value: 'a' as const, label: 'Primera' },
  { value: 'b' as const, label: 'Segunda' }
]

describe('SegmentedControl', () => {
  it('marca como seleccionada la opcion activa', async () => {
    const { getByLabelText } = await render(
      <SegmentedControl options={OPCIONES} value="b" onChange={jest.fn()} />
    )

    expect(getByLabelText('Primera').props.accessibilityState).toEqual({ selected: false })
    expect(getByLabelText('Segunda').props.accessibilityState).toEqual({ selected: true })
  })

  it('notifica la opcion elegida al cambiar', async () => {
    const onChange = jest.fn()
    const { getByText } = await render(
      <SegmentedControl options={OPCIONES} value="a" onChange={onChange} />
    )

    fireEvent.press(getByText('Segunda'))

    expect(onChange).toHaveBeenCalledWith('b')
  })
})
