/**
 * Calculator screen: converts an amount from one managed currency
 * into the other three (Bolivars, Dollars, Euros and USDT) using
 * the daily BCV and P2P sell rates.
 */

import { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { MoneyInput } from '@src/components/molecules/MoneyInput'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { useRates } from '@src/hooks/useRates'
import { convert } from '@src/lib/conversions'
import { currencySymbol, formatAmount } from '@src/lib/format'
import { amountFromCents } from '@src/lib/money'
import { CURRENCIES, type Currency } from '@src/types/domain'

/**
 * Pestaña calculadora de equivalencias entre divisas del dia.
 * @returns Entrada de monto con selector de origen y tres resultados
 */
/** Etiquetas descriptivas por moneda con la fuente de la tasa */
const CURRENCY_LABELS: Record<Currency, string> = {
  VES: 'Bolivares',
  USD: 'Dolares · Tasa BCV',
  EUR: 'Euros · Tasa BCV',
  USDT: 'USDT · Venta P2P'
}

export default function Calculator() {
  const ratesState = useRates()
  const [amountCents, setAmountCents] = useState(0)
  const [origin, setOrigin] = useState<Currency>('USD')

  // Callback estable: MoneyInput nunca se re-renderiza desde el padre.
  const handleCentsChange = useCallback((cents: number) => setAmountCents(cents), [])

  // Captura cents-first como el formulario de gastos: los digitos
  // tecleados empujan la cifra desde los decimales (0.01 -> 10.00).
  const amount = amountFromCents(amountCents)

  const results = useMemo(() => {
    const currentRates = ratesState.rates

    if (!currentRates) return []

    const computed: { target: Currency; convertedAmount: number }[] = []

    for (const target of CURRENCIES) {
      if (target === origin) continue

      computed.push({ target, convertedAmount: convert(amount, origin, target, currentRates) })
    }

    return computed
  }, [amount, origin, ratesState.rates])

  const refreshRates = async () => {
    await ratesState.refresh()
  }

  return (
    <Screen scrollable onRefresh={refreshRates} refreshing={ratesState.refreshing}>
      <View className="gap-6 pt-6">
        <Typography variant="display">Calculadora</Typography>

        <Card className="gap-4">
          <View className="flex-row items-baseline justify-between gap-3">
            <Typography variant="caption" className="text-faint">
              Monto a convertir
            </Typography>
            <Typography variant="figure" className="text-[14px] text-accent">
              {formatAmount(amount, origin)}
            </Typography>
          </View>

          <MoneyInput
            symbol={currencySymbol(origin)}
            onCents={handleCentsChange}
            testID="input-monto"
          />

          <SegmentedControl
            options={[
              { value: 'VES', label: 'Bs.' },
              { value: 'USD', label: '$' },
              { value: 'EUR', label: '€' },
              { value: 'USDT', label: 'USDT' }
            ]}
            value={origin}
            onChange={(value) => setOrigin(value as Currency)}
          />

          <Typography variant="caption" className="text-faint">
            {CURRENCY_LABELS[origin]}
          </Typography>
        </Card>

        {!ratesState.rates ? (
          <Typography variant="caption">Cargando tasas del dia...</Typography>
        ) : (
          <View className="gap-3">
            {results.map((result) => (
              <Card key={result.target} noPadding className="px-4 py-3.5">
                <View className="flex-row items-baseline justify-between gap-3">
                  <Typography variant="caption" className="text-faint">
                    {CURRENCY_LABELS[result.target]}
                  </Typography>
                  <Typography variant="title" numberOfLines={1} adjustsFontSizeToFit>
                    {formatAmount(result.convertedAmount, result.target)}
                  </Typography>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  )
}
