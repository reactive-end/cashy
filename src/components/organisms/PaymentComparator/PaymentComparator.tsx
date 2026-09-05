/**
 * Organismo PaymentComparator: comparador de ofertas y metodos de pago
 * que enfrenta dos opciones en distintas divisas, detecta la opcion mas
 * ventajosa y desglosa la tasa implicita del comercio.
 */

import { Pressable, View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { MoneyInput } from '@src/components/molecules/MoneyInput'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { currencySymbol, formatAmount } from '@src/lib/format'
import type { Currency } from '@src/types/domain'

import type { PaymentComparatorProps } from './PaymentComparator.d'
import { usePaymentComparator } from './usePaymentComparator'

/** Opciones de divisas disponibles para cada oferta */
const CURRENCY_OPTIONS = [
  { value: 'VES', label: 'Bs.' },
  { value: 'USD', label: '$' },
  { value: 'EUR', label: '€' },
  { value: 'USDT', label: 'USDT' }
]

/**
 * Organismo que renderiza la comparacion de pagos frente a frente.
 * @param props Tasas del dia y moneda base activa
 * @returns Interfaz interactiva de comparacion con desglose contable
 */
export function PaymentComparator({
  rates,
  baseCurrency,
  testID = 'payment-comparator'
}: PaymentComparatorProps) {
  const {
    currencyA,
    currencyB,
    amountA,
    amountB,
    comparison,
    handleCentsChangeA,
    handleCurrencyChangeA,
    handleCentsChangeB,
    handleCurrencyChangeB,
    handleSwapOffers,
    handleReset
  } = usePaymentComparator(rates, baseCurrency)

  const isEvaluated = comparison.winner !== 'NONE'

  return (
    <View className="gap-5" testID={testID}>
      {/* Cabecera descriptiva */}
      <View className="gap-2.5">
        <Typography variant="body" className="text-muted text-[13px]">
          Compara dos precios en distintas monedas para saber con cual pierdes menos dinero.
        </Typography>
        {(amountA > 0 || amountB > 0) && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar montos"
            onPress={handleReset}
            className="w-full items-center justify-center rounded-xl py-2 bg-card border border-line active:opacity-60"
            testID="btn-reset-comparator"
          >
            <Typography variant="caption" className="text-muted font-sans-medium">
              Limpiar
            </Typography>
          </Pressable>
        )}
      </View>

      {/* Tarjeta Oferta A */}
      <Card
        className={`gap-3 ${comparison.winner === 'A' ? 'border-accent bg-accentSoft/30' : ''}`}
        testID="card-offer-a"
      >
        <View className="flex-row items-baseline justify-between gap-3">
          <View className="flex-row items-center gap-2">
            <Typography variant="label" className="font-sans-semibold">
              Opción A
            </Typography>
            {comparison.winner === 'A' && (
              <View className="flex-row items-center gap-1 rounded-full bg-accent px-2 py-0.5">
                <Icon name="check" size={12} color="paper" />
                <Typography variant="caption" className="text-white text-[11px] font-sans-bold">
                  Recomendada
                </Typography>
              </View>
            )}
          </View>
          <Typography variant="figure" className="text-[14px] text-accent">
            {formatAmount(amountA, currencyA)}
          </Typography>
        </View>

        <MoneyInput
          symbol={currencySymbol(currencyA)}
          onCents={handleCentsChangeA}
          testID="input-monto-a"
        />

        <SegmentedControl
          options={CURRENCY_OPTIONS}
          value={currencyA}
          onChange={(val) => handleCurrencyChangeA(val as Currency)}
        />
      </Card>

      {/* Boton intercambiar */}
      <View className="items-center -my-2 z-10">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Intercambiar opciones"
          onPress={handleSwapOffers}
          className="size-10 items-center justify-center rounded-full border border-line bg-card shadow-md active:opacity-60"
          testID="btn-swap-offers"
        >
          <Icon name="repeat" size={18} color="ink" />
        </Pressable>
      </View>

      {/* Tarjeta Oferta B */}
      <Card
        className={`gap-3 ${comparison.winner === 'B' ? 'border-accent bg-accentSoft/30' : ''}`}
        testID="card-offer-b"
      >
        <View className="flex-row items-baseline justify-between gap-3">
          <View className="flex-row items-center gap-2">
            <Typography variant="label" className="font-sans-semibold">
              Opción B
            </Typography>
            {comparison.winner === 'B' && (
              <View className="flex-row items-center gap-1 rounded-full bg-accent px-2 py-0.5">
                <Icon name="check" size={12} color="paper" />
                <Typography variant="caption" className="text-white text-[11px] font-sans-bold">
                  Recomendada
                </Typography>
              </View>
            )}
          </View>
          <Typography variant="figure" className="text-[14px] text-accent">
            {formatAmount(amountB, currencyB)}
          </Typography>
        </View>

        <MoneyInput
          symbol={currencySymbol(currencyB)}
          onCents={handleCentsChangeB}
          testID="input-monto-b"
        />

        <SegmentedControl
          options={CURRENCY_OPTIONS}
          value={currencyB}
          onChange={(val) => handleCurrencyChangeB(val as Currency)}
        />
      </Card>

      {/* Tarjeta de Veredicto y Resultados */}
      {isEvaluated ? (
        <Card highlighted className="gap-4" testID="card-verdict">
          <View className="gap-1">
            <View className="flex-row items-center gap-2">
              <Icon
                name={comparison.winner === 'EQUAL' ? 'info' : 'check'}
                size={18}
                color="accent"
              />
              <Typography variant="label" className="text-accent font-sans-bold">
                Veredicto
              </Typography>
            </View>
            <Typography variant="display" className="text-[20px] leading-[26px]">
              {comparison.verdictTitle}
            </Typography>
            <Typography variant="body" className="text-muted text-[14px]">
              {comparison.verdictSubtitle}
            </Typography>
          </View>

          {/* Desglose de equivalencias en moneda base */}
          <View className="gap-2 rounded-xl bg-card p-3 border border-line">
            <Typography variant="caption" className="text-faint font-sans-semibold">
              Costo real convertido a {baseCurrency}:
            </Typography>
            <View className="flex-row items-center justify-between">
              <Typography variant="caption" className="text-muted">
                Opción A ({formatAmount(amountA, currencyA)})
              </Typography>
              <Typography
                variant="body"
                className={`font-sans-semibold ${
                  comparison.winner === 'A' ? 'text-accent' : 'text-ink'
                }`}
              >
                {formatAmount(comparison.amountBaseA, baseCurrency)}
              </Typography>
            </View>
            <View className="flex-row items-center justify-between border-t border-line/50 pt-2">
              <Typography variant="caption" className="text-muted">
                Opción B ({formatAmount(amountB, currencyB)})
              </Typography>
              <Typography
                variant="body"
                className={`font-sans-semibold ${
                  comparison.winner === 'B' ? 'text-accent' : 'text-ink'
                }`}
              >
                {formatAmount(comparison.amountBaseB, baseCurrency)}
              </Typography>
            </View>
          </View>

          {/* Tasa implicita detectada */}
          {comparison.implicitRate ? (
            <View
              className={`gap-1.5 rounded-xl p-3 border ${
                comparison.implicitRate.isOverpriced
                  ? 'bg-warnSoft/40 border-warn/30'
                  : 'bg-accentSoft/30 border-accent/20'
              }`}
              testID="card-implicit-rate"
            >
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-1.5 flex-1">
                  <Icon
                    name={comparison.implicitRate.isOverpriced ? 'alert' : 'info'}
                    size={16}
                    color={comparison.implicitRate.isOverpriced ? 'warn' : 'accent'}
                  />
                  <Typography variant="caption" className="font-sans-bold text-ink">
                    Tasa del comercio
                  </Typography>
                </View>
                <View
                  className={`rounded-md px-2 py-0.5 ${
                    comparison.implicitRate.isOverpriced ? 'bg-warn/20' : 'bg-accent/20'
                  }`}
                >
                  <Typography
                    variant="caption"
                    className={`text-[11px] font-sans-bold ${
                      comparison.implicitRate.isOverpriced ? 'text-warn' : 'text-accent'
                    }`}
                  >
                    {comparison.implicitRate.isOverpriced ? 'Sobrecosto' : 'Ventajosa'}{' '}
                    {comparison.implicitRate.gapPercentage}%
                  </Typography>
                </View>
              </View>

              <Typography variant="caption" className="text-muted text-[12px] leading-[17px]">
                {comparison.implicitRate.description}
              </Typography>
            </View>
          ) : null}
        </Card>
      ) : (
        <Card className="items-center justify-center p-6 gap-2 bg-card/60">
          <Icon name="calculator" size={24} color="muted" />
          <Typography variant="caption" className="text-muted text-center">
            Ingresa el monto de ambas opciones para ver la comparativa instantánea.
          </Typography>
        </Card>
      )}
    </View>
  )
}
