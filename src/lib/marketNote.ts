/**
 * Utilidades para formatear y analizar notas de compras generadas
 * desde la calculadora de mercado. Permite compatibilidad retroactiva
 * con notas legadas e interpretacion estructurada de articulos.
 */

/** Articulo individual extraido de la nota de mercado */
export interface ParsedMarketItem {
  /** Nombre del producto o concepto */
  name: string
  /** Cantidad de unidades (1 por defecto si no se especifica) */
  quantity?: number
  /** Texto legible del monto asociado al articulo (ej: "$3,00" o "120,00 Bs.") */
  amountText?: string
}

/** Desglose estructurado de una nota de mercado */
export interface ParsedMarketNote {
  /** Indica si la nota corresponde a una compra de mercado valida */
  isMarket: boolean
  /** Titulo o encabezado (ej: "3 articulos de mercado") */
  header: string
  /** Lista de productos individuales extraidos */
  items: ParsedMarketItem[]
  /** Texto original intacto de la nota */
  rawNote: string
}

/**
 * Analiza el texto de una nota de gasto para determinar si proviene
 * de una compra de mercado y desglosar sus articulos constituyentes.
 * @param note Cadena de texto de la nota del gasto
 * @returns Estructura con la lista de articulos o null si no es una compra de mercado
 */
export function parseMarketNote(note?: string | null): ParsedMarketNote | null {
  if (!note || typeof note !== 'string') return null
  const trimmed = note.trim()
  if (!trimmed) return null

  // Patrones validos de cabecera: "X articulos:", "X artículos de mercado:", "[mercado]"
  const headerMatch = trimmed.match(
    /^(\d+\s+art[ií]culos(?:\s+de\s+mercado)?|\[mercado\]):?\s*([\s\S]*)$/i
  )
  if (!headerMatch) return null

  const header = headerMatch[1].startsWith('[') ? 'Artículos de mercado' : headerMatch[1]
  const content = headerMatch[2].trim()

  if (!content) return null

  const items: ParsedMarketItem[] = []

  if (content.includes('\n')) {
    // Formato moderno con saltos de linea y vinetas
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    for (const line of lines) {
      const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim()
      if (!cleanLine) continue

      const qtyMatch = cleanLine.match(/^(\d+)\s*x\s+(.+)$/i)
      let namePart = cleanLine
      let quantity: number | undefined

      if (qtyMatch) {
        quantity = parseInt(qtyMatch[1], 10)
        namePart = qtyMatch[2]
      }

      const amountMatch = namePart.match(/^(.*?)(?:\s*\(([^)]+)\))?$/)
      if (amountMatch) {
        const name = amountMatch[1].trim()
        const amountText = amountMatch[2]?.trim()
        if (name) {
          items.push({ name, quantity, amountText })
        }
      }
    }
  } else {
    // Formato legado delimitado por comas fuera de parentesis
    const chunks = content
      .split(/\),\s*/)
      .map((c, idx, arr) => (idx < arr.length - 1 ? `${c})` : c).trim())
      .filter(Boolean)

    for (const chunk of chunks) {
      const clean = chunk.replace(/^[•\-\*]\s*/, '').trim()
      if (!clean) continue

      const qtyMatch = clean.match(/^(\d+)\s*x\s+(.+)$/i)
      let namePart = clean
      let quantity: number | undefined

      if (qtyMatch) {
        quantity = parseInt(qtyMatch[1], 10)
        namePart = qtyMatch[2]
      }

      const amountMatch = namePart.match(/^(.*?)(?:\s*\(([^)]+)\))?$/)
      if (amountMatch) {
        const name = amountMatch[1].trim()
        const amountText = amountMatch[2]?.trim()
        if (name) {
          items.push({ name, quantity, amountText })
        }
      }
    }
  }

  if (items.length === 0) return null

  return {
    isMarket: true,
    header,
    items,
    rawNote: trimmed
  }
}
