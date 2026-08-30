/**
 * Pruebas unitarias para el parser de notificaciones de pago movil del BNC.
 */

import {
  parseBankNotification,
  parseBncNotification,
  parseBolivarAmount
} from '@src/lib/bankNotifications'

describe('parseBolivarAmount', () => {
  it('convierte montos con coma decimal simple', () => {
    expect(parseBolivarAmount('10000,00')).toBe(10000)
    expect(parseBolivarAmount('50,50')).toBe(50.5)
  })

  it('convierte montos con separador de miles y coma decimal', () => {
    expect(parseBolivarAmount('10.000,00')).toBe(10000)
    expect(parseBolivarAmount('1.250.500,75')).toBe(1250500.75)
  })

  it('rechaza cadenas invalidas o no numericas', () => {
    expect(parseBolivarAmount('')).toBeNull()
    expect(parseBolivarAmount('abc')).toBeNull()
    expect(parseBolivarAmount('0,00')).toBeNull()
  })
})

describe('parseBncNotification', () => {
  it('parsea exitosamente el modelo exacto de captura del BNC', () => {
    const title = 'PAGO MOVIL RECIBIDO'
    const body = 'BNC Pago Movil Recibido Bs. 10000,00 Telf. 0414***69..'

    const parsed = parseBncNotification(title, body)

    expect(parsed).not.toBeNull()
    expect(parsed?.bank).toBe('bnc')
    expect(parsed?.bankName).toBe('BNC')
    expect(parsed?.operationType).toBe('incoming_pago_movil')
    expect(parsed?.amount).toBe(10000)
    expect(parsed?.amountCents).toBe(1000000)
    expect(parsed?.currency).toBe('VES')
    expect(parsed?.sender).toBe('0414***69')
    expect(parsed?.rawTitle).toBe(title)
    expect(parsed?.rawBody).toBe(body)
  })

  it('parsea montos con separador de miles y referencias', () => {
    const title = 'PAGO MOVIL RECIBIDO'
    const body = 'BNC Pago Movil Recibido Bs. 25.500,00 Telf. 04241234567 Ref. 883921'

    const parsed = parseBncNotification(title, body)

    expect(parsed).not.toBeNull()
    expect(parsed?.amount).toBe(25500)
    expect(parsed?.amountCents).toBe(2550000)
    expect(parsed?.sender).toBe('04241234567')
    expect(parsed?.reference).toBe('883921')
  })

  it('identifica BNC a partir del nombre del paquete Android', () => {
    const title = 'Pago Móvil Recibido'
    const body = 'Pago Movil Recibido Bs. 350,00 Telf. 04169998877'

    const parsed = parseBncNotification(title, body, 'com.bnc.android.app')

    expect(parsed).not.toBeNull()
    expect(parsed?.bank).toBe('bnc')
    expect(parsed?.amount).toBe(350)
  })

  it('devuelve null si la notificacion no es de BNC', () => {
    const title = 'PAGO MOVIL RECIBIDO'
    const body = 'Banesco Pago Movil Recibido Bs. 500,00 Telf. 04141112233'

    const parsed = parseBncNotification(title, body)
    expect(parsed).toBeNull()
  })

  it('tolera variaciones sin espacio o sin punto en Bs', () => {
    const sinEspacio = parseBncNotification(
      'PAGO MOVIL RECIBIDO',
      'BNC Pago Movil Recibido Bs.10000,50 Telf. 0414***69..'
    )
    expect(sinEspacio?.amount).toBe(10000.5)
    expect(sinEspacio?.amountCents).toBe(1000050)

    const sinPunto = parseBncNotification(
      'Pago Movil Recibido',
      'BNC Pago Movil Recibido Bs 500,00 Telf 04121112233'
    )
    expect(sinPunto?.amount).toBe(500)
    expect(sinPunto?.sender).toBe('04121112233')
  })

  it('extrae monto y remitente si vienen en el titulo en lugar del cuerpo', () => {
    const parsed = parseBncNotification(
      'BNC Pago Movil Recibido Bs. 1500,00 Telf. 04141234567 Ref. 9988',
      'Notificacion de recepcion'
    )
    expect(parsed?.amount).toBe(1500)
    expect(parsed?.sender).toBe('04141234567')
    expect(parsed?.reference).toBe('9988')
  })

  it('devuelve null si no hay monto valido en la notificacion de BNC', () => {
    const sinMonto = parseBncNotification(
      'PAGO MOVIL RECIBIDO',
      'BNC Pago Movil Recibido sin detalles de monto'
    )
    expect(sinMonto).toBeNull()

    const montoCero = parseBncNotification(
      'PAGO MOVIL RECIBIDO',
      'BNC Pago Movil Recibido Bs. 0,00 Telf. 0414***69..'
    )
    expect(montoCero).toBeNull()
  })

  it('devuelve null si no es un pago movil recibido (ej. recordatorio o promocion)', () => {
    const title = 'BNC Noticia'
    const body = 'Estimado cliente, actualice sus datos en BNC en linea.'

    const parsed = parseBncNotification(title, body)
    expect(parsed).toBeNull()
  })
})

describe('parseBankNotification', () => {
  it('delega en el parser correspondiente', () => {
    const result = parseBankNotification(
      'PAGO MOVIL RECIBIDO',
      'BNC Pago Movil Recibido Bs. 10000,00 Telf. 0414***69..'
    )

    expect(result).not.toBeNull()
    expect(result?.bank).toBe('bnc')
    expect(result?.amount).toBe(10000)
  })

  it('devuelve null para notificaciones vacias o no reconocidas', () => {
    expect(parseBankNotification('', '')).toBeNull()
    expect(parseBankNotification('WhatsApp', 'Mensaje de mama')).toBeNull()
  })
})
