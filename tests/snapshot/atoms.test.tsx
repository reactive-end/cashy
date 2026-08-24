/**
 * Pruebas de instantanea de los atomos del sistema de diseno.
 * El reloj se congela para que cualquier fecha relativa sea estable.
 */

import { render } from '@testing-library/react-native'
import type { ReactElement } from 'react'

import { Badge } from '@src/components/atoms/Badge'
import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Input } from '@src/components/atoms/Input'
import { Typography } from '@src/components/atoms/Typography'

import { AHORA } from '../helpers/factories'

beforeAll(() => {
  jest.useFakeTimers({ now: AHORA })
})

afterAll(() => {
  jest.useRealTimers()
})

async function snapshotar(elemento: ReactElement): Promise<string> {
  const pantalla = await render(elemento)
  return JSON.stringify(pantalla.toJSON())
}

describe('instantaneas de atomos', () => {
  it('Typography cubre las seis variantes', async () => {
    const arboles = [
      <Typography key="1" variant="display">
        T
      </Typography>,
      <Typography key="2" variant="title">
        T
      </Typography>,
      <Typography key="3" variant="body">
        T
      </Typography>,
      <Typography key="4" variant="figure">
        T
      </Typography>,
      <Typography key="5" variant="label">
        T
      </Typography>,
      <Typography key="6" variant="caption">
        T
      </Typography>
    ]
    const instantaneas: string[] = []
    for (const arbol of arboles) {
      instantaneas.push(await snapshotar(arbol))
    }
    expect(instantaneas).toMatchSnapshot()
  })

  it('Badge produce una pastilla por tono', async () => {
    const arboles = [
      <Badge key="1" text="neutro" />,
      <Badge key="2" text="ok" tone="success" />,
      <Badge key="3" text="aviso" tone="warning" />,
      <Badge key="4" text="urgente" tone="danger" />
    ]
    const instantaneas: string[] = []
    for (const arbol of arboles) {
      instantaneas.push(await snapshotar(arbol))
    }
    expect(instantaneas).toMatchSnapshot()
  })

  it('Card combina padding y resaltado', async () => {
    const arboles = [<Card key="1" />, <Card key="2" noPadding />, <Card key="3" highlighted />]
    const instantaneas: string[] = []
    for (const arbol of arboles) {
      instantaneas.push(await snapshotar(arbol))
    }
    expect(instantaneas).toMatchSnapshot()
  })

  it('Input muestra etiqueta, prefijo y error', async () => {
    const arboles = [
      <Input key="1" label="Nombre" value="" onChangeText={jest.fn()} />,
      <Input
        key="2"
        label="Monto"
        value="9,99"
        onChangeText={jest.fn()}
        numeric
        prefix="$"
        errorMessage="Monto invalido"
      />
    ]
    const instantaneas: string[] = []
    for (const arbol of arboles) {
      instantaneas.push(await snapshotar(arbol))
    }
    expect(instantaneas).toMatchSnapshot()
  })

  it('Button refleja variantes y estados', async () => {
    const arboles = [
      <Button key="1" label="Primario" />,
      <Button key="2" label="Secundario" variant="secondary" size="large" />,
      <Button key="3" label="Fantasma" variant="ghost" icon="add" />,
      <Button key="4" label="Peligroso" variant="danger" disabled />,
      <Button key="5" label="Cargando" loading fullWidth />
    ]
    const instantaneas: string[] = []
    for (const arbol of arboles) {
      instantaneas.push(await snapshotar(arbol))
    }
    expect(instantaneas).toMatchSnapshot()
  })

  it('Icon mantiene su estructura basica', async () => {
    const arboles = [
      <Icon key="1" name="dollar" />,
      <Icon key="2" name="usdt" size={28} color="#2F6B4F" strokeWidth={2} />
    ]
    const instantaneas: string[] = []
    for (const arbol of arboles) {
      instantaneas.push(await snapshotar(arbol))
    }
    expect(instantaneas).toMatchSnapshot()
  })
})
