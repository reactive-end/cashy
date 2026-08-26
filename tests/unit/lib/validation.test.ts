/**
 * Pruebas unitarias de los esquemas de validacion con zod.
 * Cubren mensajes en espanol, limites y reglas por campo.
 */

import {
  emailSchema,
  firstNameSchema,
  incomeSchema,
  lastNameSchema,
  validateField
} from '@src/lib/validation'

describe('firstNameSchema', () => {
  it('acepta nombres de 3 letras o mas, con espacios y acentos', () => {
    expect(firstNameSchema.safeParse('Ana').success).toBe(true)
    expect(firstNameSchema.safeParse('Maria Angel').success).toBe(true)
    expect(firstNameSchema.safeParse('Ángel').success).toBe(true)
  })

  it('rechaza nombres cortos, numericos o vacios', () => {
    const corto = firstNameSchema.safeParse('Ab')
    expect(corto.success).toBe(false)
    if (!corto.success) expect(corto.error.issues[0].message).toContain('3 caracteres')

    const numerico = firstNameSchema.safeParse('Ana123')
    expect(numerico.success).toBe(false)
    if (!numerico.success) expect(numerico.error.issues[0].message).toContain('solo admite letras')

    expect(firstNameSchema.safeParse('').success).toBe(false)
  })
})

describe('lastNameSchema', () => {
  it('aplica las mismas reglas que el nombre con sus propios mensajes', () => {
    expect(lastNameSchema.safeParse('Gomez').success).toBe(true)

    const corto = lastNameSchema.safeParse('Bo')
    expect(corto.success).toBe(false)
    if (!corto.success)
      expect(corto.error.issues[0].message).toBe('El apellido debe tener al menos 3 caracteres')

    const numerico = lastNameSchema.safeParse('Gomez2')
    expect(numerico.success).toBe(false)
    if (!numerico.success) {
      expect(numerico.error.issues[0].message).toBe('El apellido solo admite letras')
    }
  })
})

describe('emailSchema', () => {
  it('acepta correos con formato valido y recorta espacios', () => {
    expect(emailSchema.safeParse('usuario@dominio.com').success).toBe(true)
    expect(emailSchema.safeParse(' usuario@dominio.com ').success).toBe(true)
  })

  it('rechaza cadenas sin formato de correo', () => {
    const invalido = emailSchema.safeParse('sin-arroba')
    expect(invalido.success).toBe(false)
    if (!invalido.success) expect(invalido.error.issues[0].message).toBe('Ingresa un correo valido')

    expect(emailSchema.safeParse('').success).toBe(false)
  })
})

describe('incomeSchema', () => {
  const ingresoValido = {
    name: 'Salario',
    amountCents: 150000,
    currency: 'USD',
    paydayDay: 5
  } as const

  it('acepta un ingreso completo y valido', () => {
    expect(incomeSchema.safeParse(ingresoValido).success).toBe(true)
  })

  it('exige concepto de al menos 3 caracteres', () => {
    const debil = incomeSchema.safeParse({ ...ingresoValido, name: 'Su' })
    expect(debil.success).toBe(false)
    if (!debil.success) expect(debil.error.issues[0].message).toContain('3 caracteres')
  })

  it('exige montos positivos enteros en centavos', () => {
    const cero = incomeSchema.safeParse({ ...ingresoValido, amountCents: 0 })
    expect(cero.success).toBe(false)
    if (!cero.success) expect(cero.error.issues[0].message).toBe('El monto debe ser mayor a cero')

    const decimal = incomeSchema.safeParse({ ...ingresoValido, amountCents: 10.5 })
    expect(decimal.success).toBe(false)
  })

  it('limita el dia de cobro al rango 1-31', () => {
    const bajo = incomeSchema.safeParse({ ...ingresoValido, paydayDay: 0 })
    expect(bajo.success).toBe(false)

    const alto = incomeSchema.safeParse({ ...ingresoValido, paydayDay: 32 })
    expect(alto.success).toBe(false)

    const limite = incomeSchema.safeParse({ ...ingresoValido, paydayDay: 31 })
    expect(limite.success).toBe(true)
  })

  it('rechaza monedas fuera del catalogo', () => {
    const moneda = incomeSchema.safeParse({ ...ingresoValido, currency: 'GBP' })
    expect(moneda.success).toBe(false)
  })
})

describe('validateField', () => {
  it('devuelve null cuando el valor es valido', () => {
    expect(validateField(firstNameSchema, 'Carlos')).toBeNull()
  })

  it('devuelve el primer mensaje de error cuando falla', () => {
    expect(validateField(firstNameSchema, 'ab')).toBe('El nombre debe tener al menos 3 caracteres')
    expect(validateField(emailSchema, 'roto')).toBe('Ingresa un correo valido')
  })
})
