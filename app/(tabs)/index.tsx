/**
 * Home screen: daily overview for the user.
 * Shows the day rates (BCV and USDT), the monthly summary
 * in base currency, payday confirmation modal and the fixed payments coming due.
 */

import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog } from '@src/components/molecules/AlertDialog'
import { PaydayNoticeDialog } from '@src/components/molecules/PaydayNoticeDialog'
import { SectionHeader } from '@src/components/molecules/SectionHeader'
import { MonthlySummary } from '@src/components/organisms/MonthlySummary'
import { RatesGrid } from '@src/components/organisms/RatesGrid'
import { UpcomingPayments } from '@src/components/organisms/UpcomingPayments'
import { useExpenses } from '@src/hooks/useExpenses'
import { useIncomes } from '@src/hooks/useIncomes'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import type { Income } from '@src/types/domain'

/** Saludo segun la hora del dispositivo */
function greetingByTime(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos dias'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/**
 * Pestaña principal con el panorama financiero del dia y alertas de cobro.
 * @returns Pantalla de inicio compuesta por organismos informativos
 */
export default function Home() {
  const router = useRouter()
  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency = settings?.baseCurrency ?? 'USD'
  const expensesState = useExpenses(ratesState.rates, baseCurrency, settings?.reminderHour ?? 9)
  const incomesState = useIncomes(ratesState.rates, baseCurrency)

  // Aviso temporal al terminar un refresco manual de tasas.
  const [ratesNotice, setRatesNotice] = useState<{ ok: boolean } | null>(null)
  const wasRefreshing = useRef(false)

  // Descarte en sesion de confirmaciones de cobro pospuestas
  const [dismissedPaydayIds, setDismissedPaydayIds] = useState<Set<string>>(new Set())
  const [confirmingReceipt, setConfirmingReceipt] = useState(false)

  const activePendingIncome: Income | null =
    incomesState.pendingConfirmations.find((income) => !dismissedPaydayIds.has(income.id)) ?? null

  async function handleConfirmPending(income: Income): Promise<void> {
    setConfirmingReceipt(true)
    try {
      await incomesState.confirmReceipt(income)
    } finally {
      setConfirmingReceipt(false)
    }
  }

  function handleDismissPending(income: Income): void {
    setDismissedPaydayIds((prev) => new Set(prev).add(income.id))
  }

  useEffect(() => {
    if (ratesState.refreshing) {
      wasRefreshing.current = true
      return
    }

    if (wasRefreshing.current && ratesState.lastRefreshOk !== null) {
      wasRefreshing.current = false
      setRatesNotice({ ok: ratesState.lastRefreshOk })
    }
  }, [ratesState.refreshing, ratesState.lastRefreshOk])

  return (
    <Screen
      scrollable
      onRefresh={() => ratesState.refresh()}
      refreshing={ratesState.refreshing}
      overlay={
        ratesNotice ? (
          <AlertDialog
            visible
            title={ratesNotice.ok ? 'Todo en orden' : 'Algo fallo'}
            message={
              ratesNotice.ok
                ? 'Tasas actualizadas correctamente'
                : 'No se pudieron actualizar las tasas'
            }
            tone={ratesNotice.ok ? 'success' : 'danger'}
            onClose={() => setRatesNotice(null)}
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
          summary={expensesState.monthlySummary}
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
            payments={expensesState.upcomingPayments}
            onPaymentPress={(id) => router.push({ pathname: '/expense/[id]', params: { id } })}
          />
        </View>
      </View>

      <PaydayNoticeDialog
        visible={activePendingIncome !== null}
        income={activePendingIncome}
        loading={confirmingReceipt}
        onConfirm={() => activePendingIncome && void handleConfirmPending(activePendingIncome)}
        onDismiss={() => activePendingIncome && handleDismissPending(activePendingIncome)}
      />
    </Screen>
  )
}
