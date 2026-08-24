/**
 * Layout de la barra principal: cinco pestañas con iconografia
 * outlined Lucide y estilos minimalistas del sistema.
 */

import { Tabs } from 'expo-router'

import { Icon } from '@src/components/atoms/Icon'
import { COLORS } from '@src/constants/theme'

/**
 * Navegador de pestañas raiz de la aplicacion.
 * @returns Estructura de tabs con estilos minimalistas del sistema
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.faint,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.line,
          borderTopWidth: 1
        },
        tabBarLabelStyle: {
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 11
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Icon name="home" color={color} />
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ color }) => <Icon name="expenses" color={color} />
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: 'Resumen',
          tabBarIcon: ({ color }) => <Icon name="chart" color={color} />
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: 'Calculadora',
          tabBarIcon: ({ color }) => <Icon name="calculator" color={color} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <Icon name="settings" color={color} />
        }}
      />
    </Tabs>
  )
}
