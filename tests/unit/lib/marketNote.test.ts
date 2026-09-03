/**
 * Pruebas unitarias para la utilidad parseMarketNote.
 */

import { parseMarketNote } from '@src/lib/marketNote'

describe('parseMarketNote', () => {
  it('retorna null si la nota es nula, vacia o no corresponde a mercado', () => {
    expect(parseMarketNote(null)).toBeNull()
    expect(parseMarketNote(undefined)).toBeNull()
    expect(parseMarketNote('')).toBeNull()
    expect(parseMarketNote('Pago de alquiler mensual')).toBeNull()
  })

  it('analiza correctamente el formato legado separado por comas', () => {
    const note = '3 articulos: Harina PAN ($1,50), Arroz ($1,20), Leche ($2,00)'
    const parsed = parseMarketNote(note)

    expect(parsed).not.toBeNull()
    expect(parsed?.isMarket).toBe(true)
    expect(parsed?.items).toHaveLength(3)
    expect(parsed?.items[0]).toEqual({
      name: 'Harina PAN',
      quantity: undefined,
      amountText: '$1,50'
    })
    expect(parsed?.items[1]).toEqual({
      name: 'Arroz',
      quantity: undefined,
      amountText: '$1,20'
    })
    expect(parsed?.items[2]).toEqual({
      name: 'Leche',
      quantity: undefined,
      amountText: '$2,00'
    })
  })

  it('analiza formato estructurado con vinetas y cantidades', () => {
    const note = `3 articulos de mercado:
• 3x Harina PAN ($4,50)
• 1x Arroz ($1,20)
• Queso Blanco ($3,00)`

    const parsed = parseMarketNote(note)

    expect(parsed).not.toBeNull()
    expect(parsed?.isMarket).toBe(true)
    expect(parsed?.items).toHaveLength(3)
    expect(parsed?.items[0]).toEqual({
      name: 'Harina PAN',
      quantity: 3,
      amountText: '$4,50'
    })
    expect(parsed?.items[1]).toEqual({
      name: 'Arroz',
      quantity: 1,
      amountText: '$1,20'
    })
    expect(parsed?.items[2]).toEqual({
      name: 'Queso Blanco',
      quantity: undefined,
      amountText: '$3,00'
    })
  })

  it('soporta encabezado con tag [mercado]', () => {
    const note = `[mercado]
• 2x Cafe molido ($5,00)`

    const parsed = parseMarketNote(note)

    expect(parsed).not.toBeNull()
    expect(parsed?.items).toHaveLength(1)
    expect(parsed?.items[0].name).toBe('Cafe molido')
    expect(parsed?.items[0].quantity).toBe(2)
    expect(parsed?.items[0].amountText).toBe('$5,00')
  })
})
