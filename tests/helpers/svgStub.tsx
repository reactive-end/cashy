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

function crearStub() {
  return function Stub({ children }: StubProps) {
    return <View>{children}</View>
  }
}

export const Svg = crearStub()
export const Path = crearStub()
export const Circle = crearStub()
export const Rect = crearStub()
export const Line = crearStub()
export const Polyline = crearStub()
export const Polygon = crearStub()
export const Ellipse = crearStub()
export const G = crearStub()
export const Defs = crearStub()
export const ClipPath = crearStub()
export const Mask = crearStub()
