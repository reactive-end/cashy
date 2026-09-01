/**
 * Pruebas unitarias para el parser de pagos moviles por patron.
 * Usa notificaciones reales de Banesco, Banco de Venezuela, BNC y
 * BBVA Provincial como fixtures, junto a casos borde de monto.
 */

import {
  containsPagoMovil,
  normalizeNotificationText,
  parseBolivarAmount,
  parsePaymentNotification
} from '@src/lib/bankNotifications/parser'

/** Fixtures reales capturadas del centro de notificaciones */
const FIXTURES = {
  banesco: {
    title: 'Has recibido un Pago Movil',
    body: 'BANESCO REGISTRO: Pago recibido a traves de Pago Movil de MEJIA B por Bs. 1900.0 el 31/08/2026; 15:43 REF 062437337739. Para mas inf. llama...'
  },
  bdv: {
    title: 'PagomóvilBDV recibido',
    body: '"Recibiste un PagomovilBDV de JESUS DARIO AZUAJE MANZANILLA por Bs.1.760,00  bajo el numero de operacion 007186969576"'
  },
  bnc: {
    title: 'PAGO MOVIL RECIBIDO',
    body: 'BNC Pago Movil Recibido Bs.10000,00 Telf.0414***69..'
  },
  bbva: {
    title: '',
    body: 'BBVA Provincial informa Pago Movil desde cuenta 5256 por Bs. 30,206.00. Si no la realizaste envia N al 77106 o llama al 0212-5039211 F2026/08/05H15:51:44'
  }
} as const

describe('Deteccion del patron de pago movil', () => {
  it('normaliza minusculas y acentos', () => {
    expect(normalizeNotificationText('PagomóvilBDV RECIBIDO')).toBe('pagomovilbdv recibido')
    expect(normalizeNotificationText('PAGO MÓVIL')).toBe('pago movil')
  })

  it('detecta el patron en las cuatro muestras reales', () => {
    expect(containsPagoMovil(`${FIXTURES.banesco.title} ${FIXTURES.banesco.body}`)).toBe(true)
    expect(containsPagoMovil(`${FIXTURES.bdv.title} ${FIXTURES.bdv.body}`)).toBe(true)
    expect(containsPagoMovil(`${FIXTURES.bnc.title} ${FIXTURES.bnc.body}`)).toBe(true)
    expect(containsPagoMovil(FIXTURES.bbva.body)).toBe(true)
  })

  it('rechaza textos sin el patron', () => {
    expect(containsPagoMovil('Mensaje de voz (0:28)')).toBe(false)
    expect(containsPagoMovil('Reaccionó con un emoji')).toBe(false)
    expect(containsPagoMovil('pagomvil')).toBe(false)
  })
})

describe('Normalizacion de montos en bolivares', () => {
  it('resuelve ambos separadores con coma decimal (BDV)', () => {
    expect(parseBolivarAmount('1.760,00')).toBe(1760)
  })

  it('resuelve ambos separadores con punto decimal (BBVA)', () => {
    expect(parseBolivarAmount('30,206.00')).toBe(30206)
  })

  it('resuelve coma como decimal sin miles (BNC)', () => {
    expect(parseBolivarAmount('10000,00')).toBe(10000)
  })

  it('resuelve punto como decimal con un digito (Banesco)', () => {
    expect(parseBolivarAmount('1900.0')).toBe(1900)
  })

  it('interpreta grupos exactos de tres como miles', () => {
    expect(parseBolivarAmount('1.760')).toBe(1760)
    expect(parseBolivarAmount('30,206')).toBe(30206)
    expect(parseBolivarAmount('1.234.567')).toBe(1234567)
  })

  it('acepta montos con decimales simples', () => {
    expect(parseBolivarAmount('250,50')).toBe(250.5)
    expect(parseBolivarAmount('30.5')).toBe(30.5)
  })

  it('devuelve null ante entradas invalidas', () => {
    expect(parseBolivarAmount('')).toBeNull()
    expect(parseBolivarAmount('   ')).toBeNull()
    expect(parseBolivarAmount('0,00')).toBeNull()
    expect(parseBolivarAmount('0.0.0')).toBeNull()
  })
})

