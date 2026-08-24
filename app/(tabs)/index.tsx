/**
 * Home screen: daily overview for the user.
 * Shows the day rates (BCV and USDT), the monthly summary
 * in base currency and the fixed payments coming due.
 */

import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog } from '@src/components/molecules/AlertDialog'
import { SectionHeader } from '@src/components/molecules/SectionHeader'
import { MonthlySummary } from '@src/components/organisms/MonthlySummary'
import { RatesGrid } from '@src/components/organisms/RatesGrid'
import { UpcomingPayments } from '@src/components/organisms/UpcomingPayments'
import { useExpenses } from '@src/hooks/useExpenses'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'

/** Saludo segun la hora del dispositivo */
function greetingByTime(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos dias'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/**
 * Pestaña principal con el panorama financiero del dia.
 * @returns Pantalla de inicio compuesta por organismos informativos
 */
export default function Home() {
  const router = useRouter()
  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency = settings?.baseCurrency ?? 'USD'
  const gastos = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)

  // Aviso temporal al terminar un refresco manual de tasas.
  const [avisoTasas, setAvisoTasas] = useState<{ ok: boolean } | null>(null)
  const estabaRefrescando = useRef(false)

  useEffect(() => {
    if (ratesState.refreshing) {
      estabaRefrescando.current = true
      return
    }

    if (estabaRefrescando.current && ratesState.lastRefreshOk !== null) {
      estabaRefrescando.current = false
      setAvisoTasas({ ok: ratesState.lastRefreshOk })
    }
  }, [ratesState.refreshing, ratesState.lastRefreshOk])

  return (
    <Screen
      scrollable
      onRefresh={() => ratesState.refresh()}
      refreshing={ratesState.refreshing}
      overlay={
        avisoTasas ? (
          <AlertDialog
            visible
            title={avisoTasas.ok ? 'Todo en orden' : 'Algo fallo'}
            message={
              avisoTasas.ok
                ? 'Tasas actualizadas correctamente'
                : 'No se pudieron actualizar las tasas'
            }
            tone={avisoTasas.ok ? 'success' : 'danger'}
            onClose={() => setAvisoTasas(null)}
          />
        ) : null
      }
    >
      <View className="gap-4 pt-6">
        <View className="gap-1">
          <Typography variant="caption">{greetingByTime()}</Typography>
          <Typography variant="display">Tu panorama de hoy</Typography>
        </View>

        <RatesGrid ratesState={ratesState} />

        <MonthlySummary
          summary={gastos.monthlySummary}
          baseCurrency={baseCurrency}
          loading={ratesState.loading || !ratesState.rates}
        />

        <View className="gap-3">
          <Button
            label="Registrar gasto"
            icon="add"
            fullWidth
            onPress={() => router.push('/new-expense')}
          />
          <SectionHeader title="Próximos pagos" />
          <UpcomingPayments
            payments={gastos.upcomingPayments}
            onPaymentPress={(id) => router.push({ pathname: '/expense/[id]', params: { id } })}
          />
        </View>
      </View>
    </Screen>
  )
}
