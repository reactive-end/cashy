/**
 * Home screen: daily overview for the user.
 * Shows the day rates (BCV and USDT), the monthly summary
 * in base currency, payday confirmation modal and the fixed payments coming due.
 * La logica de estado, alertas y consultas reside en useHomeScreen.
 */

import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog } from '@src/components/molecules/AlertDialog'
import { DueExpenseNoticeDialog } from '@src/components/molecules/DueExpenseNoticeDialog'
import { PartnerAdBanner } from '@src/components/molecules/PartnerAdBanner'
import { PaydayNoticeDialog } from '@src/components/molecules/PaydayNoticeDialog'
import { SectionHeader } from '@src/components/molecules/SectionHeader'
import { AnnouncementModal } from '@src/components/organisms/AnnouncementModal'
import { MonthlySummary } from '@src/components/organisms/MonthlySummary'
import { RatesGrid } from '@src/components/organisms/RatesGrid'
import { UpcomingPayments } from '@src/components/organisms/UpcomingPayments'
import { useHomeScreen } from '@src/hooks/useHomeScreen'

export default function Home() {
  const {
    greeting,
    ratesState,
    baseCurrency,
    ratesNotice,
    setRatesNotice,
    monthlySummary,
    upcomingPayments,
    activePendingIncome,
    confirmingReceipt,
    handleConfirmPending,
    handleDismissPending,
    activePendingDueExpense,
    confirmingExpensePayment,
    handleConfirmDueExpense,
    handleDismissDueExpense,
    partnerAd,
    announcements,
    dismissAllAnnouncements,
    openNewExpense,
    openExpenseDetail
  } = useHomeScreen()

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
          <Typography variant="caption">{greeting}</Typography>
          <Typography variant="display">Tu panorama de hoy</Typography>
        </View>

        <RatesGrid ratesState={ratesState} />

        <PartnerAdBanner ad={partnerAd} />

        <MonthlySummary
          summary={monthlySummary}
          baseCurrency={baseCurrency}
          loading={ratesState.loading || !ratesState.rates}
        />

        <View className="gap-3">
          <Button label="Registrar gasto" icon="add" fullWidth onPress={openNewExpense} />
          <SectionHeader title="Próximos pagos" />
          <UpcomingPayments payments={upcomingPayments} onPaymentPress={openExpenseDetail} />
        </View>
      </View>

      <PaydayNoticeDialog
        visible={activePendingIncome !== null}
        income={activePendingIncome}
        loading={confirmingReceipt}
        onConfirm={() => activePendingIncome && void handleConfirmPending(activePendingIncome)}
        onDismiss={() => activePendingIncome && handleDismissPending(activePendingIncome)}
      />

      <DueExpenseNoticeDialog
        visible={activePendingDueExpense !== null}
        expense={activePendingDueExpense}
        loading={confirmingExpensePayment}
        onConfirm={() =>
          activePendingDueExpense && void handleConfirmDueExpense(activePendingDueExpense)
        }
        onDismiss={() =>
          activePendingDueExpense && handleDismissDueExpense(activePendingDueExpense)
        }
      />

      <AnnouncementModal
        visible={announcements.length > 0}
        announcements={announcements}
        onDismiss={() => void dismissAllAnnouncements()}
      />
    </Screen>
  )
}
