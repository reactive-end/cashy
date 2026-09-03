/**
 * Pruebas unitarias del organismo MarketCalculator.
 * Valida la suma de articulos con y sin nombre descriptivo,
 * calculo de total y equivalencias, eliminacion individual,
 * vaciado de lista y confirmacion de registro como gasto unico.
 */

import { setStringAsync } from 'expo-clipboard'
import { fireEvent, render } from '@testing-library/react-native'

import { MarketCalculator } from '@src/components/organisms/MarketCalculator'

import { buildRates } from '../../helpers/factories'
import { wait } from '../../helpers/wait'

const setStringAsyncMock = setStringAsync as jest.Mock

describe('organismo MarketCalculator', () => {
  const rates = buildRates()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('inicia vacio con total 0 y estado vacio visible', async () => {
    const componente = await render(<MarketCalculator initialCurrency="USD" rates={rates} />)
    await wait(60)

    expect(componente.getByTestId('total-mercado').props.children).toBe('$ 0,00')
    expect(componente.getByText(/Aun no has agregado articulos/i)).toBeTruthy()
  })

  it('suma articulos con nombre por defecto y con descripcion personalizada', async () => {
    const componente = await render(<MarketCalculator initialCurrency="USD" rates={rates} />)
    await wait(60)

    // Articulo 1: sin nombre (debe autogenerar Articulo #1)
    fireEvent.changeText(componente.getByTestId('input-item-amount'), '1000') // $ 10.00
    await wait(60)
    fireEvent.press(componente.getByTestId('btn-add-item'))
    await wait(60)

    expect(componente.getByText('Articulo #1')).toBeTruthy()
    expect(componente.getByTestId('total-mercado').props.children).toBe('$ 10,00')

    // Articulo 2: con nombre personalizado
    fireEvent.changeText(componente.getByTestId('input-item-name'), 'Queso blanco')
    await wait(60)
    fireEvent.changeText(componente.getByTestId('input-item-amount'), '550') // $ 5.50
    await wait(60)
    fireEvent.press(componente.getByTestId('btn-add-item'))
    await wait(60)

    expect(componente.getByText('Queso blanco')).toBeTruthy()
    expect(componente.getByTestId('total-mercado').props.children).toBe('$ 15,50')
    expect(componente.getByText('Total acumulado (2 articulos)')).toBeTruthy()
  })

  it('permite copiar una equivalencia al portapapeles', async () => {
    const componente = await render(<MarketCalculator initialCurrency="USD" rates={rates} />)
    await wait(60)

    fireEvent.changeText(componente.getByTestId('input-item-amount'), '2000') // $ 20.00
    await wait(60)
    fireEvent.press(componente.getByTestId('btn-add-item'))
    await wait(60)

    const btnCopyVes = componente.getByTestId('btn-copy-ves')
    fireEvent.press(btnCopyVes)
    expect(setStringAsyncMock).toHaveBeenCalledWith('15.599,00')
  })

  it('elimina un articulo individual y actualiza el total', async () => {
    const componente = await render(<MarketCalculator initialCurrency="USD" rates={rates} />)
    await wait(60)

    // Agrega 2 articulos
    fireEvent.changeText(componente.getByTestId('input-item-name'), 'Pan')
    await wait(60)
    fireEvent.changeText(componente.getByTestId('input-item-amount'), '300')
    await wait(60)
    fireEvent.press(componente.getByTestId('btn-add-item'))
    await wait(60)

    fireEvent.changeText(componente.getByTestId('input-item-name'), 'Leche')
    await wait(60)
    fireEvent.changeText(componente.getByTestId('input-item-amount'), '400')
    await wait(60)
    fireEvent.press(componente.getByTestId('btn-add-item'))
    await wait(60)

    expect(componente.getByText('Pan')).toBeTruthy()
    expect(componente.getByText('Leche')).toBeTruthy()
    expect(componente.getByTestId('total-mercado').props.children).toBe('$ 7,00')

    // Eliminar Pan
    const btnRemovePan = componente.getByLabelText('Eliminar Pan')
    fireEvent.press(btnRemovePan)
    await wait(60)

    expect(componente.getByText('Eliminar artículo')).toBeTruthy()
    const eliminarButtons = componente.getAllByText('Eliminar')
    fireEvent.press(eliminarButtons[eliminarButtons.length - 1])
    await wait(60)

    expect(componente.queryByText('Pan')).toBeNull()
    expect(componente.getByText('Leche')).toBeTruthy()
    expect(componente.getByTestId('total-mercado').props.children).toBe('$ 4,00')
  })

  it('permite ingresar multiples unidades con el selector de cantidad y ajustar unidades en la lista', async () => {
    const componente = await render(<MarketCalculator initialCurrency="USD" rates={rates} />)
    await wait(60)

    fireEvent.changeText(componente.getByTestId('input-item-name'), 'Arroz')
    await wait(60)
    fireEvent.changeText(componente.getByTestId('input-item-amount'), '200') // $ 2.00
    await wait(60)

    // Aumentar cantidad con el boton +
    fireEvent.press(componente.getByTestId('btn-qty-plus'))
    await wait(60)
    expect(componente.getByTestId('input-item-qty').props.value).toBe('2')
    expect(componente.getByText(/2 x \$ 2,00 = \$ 4,00/)).toBeTruthy()

    // Sumar producto
    fireEvent.press(componente.getByTestId('btn-add-item'))
    await wait(60)

    expect(componente.getByText('Arroz')).toBeTruthy()
    expect(componente.getByText('2 x $ 2,00')).toBeTruthy()
    expect(componente.getByTestId('total-mercado').props.children).toBe('$ 4,00')
    expect(componente.getByTestId('item-ves-equiv-0').props.children).toMatch(/≈\s+Bs\./)

    // Incrementar en la lista
    const plusButtons = componente.getAllByLabelText(/Aumentar cantidad de Arroz/)
    fireEvent.press(plusButtons[0])
    await wait(60)
    expect(componente.getByText('3 x $ 2,00')).toBeTruthy()
    expect(componente.getByTestId('total-mercado').props.children).toBe('$ 6,00')

    // Decrementar en la lista
    const minusButtons = componente.getAllByLabelText(/Disminuir cantidad de Arroz/)
    fireEvent.press(minusButtons[0])
    await wait(60)
    expect(componente.getByText('2 x $ 2,00')).toBeTruthy()
    expect(componente.getByTestId('total-mercado').props.children).toBe('$ 4,00')

    // Decrementar hasta solicitar eliminacion
    fireEvent.press(minusButtons[0]) // pasa a 1
    await wait(60)
    fireEvent.press(minusButtons[0]) // pasa a 0 -> abre ConfirmDialog
    await wait(60)

    expect(componente.getByText('Eliminar artículo')).toBeTruthy()
    const eliminarButtons = componente.getAllByText('Eliminar')
    fireEvent.press(eliminarButtons[eliminarButtons.length - 1])
    await wait(60)

    expect(componente.queryByText('Arroz')).toBeNull()
    expect(componente.getByTestId('total-mercado').props.children).toBe('$ 0,00')
  })

  it('permite vaciar toda la lista mediante el dialogo de confirmacion', async () => {
    const componente = await render(<MarketCalculator initialCurrency="USD" rates={rates} />)
    await wait(60)

    fireEvent.changeText(componente.getByTestId('input-item-amount'), '800')
    await wait(60)
    fireEvent.press(componente.getByTestId('btn-add-item'))
    await wait(60)

    expect(componente.getByText('Articulo #1')).toBeTruthy()

    // Presionar vaciar
    fireEvent.press(componente.getByTestId('btn-clear-items'))
    await wait(60)

    expect(componente.getByText('Vaciar lista')).toBeTruthy()

    // Confirmar en ConfirmDialog (segundo boton 'Vaciar')
    const vaciarButtons = componente.getAllByText('Vaciar')
    fireEvent.press(vaciarButtons[vaciarButtons.length - 1])
    await wait(60)

    expect(componente.getByText(/Aun no has agregado articulos/i)).toBeTruthy()
    expect(componente.getByTestId('total-mercado').props.children).toBe('$ 0,00')
  })

  it('abre el modal y registra el gasto con nombre y categoria modificados', async () => {
    const onRegisterExpenseMock = jest.fn().mockResolvedValue(undefined)
    const componente = await render(
      <MarketCalculator
        initialCurrency="USD"
        rates={rates}
        onRegisterExpense={onRegisterExpenseMock}
      />
    )
    await wait(60)

    fireEvent.changeText(componente.getByTestId('input-item-name'), 'Carne')
    await wait(60)
    fireEvent.changeText(componente.getByTestId('input-item-amount'), '2500') // $ 25.00
    await wait(60)
    fireEvent.press(componente.getByTestId('btn-add-item'))
    await wait(60)

    expect(componente.getByText('Carne')).toBeTruthy()

    // Abrir flujo de registro (Paso 1: Costo adicional)
    fireEvent.press(componente.getByTestId('btn-open-register-expense'))
    await wait(60)

    expect(componente.getByText('Costo adicional')).toBeTruthy()

    // Omitir costo adicional
    fireEvent.press(componente.getByTestId('btn-skip-extra-cost'))
    await wait(60)

    expect(componente.getAllByText('Registrar como gasto').length).toBeGreaterThanOrEqual(2)

    // Modificar nombre y categoria
    fireEvent.changeText(componente.getByTestId('input-expense-name'), 'Supermercado Central')
    await wait(60)
    fireEvent.changeText(componente.getByTestId('input-expense-category'), 'Alimentos')
    await wait(60)

    // Confirmar guardado
    fireEvent.press(componente.getByTestId('btn-confirm-save-expense'))
    await wait(60)

    expect(componente.getByText('Gasto registrado')).toBeTruthy()
    expect(onRegisterExpenseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Supermercado Central',
        amount: 25,
        currency: 'USD',
        type: 'unique',
        category: 'Alimentos'
      })
    )

    // Cerrar dialogo de exito
    fireEvent.press(componente.getByText('Aceptar'))
    await wait(60)
  })

  it('permite incluir un costo adicional (como una bolsa) y lo suma al gasto final', async () => {
    const onRegisterExpenseMock = jest.fn().mockResolvedValue(undefined)
    const componente = await render(
      <MarketCalculator
        initialCurrency="USD"
        rates={rates}
        onRegisterExpense={onRegisterExpenseMock}
      />
    )
    await wait(60)

    fireEvent.changeText(componente.getByTestId('input-item-name'), 'Frutas')
    await wait(60)
    fireEvent.changeText(componente.getByTestId('input-item-amount'), '1000') // $ 10.00
    await wait(60)
    fireEvent.press(componente.getByTestId('btn-add-item'))
    await wait(60)

    // Abrir flujo de registro (Paso 1: Costo adicional)
    fireEvent.press(componente.getByTestId('btn-open-register-expense'))
    await wait(60)

    expect(componente.getByText('Costo adicional')).toBeTruthy()

    // Ingresar costo de bolsa: $ 1.00
    fireEvent.changeText(componente.getByTestId('input-extra-cost-amount'), '100')
    await wait(60)
    fireEvent.changeText(componente.getByTestId('input-extra-cost-name'), 'Bolsa ecologica')
    await wait(60)

    // Continuar al paso 2
    fireEvent.press(componente.getByTestId('btn-apply-extra-cost'))
    await wait(60)

    expect(componente.getAllByText('Registrar como gasto').length).toBeGreaterThanOrEqual(2)

    // Confirmar guardado: el total debe ser $ 11.00 (10 + 1)
    fireEvent.press(componente.getByTestId('btn-confirm-save-expense'))
    await wait(60)

    expect(onRegisterExpenseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mercado',
        amount: 11,
        currency: 'USD',
        category: 'Compras'
      })
    )
  })

  it('permite cambiar la moneda del costo adicional (ej. en bolivares) y lo convierte a la moneda de compra', async () => {
    const onRegisterExpenseMock = jest.fn().mockResolvedValue(undefined)
    const componente = await render(
      <MarketCalculator
        initialCurrency="USD"
        rates={rates}
        onRegisterExpense={onRegisterExpenseMock}
      />
    )
    await wait(60)

    fireEvent.changeText(componente.getByTestId('input-item-name'), 'Carne')
    await wait(60)
    fireEvent.changeText(componente.getByTestId('input-item-amount'), '2000') // $ 20.00
    await wait(60)
    fireEvent.press(componente.getByTestId('btn-add-item'))
    await wait(60)

    // Abrir flujo de registro (Paso 1: Costo adicional)
    fireEvent.press(componente.getByTestId('btn-open-register-expense'))
    await wait(60)

    // Cambiar moneda de costo adicional a VES (Bs.)
    // SegmentedControl de costo adicional es el segundo en pantalla
    const vesButtons = componente.getAllByText('Bs.')
    fireEvent.press(vesButtons[vesButtons.length - 1])
    await wait(60)

    // Ingresar 60 Bs. (6000 centavos)
    fireEvent.changeText(componente.getByTestId('input-extra-cost-amount'), '6000')
    await wait(60)

    // Debe mostrar la equivalencia aproximada calculada con la tasa BCV (60 / 36.5 ≈ 1.64 en rates mock)
    expect(componente.getAllByText(/≈/).length).toBeGreaterThanOrEqual(1)

    // Continuar al paso 2
    fireEvent.press(componente.getByTestId('btn-apply-extra-cost'))
    await wait(60)

    // Confirmar guardado
    fireEvent.press(componente.getByTestId('btn-confirm-save-expense'))
    await wait(60)

    expect(onRegisterExpenseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mercado',
        currency: 'USD',
        note: expect.stringContaining('Bolsa (Bs. 60,00)')
      })
    )
  })
})