describe('Parser de notificaciones de pago movil', () => {
  it('parsea la notificacion real de Banesco', () => {
    const parsed = parsePaymentNotification(FIXTURES.banesco.title, FIXTURES.banesco.body)

    expect(parsed).not.toBeNull()
    expect(parsed?.bank).toBe('banesco')
    expect(parsed?.bankName).toBe('Banesco')
    expect(parsed?.amount).toBe(1900)
    expect(parsed?.amountCents).toBe(190000)
    expect(parsed?.currency).toBe('VES')
    expect(parsed?.sender).toBe('MEJIA B')
    expect(parsed?.reference).toBe('062437337739')
    expect(parsed?.operationType).toBe('incoming_pago_movil')
  })

  it('parsea la notificacion real de Banco de Venezuela', () => {
    const parsed = parsePaymentNotification(FIXTURES.bdv.title, FIXTURES.bdv.body)

    expect(parsed).not.toBeNull()
    expect(parsed?.bank).toBe('bdv')
    expect(parsed?.bankName).toBe('Banco de Venezuela')
    expect(parsed?.amount).toBe(1760)
    expect(parsed?.amountCents).toBe(176000)
    expect(parsed?.sender).toBe('JESUS DARIO AZUAJE MANZANILLA')
    expect(parsed?.reference).toBe('007186969576')
  })

  it('parsea la notificacion real del BNC con telefono de origen', () => {
    const parsed = parsePaymentNotification(FIXTURES.bnc.title, FIXTURES.bnc.body)

    expect(parsed).not.toBeNull()
    expect(parsed?.bank).toBe('bnc')
    expect(parsed?.bankName).toBe('BNC')
    expect(parsed?.amount).toBe(10000)
    expect(parsed?.amountCents).toBe(1000000)
    expect(parsed?.sender).toBe('0414***69')
    expect(parsed?.reference).toBeUndefined()
  })

  it('parsea la notificacion real de BBVA Provincial sin remitente', () => {
    const parsed = parsePaymentNotification(FIXTURES.bbva.title, FIXTURES.bbva.body)

    expect(parsed).not.toBeNull()
    expect(parsed?.bank).toBe('bbva')
    expect(parsed?.bankName).toBe('BBVA Provincial')
    expect(parsed?.amount).toBe(30206)
    expect(parsed?.amountCents).toBe(3020600)
    expect(parsed?.sender).toBeUndefined()
  })

  it('clasifica como generico un pago movil sin banco reconocible', () => {
    const parsed = parsePaymentNotification(
      'Pago Movil recibido',
      'Recibiste un pago movil por Bs. 500,00'
    )

    expect(parsed?.bank).toBe('generic')
    expect(parsed?.bankName).toBe('Banco')
    expect(parsed?.amount).toBe(500)
  })

  it('extrae el monto desde el titulo cuando el cuerpo no lo trae', () => {
    const parsed = parsePaymentNotification('BNC Pago Movil Recibido Bs.1.250,50', 'Aviso')

    expect(parsed?.amount).toBe(1250.5)
    expect(parsed?.amountCents).toBe(125050)
  })

  it('devuelve null sin titulo ni cuerpo', () => {
    expect(parsePaymentNotification('', '')).toBeNull()
    expect(parsePaymentNotification('   ', '   ')).toBeNull()
  })

  it('devuelve null cuando el texto no contiene el patron', () => {
    expect(parsePaymentNotification('Promocion', 'Aprovecha 20% de descuento')).toBeNull()
  })

  it('devuelve null cuando el patron existe pero no hay monto', () => {
    expect(
      parsePaymentNotification('Pago Movil recibido', 'Consulte su banco para el detalle')
    ).toBeNull()
  })
})
