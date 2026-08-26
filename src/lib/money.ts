/**
 * Money input helpers implementing the cents-first capture pattern:
 * cada digito tecleado empuja la cifra desde los decimales
 * (1 -> 0.01 -> 10.00), con modo fraccionario al pulsar separador.
 */

/** Limite superior de centavos aceptado (~99.999.999,99) */
export const MAX_CENTS = 9999999999

/**
 * Reduce texto libre a su componente de digitos y lo interpreta como centavos.
 * @param text Texto capturado del campo
 * @returns Centavos enteros no negativos
 */
export function centsFromText(text: string): number {
  const digits = text.replace(/\D/g, '')

  return digits ? parseInt(digits, 10) : 0
}

/**
 * Formatea centavos como cadena decimal con punto y dos decimales.
 * @param cents Centavos enteros (negativos se tratan como cero)
 * @returns Texto tipo "12.34"
 */
export function textFromCents(cents: number): string {
  const safeCents = Math.max(0, Math.trunc(cents))
  const intPart = Math.floor(safeCents / 100)
  const decimalText = String(safeCents % 100).padStart(2, '0')

  return `${intPart}.${decimalText}`
}

/**
 * Convierte centavos al monto decimal que espera el dominio.
 * @param cents Centavos enteros
 * @returns Monto decimal positivo
 */
export function amountFromCents(cents: number): number {
  return Math.round(Math.max(0, Math.trunc(cents))) / 100
}

/**
 * Estado estructurado de un campo de monto con dos modos: "integer"
 * (captura cents-first, los digitos empujan desde los decimales) y
 * "fraction" (los digitos llenan o desplazan solo los dos decimales).
 */
export interface AmountState {
  /** Modo activo de captura */
  mode: 'integer' | 'fraction'
  /** Valor canonico en centavos */
  cents: number
  /** Buffer de decimales visibles en modo fraction (0 a 2 digitos) */
  decimals: string
  /** Texto exacto mostrado en el campo; coincide con el nativo */
  text: string
}

/**
 * Estado inicial del campo: prerellenado con 0.00 en modo cents-first.
 * @returns Estado base para iniciar la captura
 */
export function initialAmountState(): AmountState {
  return { mode: 'integer', cents: 0, decimals: '00', text: '0.00' }
}

/** Aplica el techo de centavos aceptados */
function capCents(cents: number): number {
  return Math.min(MAX_CENTS, Math.max(0, cents))
}

/** Centavos de la parte entera de un estado dado */
function wholeCents(cents: number): number {
  return Math.floor(Math.max(0, cents) / 100) * 100
}

/** Texto visible en modo fraccionario: siempre dos decimales visibles */
function fractionText(cents: number, decimals: string): string {
  return `${Math.floor(Math.max(0, cents) / 100)}.${decimals.padEnd(2, '0')}`
}

/** Centavos de un buffer parcial de decimales ("3" -> 3, "" -> 0) */
function centsFromDecimals(decimals: string): number {
  return parseInt(decimals.padEnd(2, '0'), 10)
}

/**
 * Interpreta la entrada cruda del campo sobre el estado previo.
 * Detecta el caso por comparacion con el texto mostrado:
 * - Digito al final en modo entero: empuja cents-first.
 * - Digito al final en modo fraccionario: llena los dos decimales de
 *   izquierda a derecha y luego desplaza ("00" -> "30" -> "36" -> "67").
 * - Separador al final: cambia a fraccionario conservando la parte
 *   entera ("10.00" + "." muestra "10.00" listo para editar decimales).
 * - Borrado al final: retrocede un digito o sale del modo fraccionario
 *   al vaciar los decimales.
 * - Cualquier otra edicion (cursor medio, pegado): reconstruccion
 *   tolerante interpretando todos los digitos como centavos.
 * @param previous Estado previo del campo
 * @param input Texto crudo entregado por onChangeText
 * @returns Nuevo estado consistente
 */
export function amountAfterInput(previous: AmountState, input: string): AmountState {
  const previousText = previous.text

  if (input.startsWith(previousText) && input.length > previousText.length) {
    const key = input.slice(previousText.length)

    if (/^[0-9]$/.test(key)) {
      if (previous.mode === 'integer') {
        const cents = capCents(previous.cents * 10 + Number(key))

        return { mode: 'integer', cents, decimals: '00', text: textFromCents(cents) }
      }

      const decimals = (previous.decimals + key).slice(-2)
      const cents = capCents(wholeCents(previous.cents) + centsFromDecimals(decimals))

      return {
        mode: 'fraction',
        cents,
        decimals,
        text: fractionText(cents, decimals)
      }
    }

    if ((key === '.' || key === ',') && previous.mode === 'integer') {
      const whole = Math.floor(previous.cents / 100)

      return {
        mode: 'fraction',
        cents: whole * 100,
        decimals: '00',
        text: fractionText(whole * 100, '00')
      }
    }

    return previous
  }

  if (previousText.startsWith(input) && input.length < previousText.length) {
    if (previous.mode === 'fraction') {
      const decimals = previous.decimals.slice(0, -1)

      if (decimals.length > 0) {
        const cents = capCents(wholeCents(previous.cents) + centsFromDecimals(decimals))

        return {
          mode: 'fraction',
          cents,
          decimals,
          text: fractionText(cents, decimals)
        }
      }
    }

    const cents =
      previous.mode === 'fraction'
        ? wholeCents(previous.cents)
        : capCents(Math.floor(previous.cents / 10))

    return { mode: 'integer', cents, decimals: '00', text: textFromCents(cents) }
  }

  const cents = centsFromText(input)

  return { mode: 'integer', cents, decimals: '00', text: textFromCents(cents) }
}
