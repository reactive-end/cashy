/**
 * Organismo RatesGrid: presenta las tres referencias del dia
 * (Dolar BCV, Euro BCV y USDT venta P2P) con antiguedad del dato,
 * reintento ante fallos de red y refresco manual.
 * Cada tarjeta decide su carga de forma independiente: un valor
 * no finito muestra skeleton sin romper el layout de las demas.
 */

import { ActivityIndicator, Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { RateCard } from '@src/components/molecules/RateCard'
import { COLORS } from '@src/constants/theme'
import { formatNumber, ageLabel } from '@src/lib/format'

import type { RatesGridProps } from './RatesGrid.d'

/**
 * Verifica que un valor de tasa sea numerico y finito.
 * @param valor Numero proveniente del snapshot
 * @returns true cuando la tasa puede mostrarse con seguridad
 */
function esTasaUtil(valor: number): boolean {
  return Number.isFinite(valor) && valor > 0
}

/**
 * Renderiza la cuadricula completa de tasas.
 * @param props Estado reactivo proveniente de useRates
 * @returns Seccion de tasas lista para la pantalla de inicio
 */
export function RatesGrid({ ratesState }: RatesGridProps) {
  const { rates, error, refresh, refreshing } = ratesState

  const dolarListo = esTasaUtil(rates?.bcvUsd ?? Number.NaN)
  const euroListo = esTasaUtil(rates?.bcvEur ?? Number.NaN)
  const usdtListo = esTasaUtil(rates?.usdtSellP2p ?? Number.NaN)
  const algunaLista = dolarListo || euroListo || usdtListo

  const manejarRefresh = () => {
    if (refreshing) return
    void refresh()
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Typography variant="label">Tasas de hoy</Typography>

        <View className="flex-row items-center gap-2">
          {algunaLista && rates ? (
            <Typography variant="caption">{ageLabel(rates.fetchedAt)}</Typography>
          ) : null}

          <Pressable
            onPress={manejarRefresh}
            disabled={refreshing}
            className={`active:opacity-60 ${refreshing ? 'opacity-50' : ''}`}
            accessibilityRole="button"
            accessibilityLabel="Actualizar tasas"
            testID="rates-refresh"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Icon name="refresh" size={16} color={COLORS.muted} />
            )}
          </Pressable>
        </View>
      </View>

      {error ? (
        <View className="items-start gap-2 rounded-2xl border border-line bg-card p-4">
          <View className="flex-row items-center gap-2">
            <Icon name="alert" size={18} color={COLORS.danger} />
            <Typography variant="figure">No pudimos actualizar las tasas</Typography>
          </View>
          <Typography variant="caption">{error}</Typography>
          <Button
            label="Reintentar"
            icon="refresh"
            variant="secondary"
            loading={refreshing}
            onPress={() => void refresh()}
          />
        </View>
      ) : (
        <>
          <View className="flex-row gap-3">
            <RateCard
              className="flex-1 min-w-0"
              title="Dolar BCV"
              value={dolarListo && rates ? `Bs. ${formatNumber(rates.bcvUsd)}` : ''}
              icon="dollar"
              loading={!dolarListo}
            />
            <RateCard
              className="flex-1 min-w-0"
              title="Euro BCV"
              value={euroListo && rates ? `Bs. ${formatNumber(rates.bcvEur)}` : ''}
              icon="euro"
              loading={!euroListo}
            />
          </View>

          <RateCard
            className="w-full min-w-0"
            title="USDT · Venta P2P"
            value={usdtListo && rates ? `Bs. ${formatNumber(rates.usdtSellP2p)}` : ''}
            icon="usdt"
            loading={!usdtListo}
          />
        </>
      )}
    </View>
  )
}
