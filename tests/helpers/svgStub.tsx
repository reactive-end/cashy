/**
 * Stub de react-native-svg para entorno Jest.
 * Los componentes de Lucide renderizan SVG; en Node los reducimos
 * a vistas vacias para mantener las instantaneas ligeras y estables.
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'

interface StubProps {
  children?: ReactNode
}

function createStub() {
  return function Stub({ children }: StubProps) {
    return <View>{children}</View>
  }
}

export const Svg = createStub()
export const Path = createStub()
export const Circle = createStub()
export const Rect = createStub()
export const Line = createStub()
export const Polyline = createStub()
export const Polygon = createStub()
export const Ellipse = createStub()
export const G = createStub()
export const Defs = createStub()
export const ClipPath = createStub()
export const Mask = createStub()
