/**
 * Utilidades de captura de montos monetarios.
 * Los importes se escriben "desde los centavos": cada digito tecleado
 * empuja la cifra (0.01 -> 0.10 -> 1.00 -> 10.00), evitando errores
 * de separador decimal en teclados regionales.
 */

/** Limite superior de centavos aceptado (~99.999.999,99) */
const CENTAVOS_MAXIMOS = 9_999_999_999

/**
 * Reduce texto libre a su componente de digitos y lo interpreta como centavos.
 * @param text Entrada cruda del usuario (puede incluir simbolos, comas, puntos)
 * @returns Centavos enteros derivados solo de los digitos presentes
 */
export function centsFromText(text: string): number {
  const digitos = text.replace(/\D/g, '')
  if (!digitos) return 0
  return Math.min(CENTAVOS_MAXIMOS, parseInt(digitos, 10))
}

/**
 * Formatea centavos como cadena decimal con punto y dos decimales.
 * @param cents Centavos enteros (negativos se tratan como cero)
 * @returns Texto tipo "10.00" listo para mostrar en el campo
 */
export function textFromCents(cents: number): string {
  const seguros = Math.max(0, Math.trunc(cents))
  const enteros = Math.floor(seguros / 100)
  const decimales = String(seguros % 100).padStart(2, '0')
  return `${enteros}.${decimales}`
}

/**
 * Convierte centavos al monto decimal que espera el dominio.
 * @param cents Centavos enteros
 * @returns Monto redondeado a dos decimales
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
  modo: 'integer' | 'fraction'
  /** Valor canonico en centavos */
  centavos: number
  /** Buffer de decimales visibles en modo fraction (0 a 2 digitos) */
  decimales: string
  /** Texto exacto mostrado en el campo; coincide con el nativo */
  texto: string
}

/**
 * Estado inicial del campo: prerellenado con 0.00 en modo cents-first.
 * @returns Estado base para iniciar la captura
 */
export function initialAmountState(): AmountState {
  return { modo: 'integer', centavos: 0, decimales: '00', texto: '0.00' }
}

/** Aplica el techo de centavos aceptados */
function techo(centavos: number): number {
  return Math.min(CENTAVOS_MAXIMOS, Math.max(0, centavos))
}

/** Centavos de la parte entera de un estado dado */
function centavosEnteros(centavos: number): number {
  return Math.floor(Math.max(0, centavos) / 100) * 100
}

/** Texto visible en modo fraccionario: siempre dos decimales visibles */
function textoFraccionario(centavos: number, decimales: string): string {
  return `${Math.floor(Math.max(0, centavos) / 100)}.${decimales.padEnd(2, '0')}`
}

/** Centavos de un buffer parcial de decimales ("3" -> 3, "" -> 0) */
function centavosDeDecimales(decimales: string): number {
  return parseInt(decimales.padEnd(2, '0'), 10)
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
 * @param prev Estado previo del campo
 * @param input Texto crudo entregado por onChangeText
 * @returns Nuevo estado consistente
 */
export function amountAfterInput(prev: AmountState, input: string): AmountState {
  const anterior = prev.texto

  if (input.startsWith(anterior) && input.length > anterior.length) {
    const tecla = input.slice(anterior.length)

    if (/^[0-9]$/.test(tecla)) {
      if (prev.modo === 'integer') {
        const centavos = techo(prev.centavos * 10 + Number(tecla))

        return { modo: 'integer', centavos, decimales: '00', texto: textFromCents(centavos) }
      }

      const decimales = (prev.decimales + tecla).slice(-2)
      const centavos = techo(centavosEnteros(prev.centavos) + centavosDeDecimales(decimales))

      return {
        modo: 'fraction',
        centavos,
        decimales,
        texto: textoFraccionario(centavos, decimales)
      }
    }

    if ((tecla === '.' || tecla === ',') && prev.modo === 'integer') {
      const entero = Math.floor(prev.centavos / 100)

      return {
        modo: 'fraction',
        centavos: entero * 100,
        decimales: '00',
        texto: textoFraccionario(entero * 100, '00')
      }
    }

    return prev
  }

  if (anterior.startsWith(input) && input.length < anterior.length) {
    if (prev.modo === 'fraction') {
      const decimales = prev.decimales.slice(0, -1)

      if (decimales.length > 0) {
        const centavos = techo(centavosEnteros(prev.centavos) + centavosDeDecimales(decimales))

        return {
          modo: 'fraction',
          centavos,
          decimales,
          texto: textoFraccionario(centavos, decimales)
        }
      }
    }

    const centavos =
      prev.modo === 'fraction'
        ? centavosEnteros(prev.centavos)
        : techo(Math.floor(prev.centavos / 10))

    return { modo: 'integer', centavos, decimales: '00', texto: textFromCents(centavos) }
  }

  const centavos = centsFromText(input)

  return { modo: 'integer', centavos, decimales: '00', texto: textFromCents(centavos) }
}
