/**
 * Pruebas de instantanea de las moleculas del proyecto.
 */

import { render } from '@testing-library/react-native'
import type { ReactElement } from 'react'

import { Button } from '@src/components/atoms/Button'
import { EmptyState } from '@src/components/molecules/EmptyState'
import { ExpenseItem } from '@src/components/molecules/ExpenseItem'
import { RateCard } from '@src/components/molecules/RateCard'
import { SectionHeader } from '@src/components/molecules/SectionHeader'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'

async function snapshotar(elemento: ReactElement): Promise<string> {
  const pantalla = await render(elemento)
  return JSON.stringify(pantalla.toJSON())
}

describe('instantaneas de moleculas', () => {
  it('RateCard distingue carga de dato', async () => {
    const arboles = [
      <RateCard key="1" title="Dolar BCV" value="Bs. 779,95" icon="dollar" />,
      <RateCard key="2" title="Euro BCV" value="" icon="euro" loading />
    ]
    const instantaneas: string[] = []
    for (const arbol of arboles) instantaneas.push(await snapshotar(arbol))
    expect(instantaneas).toMatchSnapshot()
  })

  it('ExpenseItem muestra variantes con insignia y monto original', async () => {
    const arboles = [
      <ExpenseItem
        key="1"
        icon="repeat"
        name="Netflix"
        detail="Suscripciones"
        formattedAmount="$ 9,99"
        badge={{ text: 'vence hoy', tone: 'danger' }}
      />,
      <ExpenseItem
        key="2"
        icon="tag"
        name="Licuadora"
        formattedAmount="$ 320,53"
        formattedOriginalAmount="Bs. 250.000,00"
      />
    ]
    const instantaneas: string[] = []
    for (const arbol of arboles) instantaneas.push(await snapshotar(arbol))
    expect(instantaneas).toMatchSnapshot()
  })

  it('EncabezadoSeccion y EstadoVacio mantienen su estructura', async () => {
    const a = await snapshotar(<SectionHeader title="Proximos pagos" />)
    const b = await snapshotar(
      <EmptyState
        icon="savings"
        title="Sin gastos"
        message="Agrega el primero."
        action={<Button label="Registrar" icon="add" />}
      />
    )
    expect([a, b]).toMatchSnapshot()
  })

  it('SegmentedControl refleja el valor activo', async () => {
    const snapshot = await snapshotar(
      <SegmentedControl
        options={[
          { value: 'fixed', label: 'Fijos' },
          { value: 'unique', label: 'Unicos' }
        ]}
        value="unique"
        onChange={jest.fn()}
      />
    )
    expect(snapshot).toMatchSnapshot()
  })
})
