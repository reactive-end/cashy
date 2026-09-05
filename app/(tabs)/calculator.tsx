/**
 * Calculator screen: converts an amount from one managed currency
 * into the other three (Bolivars, Dollars, Euros and USDT) using
 * the daily BCV and P2P sell rates.
 */

import { setStringAsync } from 'expo-clipboard'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { MoneyInput } from '@src/components/molecules/MoneyInput'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { PaymentComparator } from '@src/components/organisms/PaymentComparator'
import { COLORS } from '@src/constants/theme'
import { useRates } from '@src/hooks/useRates'
import { useSettings } from '@src/hooks/useSettings'
import { convert } from '@src/lib/conversions'
import { currencySymbol, formatAmount, formatNumber } from '@src/lib/format'
import { amountFromCents } from '@src/lib/money'
import { CURRENCIES, type BaseCurrency, type Currency } from '@src/types/domain'

/**
 * Pestaña calculadora de equivalencias entre divisas del dia y comparador de pagos.
 * @returns Entrada de monto con selector de origen y tres resultados o comparador
 */
/** Etiquetas descriptivas por moneda con la fuente de la tasa */
const CURRENCY_LABELS: Record<Currency, string> = {
  VES: 'Bolivares',
  USD: 'Dolares · Tasa BCV',
  EUR: 'Euros · Tasa BCV',
  USDT: 'USDT · Venta P2P'
}

export default function Calculator() {
  const router = useRouter()
  const ratesState = useRates()
  const { settings } = useSettings()
  const baseCurrency: BaseCurrency = settings?.baseCurrency ?? 'USD'
  const [mode, setMode] = useState<'converter' | 'comparator'>('converter')
  const [amountCents, setAmountCents] = useState(0)
  const [origin, setOrigin] = useState<Currency>('USD')
  const [copiedCurrency, setCopiedCurrency] = useState<Currency | null>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  // Callback estable: MoneyInput nunca se re-renderiza desde el padre.
  const handleCentsChange = useCallback((cents: number) => setAmountCents(cents), [])

  const handleCopy = useCallback(async (target: Currency, formattedText: string) => {
    await setStringAsync(formattedText)
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current)
    }
    setCopiedCurrency(target)
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedCurrency(null)
    }, 1500)
  }, [])

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
        <View className="flex-row items-center justify-between">
          <Typography variant="display">Calculadora</Typography>
          <Button
            label="Mercado"
            icon="shoppingBag"
            variant="secondary"
            onPress={() => router.push('/market')}
            testID="btn-open-market"
          />
        </View>

        <SegmentedControl
          options={[
            { value: 'converter', label: 'Equivalencias' },
            { value: 'comparator', label: 'Comparador' }
          ]}
          value={mode}
          onChange={(val) => setMode(val as 'converter' | 'comparator')}
        />

        {mode === 'converter' ? (
          <>
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
                {results.map((result) => {
                  const formatted = formatAmount(result.convertedAmount, result.target)
                  const isCopied = copiedCurrency === result.target

                  return (
                    <Card key={result.target} noPadding className="px-4 py-3.5">
                      <View className="flex-row items-center justify-between gap-3">
                        <View className="flex-1 flex-row items-center gap-2.5">
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Copiar monto en ${CURRENCY_LABELS[result.target]}`}
                            testID={`btn-copy-${result.target.toLowerCase()}`}
                            onPress={() => {
                              void handleCopy(result.target, formatNumber(result.convertedAmount))
                            }}
                            hitSlop={8}
                            className="-ml-1 rounded-md p-1 active:opacity-60"
                          >
                            <Icon
                              name={isCopied ? 'check' : 'copy'}
                              size={18}
                              color={isCopied ? COLORS.accent : COLORS.muted}
                            />
                          </Pressable>
                          <Typography variant="caption" className="flex-shrink text-faint">
                            {CURRENCY_LABELS[result.target]}
                          </Typography>
                        </View>
                        <Typography variant="title" numberOfLines={1} adjustsFontSizeToFit>
                          {formatted}
                        </Typography>
                      </View>
                    </Card>
                  )
                })}
              </View>
            )}
          </>
        ) : (
          <PaymentComparator rates={ratesState.rates} baseCurrency={baseCurrency} />
        )}
      </View>
    </Screen>
  )
}
