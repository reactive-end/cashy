/**
 * Pruebas unitarias de la captura de montos en centavos.
 * El patron cents-first empuja digitos: 1 -> 0.01, 1250 -> 12.50.
 */

import {
  amountAfterInput,
  amountFromCents,
  centsFromText,
  initialAmountState,
  textFromCents
} from '@src/lib/money'

/** Escribe una secuencia de teclas devolviendo el estado final */
function typeSequence(sequence: string) {
  let state = initialAmountState()

  for (const key of sequence.split('')) {
    state = amountAfterInput(state, state.text + key)
  }

  return state
}

/** Continua escribiendo teclas sobre un estado existente */
function pressKey(state: ReturnType<typeof initialAmountState>, sequence: string) {
  let current = state

  for (const key of sequence.split('')) {
    current = amountAfterInput(current, current.text + key)
  }

  return current
}

describe('centsFromText', () => {
  it('extrae solo los digitos del texto', () => {
    expect(centsFromText('12.50')).toBe(1250)
    expect(centsFromText('$ 1.250,00')).toBe(125000)
    expect(centsFromText('abc')).toBe(0)
    expect(centsFromText('')).toBe(0)
  })

  it('preserva ceros a la izquierda como parte de los centavos', () => {
    expect(centsFromText('001')).toBe(1)
    expect(centsFromText('010')).toBe(10)
  })
})

describe('textFromCents', () => {
  it('formatea con punto decimal y dos decimales fijos', () => {
    expect(textFromCents(0)).toBe('0.00')
    expect(textFromCents(1)).toBe('0.01')
    expect(textFromCents(10)).toBe('0.10')
    expect(textFromCents(100)).toBe('1.00')
    expect(textFromCents(1000)).toBe('10.00')
    expect(textFromCents(123456)).toBe('1234.56')
  })

  it('trata valores negativos como cero', () => {
    expect(textFromCents(-5)).toBe('0.00')
  })
})

describe('amountAfterInput', () => {
  it('nace prerellenado con 0.00 en modo cents-first', () => {
    const state = initialAmountState()

    expect(state.text).toBe('0.00')
    expect(state.cents).toBe(0)
  })

  it('empuja los digitos desde los decimales hacia la izquierda', () => {
    const state = typeSequence('5')

    expect(state.text).toBe('0.05')
    expect(typeSequence('50').text).toBe('0.50')
    expect(typeSequence('500').text).toBe('5.00')
    expect(typeSequence('1000').cents).toBe(1000)
    expect(typeSequence('1000').text).toBe('10.00')
  })

  it('el punto conserva la parte entera y abre la edicion decimal', () => {
    const state = amountAfterInput(typeSequence('1000'), '10.00.')

    expect(state.mode).toBe('fraction')
    expect(state.text).toBe('10.00')
    expect(state.cents).toBe(1000)
  })

  it('los digitos tras el punto llenan los decimales desde la derecha', () => {
    const state = pressKey(typeSequence('1000'), '.36')

    expect(state.text).toBe('10.36')
    expect(state.cents).toBe(1036)
  })

  it('un tercer digito desplaza los decimales dentro del modo fraccionario', () => {
    const state = pressKey(pressKey(typeSequence('1000'), '.36'), '7')

    expect(state.text).toBe('10.67')
    expect(state.cents).toBe(1067)
  })

  it('el borrado retrocede un digito en modo entero', () => {
    const state = amountAfterInput(typeSequence('1250'), '12.5')

    expect(state.text).toBe('1.25')
    expect(state.cents).toBe(125)
  })

  it('el borrado retrocede los decimales y sale al vaciarlos', () => {
    let state = pressKey(typeSequence('1000'), '.36')

    expect(state.text).toBe('10.36')

    state = amountAfterInput(state, '10.3')

    expect(state.text).toBe('10.30')
    expect(state.cents).toBe(1030)

    state = amountAfterInput(state, '10.00')

    expect(state.mode).toBe('integer')
    expect(state.text).toBe('10.00')
    expect(state.cents).toBe(1000)
  })

  it('borrar desde 0.00 se queda en cero sin romperse', () => {
    const state = amountAfterInput(initialAmountState(), '0.0')

    expect(state.text).toBe('0.00')
    expect(state.cents).toBe(0)
  })

  it('permite editar con el cursor en medio respetando el peso posicional', () => {
    const previous = typeSequence('1000')

    // Cursor tras el "1": insertar 2 convierte 10.00 en 120.00? no:
    // los digitos son centavos, "1200000" = 12.000,00
    const inserted = amountAfterInput(previous, '12000.00')

    expect(inserted.mode).toBe('integer')
    expect(inserted.cents).toBe(1200000)
    expect(inserted.text).toBe('12000.00')

    // Borrar un cero a mitad: 10.00 -> 1.00? "100.00" = 100,00
    const removed = amountAfterInput(previous, '100.00')

    expect(removed.mode).toBe('integer')
    expect(removed.cents).toBe(10000)
    expect(removed.text).toBe('100.00')
  })

  it('reconstruye con tolerancia ediciones no reconocidas (pegado o cursor medio)', () => {
    const previous = typeSequence('1000')
    const state = amountAfterInput(previous, '910.00')

    expect(state.mode).toBe('integer')
    expect(state.text).toBe('910.00')
    expect(state.cents).toBe(91000)
  })

  it('ignora separadores repetidos en modo fraccionario', () => {
    let state = typeSequence('1000')
    state = amountAfterInput(state, '10.00.')
    const afterDoubleDot = amountAfterInput(state, '10.00.')

    expect(afterDoubleDot.text).toBe('10.00')
    expect(afterDoubleDot.cents).toBe(1000)
  })
})

describe('amountFromCents', () => {
  it('convierte a monto decimal redondeado a dos decimales', () => {
    expect(amountFromCents(1250)).toBe(12.5)
    expect(amountFromCents(1)).toBe(0.01)
    expect(amountFromCents(-100)).toBe(0)
  })
})
