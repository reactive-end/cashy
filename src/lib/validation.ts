/**
 * Form validation schemas built on zod.
 * Cada esquema expone mensajes en espanol listos para mostrar bajo
 * los campos; la validacion corre en tiempo real desde el primer
 * caracter tecleado en los formularios de identidad e ingresos.
 */

import { type ZodType, z } from 'zod'

/** Nombres y apellidos: letras (con acentos y enie) separadas por espacios */
const TEXT_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/

/** Esquema del nombre: minimo 3 caracteres, solo texto */
export const firstNameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre es obligatorio')
  .min(3, 'El nombre debe tener al menos 3 caracteres')
  .regex(TEXT_PATTERN, 'El nombre solo admite letras')

/** Esquema del apellido: mismas reglas que el nombre */
export const lastNameSchema = z
  .string()
  .trim()
  .min(1, 'El apellido es obligatorio')
  .min(3, 'El apellido debe tener al menos 3 caracteres')
  .regex(TEXT_PATTERN, 'El apellido solo admite letras')

/** Esquema del correo electronico con formato valido */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'El correo es obligatorio')
  .email('Ingresa un correo valido')

/** Esquema completo del paso de identidad */
export const profileSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema
})

/** Forma estructural minima de una fila de ingreso en capturacion */
interface IncomeRowLike {
  name: string
  amountCents: number
  currency: string
  paydayDayText: string
  type?: string
  recurrence?: string
}

/**
 * Convierte el texto crudo del dia de cobro a entero valido.
 * @param text Texto capturado en el campo numerico
 * @returns Entero entre 1 y 31, o null cuando no es interpretable
 */
export function parseDayFromText(text: string): number | null {
  if (!/^\d{1,2}$/.test(text.trim())) return null

  const parsed = Number.parseInt(text.trim(), 10)

  return parsed >= 1 && parsed <= 31 ? parsed : null
}

/**
 * Valida una fila completa de ingreso (concepto, monto y dia).
 * Para ingresos unicos no se exige dia de cobro especifico.
 * @param row Fila capturada en el editor o el wizard
 * @returns true cuando puede persistirse
 */
export function isValidIncomeRow(row: IncomeRowLike): boolean {
  const isUnique = row.type === 'unique'
  const isDayValid = isUnique || parseDayFromText(row.paydayDayText) !== null

  return (
    validateField(incomeSchema.shape.name, row.name) === null &&
    Number.isInteger(row.amountCents) &&
    row.amountCents > 0 &&
    isDayValid
  )
}

/** Esquema de un ingreso capturado en la tabla del segundo paso */
export const incomeSchema = z.object({
  /** Concepto del ingreso, minimo 3 caracteres */
  name: z
    .string()
    .trim()
    .min(1, 'El concepto es obligatorio')
    .min(3, 'El concepto debe tener al menos 3 caracteres'),
  /** Monto mensual en centavos, mayor a cero */
  amountCents: z
    .number()
    .int('El monto no admite mas de dos decimales')
    .positive('El monto debe ser mayor a cero'),
  /** Moneda en que se percibe */
  currency: z.enum(['VES', 'USD', 'USDT', 'EUR']),
  /** Dia del mes de cobro entre 1 y 31 */
  paydayDay: z
    .number()
    .int('El dia debe ser un numero entero')
    .min(1, 'El dia debe estar entre 1 y 31')
    .max(31, 'El dia debe estar entre 1 y 31')
})

/**
 * Valida un valor contra un esquema y devuelve el primer mensaje.
 * @param schema Esquema zod a aplicar
 * @param value Valor capturado en el campo
 * @returns Mensaje de error o null cuando el valor es valido
 */
export function validateField<T>(schema: ZodType<T>, value: T): string | null {
  const resultado = schema.safeParse(value)

  if (resultado.success) return null

  return resultado.error.issues[0]?.message ?? 'Valor invalido'
}
