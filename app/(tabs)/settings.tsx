/**
 * Settings screen: user preferences.
 * Base currency for summaries and reminder hour, plus
 * information about the data sources.
 */

import { View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { useSettings } from '@src/hooks/useSettings'
import { formatHour12 } from '@src/lib/format'
import { notificationsAvailable } from '@src/lib/notifications'
import { BASE_CURRENCIES, type BaseCurrency } from '@src/types/domain'

/** Opciones de hora para los recordatorios diarios */
const REMINDER_HOUR_OPTIONS = [7, 9, 12, 19] as const

/**
 * Pestaña de configuracion con moneda base y hora de avisos.
 * @returns Pantalla de ajustes minimalista
 */
export default function Settings() {
  const { settings, changeBaseCurrency, changeReminderHour } = useSettings()

  return (
    <Screen scrollable>
      <View className="gap-5 pt-6">
        <Typography variant="display">Ajustes</Typography>

        <Card className="gap-3">
          <Typography variant="label">Moneda base</Typography>
          <Typography variant="caption">
            Los resumenes convierten todos tus gastos a esta moneda usando las tasas del dia.
          </Typography>
          <SegmentedControl
            options={BASE_CURRENCIES.map((moneda) => ({ value: moneda, label: moneda }))}
            value={(settings?.baseCurrency ?? 'USD') as BaseCurrency}
            onChange={(valor) => void changeBaseCurrency(valor)}
          />
        </Card>

        {!notificationsAvailable() ? (
          <Card className="gap-2 border-warn bg-warn-soft">
            <Typography variant="caption" className="text-warn">
              Estas usando Expo Go: los recordatorios nativos estan desactivados. Los vencimientos
              se siguen actualizando, pero para recibir avisos instala una development build (npx
              expo run:android).
            </Typography>
          </Card>
        ) : null}

        <Card className="gap-3">
          <Typography variant="label">Hora de recordatorios</Typography>
          <Typography variant="caption">
            Llegan un dia antes de cada vencimiento de tus gastos fijos. Ademas recibiras la tasa
            BCV cada dia a las 9:00 a.m. y 1:00 p.m.
          </Typography>
          <SegmentedControl
            options={REMINDER_HOUR_OPTIONS.map((hora) => ({
              value: String(hora),
              label: formatHour12(hora)
            }))}
            value={String(settings?.reminderHour ?? 9)}
            onChange={(valor) => void changeReminderHour(Number(valor))}
          />
        </Card>

        <Typography variant="caption" className="text-center">
          Tasas referenciales consultadas una vez al dia. Tus datos viven solo en este dispositivo.
        </Typography>
      </View>
    </Screen>
  )
}
