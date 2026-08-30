/**
 * Subpantalla de Ajustes: Moneda base.
 * Permite cambiar la divisa de consolidacion de resumenes y muestra las tasas del dia.
 */

import { useRouter } from 'expo-router'
import { Pressable, View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { formatAmount } from '@src/lib/format'
import { BASE_CURRENCIES, type BaseCurrency } from '@src/types/domain'

/** Opciones de moneda base para el control segmentado */
const CURRENCY_OPTIONS = BASE_CURRENCIES.map((currency) => ({ value: currency, label: currency }))

export default function CurrencySettings() {
  const router = useRouter()
  const { settings, changeBaseCurrency } = useSettings()
  const { rates } = useRates()

  return (
    <Screen scrollable>
      <View className="gap-6 pt-6 pb-12">
        {/* Cabecera con boton volver y titulo */}
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a Ajustes"
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
          >
            <Icon name="back" size={20} color="#1C1C1A" />
          </Pressable>
          <Typography variant="display">Moneda base</Typography>
        </View>

        {/* Selector de moneda */}
        <Card className="gap-3">
          <Typography variant="label">Divisa principal</Typography>
          <Typography variant="caption">
            Los resúmenes y balances convierten todos tus gastos e ingresos a esta moneda usando las
            tasas oficiales del día.
          </Typography>
          <SegmentedControl
            options={CURRENCY_OPTIONS}
            value={(settings?.baseCurrency ?? 'USD') as BaseCurrency}
            onChange={(currency) => void changeBaseCurrency(currency)}
          />
        </Card>

        {/* Resumen de tasas vigentes */}
        <Card className="gap-3">
          <Typography variant="label">Tasas de cambio activas</Typography>
          <Typography variant="caption">
            Fuentes: dolarapi.com (BCV) y criptoya.com (P2P)
          </Typography>

          <View className="gap-2 divide-y divide-line pt-1">
            <View className="flex-row items-center justify-between pt-2">
              <Typography variant="body" className="font-medium text-ink">
                Dólar Oficial (BCV)
              </Typography>
              <Typography variant="body" className="font-semibold text-accent">
                {rates?.bcvUsd ? formatAmount(rates.bcvUsd, 'VES') : 'Consultando...'}
              </Typography>
            </View>

            <View className="flex-row items-center justify-between pt-2">
              <Typography variant="body" className="font-medium text-ink">
                Euro Oficial (BCV)
              </Typography>
              <Typography variant="body" className="font-semibold text-accent">
                {rates?.bcvEur ? formatAmount(rates.bcvEur, 'VES') : 'Consultando...'}
              </Typography>
            </View>

            <View className="flex-row items-center justify-between pt-2">
              <Typography variant="body" className="font-medium text-ink">
                USDT P2P
              </Typography>
              <Typography variant="body" className="font-semibold text-accent">
                {rates?.usdtSellP2p ? formatAmount(rates.usdtSellP2p, 'VES') : 'Consultando...'}
              </Typography>
            </View>
          </View>
        </Card>
      </View>
    </Screen>
  )
}
