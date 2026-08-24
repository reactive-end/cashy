/**
 * Pruebas de accesibilidad sobre componentes interactivos.
 * Garantizan roles, etiquetas y estados expuestos a lectores
 * de pantalla en todos los controles del proyecto.
 */

import { render } from '@testing-library/react-native'

import { Button } from '@src/components/atoms/Button'
import { Input } from '@src/components/atoms/Input'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { CalendarPicker } from '@src/components/organisms/CalendarPicker'
import { ExpenseForm } from '@src/components/organisms/ExpenseForm'
import { getExpenses } from '@src/db/expenses'
import { loadSettings } from '@src/db/settings'
import { getExchangeRates } from '@src/services/rates'

import Home from '../../app/(tabs)/index'
import { espera } from '../helpers/espera'
import {
  buildFixedExpense,
  buildRates,
  buildSettings,
  buildUniqueExpense
} from '../helpers/factories'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ push: (ruta: string) => mockPush(ruta) }) }))
jest.mock('@src/services/rates')
jest.mock('@src/db/expenses')
jest.mock('@src/db/settings')

beforeEach(() => {
  jest.clearAllMocks()
  ;(getExchangeRates as jest.Mock).mockResolvedValue(buildRates())
  ;(loadSettings as jest.Mock).mockResolvedValue(buildSettings())
  ;(getExpenses as jest.Mock).mockResolvedValue([buildFixedExpense(), buildUniqueExpense()])
})

describe('accesibilidad de interactivos', () => {
  it('Button expone rol boton con su etiqueta', async () => {
    const { getByRole } = await render(<Button label="Guardar cambios" />)

    expect(getByRole('button', { name: 'Guardar cambios' })).toBeTruthy()
  })

  it('el boton de registrar gasto de Inicio es rotulado y presionable', async () => {
    const { getByLabelText } = await render(<Home />)

    const boton = getByLabelText('Registrar gasto')
    expect(boton.props.accessibilityRole).toBe('button')
  })

  it('Input vincula la etiqueta visible al campo de texto', async () => {
    const { getByLabelText } = await render(
      <Input label="Monto" value="" onChangeText={jest.fn()} numeric />
    )

    const campo = getByLabelText('Monto')
    expect(campo.props.editable).not.toBe(false)
  })

  it('SegmentedControl publica rol, etiqueta y estado seleccionado', async () => {
    const opciones = [
      { value: 'fixed' as const, label: 'Fijos' },
      { value: 'unique' as const, label: 'Unicos' }
    ]
    const { getByLabelText } = await render(
      <SegmentedControl options={opciones} value="fixed" onChange={jest.fn()} />
    )

    expect(getByLabelText('Fijos').props.accessibilityState).toEqual({ selected: true })
    expect(getByLabelText('Unicos').props.accessibilityState).toEqual({ selected: false })
  })

  it('CalendarPicker rotula flechas y dias largos', async () => {
    const { getByLabelText } = await render(
      <CalendarPicker value="2026-08-10" onChange={jest.fn()} />
    )
    await espera()

    expect(getByLabelText('Mes anterior')).toBeTruthy()
    expect(getByLabelText('Mes siguiente')).toBeTruthy()
    expect(getByLabelText('15 de agosto de 2026').props.accessibilityRole).toBe('button')
  })

  it('el disparador de fecha del formulario expone su etiqueta', async () => {
    const { getByTestId } = await render(
      <ExpenseForm initialExpense={buildFixedExpense()} onSave={jest.fn()} />
    )
    await espera()

    const disparador = getByTestId('due-date-trigger')
    expect(disparador.props.accessibilityLabel).toContain('01/09/2026')
    expect(disparador.props.accessibilityRole).toBe('button')
  })
})
