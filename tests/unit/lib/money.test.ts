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
function escribir(secuencia: string) {
  let estado = initialAmountState()

  for (const tecla of secuencia.split('')) {
    estado = amountAfterInput(estado, estado.texto + tecla)
  }

  return estado
}

/** Continua escribiendo teclas sobre un estado existente */
function teclar(estado: ReturnType<typeof initialAmountState>, secuencia: string) {
  let actual = estado

  for (const tecla of secuencia.split('')) {
    actual = amountAfterInput(actual, actual.texto + tecla)
  }

  return actual
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
    const estado = initialAmountState()

    expect(estado.texto).toBe('0.00')
    expect(estado.centavos).toBe(0)
  })

  it('empuja los digitos desde los decimales hacia la izquierda', () => {
    const estado = escribir('5')

    expect(estado.texto).toBe('0.05')
    expect(escribir('50').texto).toBe('0.50')
    expect(escribir('500').texto).toBe('5.00')
    expect(escribir('1000').centavos).toBe(1000)
    expect(escribir('1000').texto).toBe('10.00')
  })

  it('el punto conserva la parte entera y abre la edicion decimal', () => {
    const estado = amountAfterInput(escribir('1000'), '10.00.')

    expect(estado.modo).toBe('fraction')
    expect(estado.texto).toBe('10.00')
    expect(estado.centavos).toBe(1000)
  })

  it('los digitos tras el punto llenan los decimales desde la derecha', () => {
    let estado = teclar(escribir('1000'), '.36')

    expect(estado.texto).toBe('10.36')
    expect(estado.centavos).toBe(1036)
  })

  it('un tercer digito desplaza los decimales dentro del modo fraccionario', () => {
    const estado = teclar(teclar(escribir('1000'), '.36'), '7')

    expect(estado.texto).toBe('10.67')
    expect(estado.centavos).toBe(1067)
  })

  it('el borrado retrocede un digito en modo entero', () => {
    const estado = amountAfterInput(escribir('1250'), '12.5')

    expect(estado.texto).toBe('1.25')
    expect(estado.centavos).toBe(125)
  })

  it('el borrado retrocede los decimales y sale al vaciarlos', () => {
    let estado = teclar(escribir('1000'), '.36')

    expect(estado.texto).toBe('10.36')

    estado = amountAfterInput(estado, '10.3')

    expect(estado.texto).toBe('10.30')
    expect(estado.centavos).toBe(1030)

    estado = amountAfterInput(estado, '10.00')

    expect(estado.modo).toBe('integer')
    expect(estado.texto).toBe('10.00')
    expect(estado.centavos).toBe(1000)
  })

  it('borrar desde 0.00 se queda en cero sin romperse', () => {
    const estado = amountAfterInput(initialAmountState(), '0.0')

    expect(estado.texto).toBe('0.00')
    expect(estado.centavos).toBe(0)
  })

  it('permite editar con el cursor en medio respetando el peso posicional', () => {
    const previo = escribir('1000')

    // Cursor tras el "1": insertar 2 convierte 10.00 en 120.00? no:
    // los digitos son centavos, "1200000" = 12.000,00
    const insertado = amountAfterInput(previo, '12000.00')

    expect(insertado.modo).toBe('integer')
    expect(insertado.centavos).toBe(1200000)
    expect(insertado.texto).toBe('12000.00')

    // Borrar un cero a mitad: 10.00 -> 1.00? "100.00" = 100,00
    const borrado = amountAfterInput(previo, '100.00')

    expect(borrado.modo).toBe('integer')
    expect(borrado.centavos).toBe(10000)
    expect(borrado.texto).toBe('100.00')
  })

  it('reconstruye con tolerancia ediciones no reconocidas (pegado o cursor medio)', () => {
    const previo = escribir('1000')
    const estado = amountAfterInput(previo, '910.00')

    expect(estado.modo).toBe('integer')
    expect(estado.texto).toBe('910.00')
    expect(estado.centavos).toBe(91000)
  })

  it('ignora separadores repetidos en modo fraccionario', () => {
    let estado = escribir('1000')
    estado = amountAfterInput(estado, '10.00.')
    const trasDoblePunto = amountAfterInput(estado, '10.00.')

    expect(trasDoblePunto.texto).toBe('10.00')
    expect(trasDoblePunto.centavos).toBe(1000)
  })
})

describe('amountFromCents', () => {
  it('convierte a monto decimal redondeado a dos decimales', () => {
    expect(amountFromCents(1250)).toBe(12.5)
    expect(amountFromCents(1)).toBe(0.01)
    expect(amountFromCents(-100)).toBe(0)
  })
})
