/**
 * MarketCalculator organism: specialized calculator for grocery/market
 * shopping that accumulates item prices in a chosen currency, shows
 * real-time conversions into all other currencies, and allows registering
 * the total as a unique expense.
 */

import { Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Input } from '@src/components/atoms/Input'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog } from '@src/components/molecules/AlertDialog'
import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog'
import { ModalBackdrop } from '@src/components/molecules/ModalBackdrop'
import { MoneyInput } from '@src/components/molecules/MoneyInput'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { COLORS } from '@src/constants/theme'
import { currencySymbol, formatAmount, formatNumber } from '@src/lib/format'
import type { Currency } from '@src/types/domain'

import type { MarketCalculatorProps } from './MarketCalculator.d'
import { useMarketCalculator } from './useMarketCalculator'

/** Etiquetas descriptivas por moneda con la fuente de la tasa */
const CURRENCY_LABELS: Record<Currency, string> = {
  VES: 'Bolivares',
  USD: 'Dolares · Tasa BCV',
  EUR: 'Euros · Tasa BCV',
  USDT: 'USDT · Venta P2P'
}

/**
 * Organismo de calculadora de compras de mercado.
 * @param props Moneda inicial y callback de guardado de gasto
 * @returns Interfaz interactiva de suma y conversion en vivo
 */
export function MarketCalculator({
  initialCurrency = 'USD',
  rates,
  onRegisterExpense
}: MarketCalculatorProps) {
  const calc = useMarketCalculator(initialCurrency, onRegisterExpense, rates)

  return (
    <View className="gap-5">
      {/* Selector de divisa activa de la compra */}
      <Card className="gap-3">
        <Typography variant="label">Moneda de compra</Typography>
        <SegmentedControl
          options={[
            { value: 'VES', label: 'Bs.' },
            { value: 'USD', label: '$' },
            { value: 'EUR', label: '€' },
            { value: 'USDT', label: 'USDT' }
          ]}
          value={calc.currency}
          onChange={(val) => calc.handleCurrencyChange(val as Currency)}
        />
        <Typography variant="caption" className="text-faint">
          {CURRENCY_LABELS[calc.currency]}
        </Typography>
      </Card>

      {/* 2) Formulario de agregar articulo */}
      <Card className="gap-4">
        <Typography variant="title">Sumar articulo</Typography>

        <Input
          label="Nombre o detalle (opcional)"
          value={calc.itemName}
          onChangeText={calc.setItemName}
          placeholder="Ej: Harina PAN, Queso, Cafe..."
          testID="input-item-name"
        />

        <View className="gap-1.5">
          <View className="flex-row items-baseline justify-between">
            <Typography variant="label">Precio</Typography>
            <Typography variant="figure" className="text-[13px] text-accent">
              {formatAmount(calc.currentAmount, calc.currency)}
            </Typography>
          </View>
          <MoneyInput
            key={`money-input-${calc.inputKey}`}
            symbol={currencySymbol(calc.currency)}
            onCents={calc.handleCentsChange}
            testID="input-item-amount"
          />
        </View>

        <Button
          label="Sumar producto"
          icon="add"
          size="medium"
          fullWidth
          disabled={calc.currentAmount <= 0}
          onPress={calc.addItem}
          testID="btn-add-item"
        />
      </Card>

      {/* 3) Card del total acumulado y equivalencias */}
      <Card className="gap-4">
        <View className="flex-row items-center justify-between gap-3">
          <Typography
            variant="caption"
            className="text-faint"
            style={{ textAlignVertical: 'center' }}
          >
            Total acumulado ({calc.items.length}{' '}
            {calc.items.length === 1 ? 'articulo' : 'articulos'})
          </Typography>
          <Typography
            variant="display"
            className="text-accent"
            style={{ fontSize: 18, lineHeight: 22, textAlignVertical: 'center' }}
            testID="total-mercado"
          >
            {formatAmount(calc.totalAmount, calc.currency)}
          </Typography>
        </View>

        {calc.equivalences.length > 0 ? (
          <View className="gap-2.5 border-t border-line/60 pt-3">
            <Typography variant="caption" className="text-faint">
              Equivalencias al cambio
            </Typography>
            <View className="gap-2">
              {calc.equivalences.map((eq) => {
                const formatted = formatAmount(eq.convertedAmount, eq.target)
                const isCopied = calc.copiedCurrency === eq.target

                return (
                  <View
                    key={eq.target}
                    className="flex-row items-center justify-between rounded-xl bg-sand-50/70 px-3.5 py-2.5 dark:bg-sand-900/30"
                  >
                    <View className="flex-1 flex-row items-center gap-2">
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Copiar monto en ${CURRENCY_LABELS[eq.target]}`}
                        testID={`btn-copy-${eq.target.toLowerCase()}`}
                        onPress={() =>
                          void calc.handleCopy(eq.target, formatNumber(eq.convertedAmount))
                        }
                        hitSlop={8}
                        className="-ml-1 rounded-md p-1 active:opacity-60"
                      >
                        <Icon
                          name={isCopied ? 'check' : 'copy'}
                          size={16}
                          color={isCopied ? COLORS.accent : COLORS.muted}
                        />
                      </Pressable>
                      <Typography variant="caption" className="text-faint">
                        {CURRENCY_LABELS[eq.target]}
                      </Typography>
                    </View>
                    <Typography variant="figure" className="text-[14px]">
                      {formatted}
                    </Typography>
                  </View>
                )
              })}
            </View>
          </View>
        ) : null}
      </Card>

      {/* Listado de articulos */}
      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Typography variant="title">Articulos ({calc.items.length})</Typography>
          {calc.items.length > 0 ? (
            <Pressable
              onPress={() => calc.setShowConfirmClear(true)}
              accessibilityRole="button"
              accessibilityLabel="Vaciar lista de mercado"
              testID="btn-clear-items"
              className="flex-row items-center gap-1 active:opacity-60"
            >
              <Icon name="trash" size={15} color={COLORS.danger} />
              <Typography variant="caption" className="text-danger">
                Vaciar
              </Typography>
            </Pressable>
          ) : null}
        </View>

        {calc.items.length === 0 ? (
          <View className="items-center justify-center py-6">
            <Icon name="shoppingBag" size={32} color={COLORS.muted} />
            <Typography variant="caption" className="mt-2 text-center text-faint">
              Aun no has agregado articulos.{'\n'}Ingresa un precio arriba y pulsa Sumar producto.
            </Typography>
          </View>
        ) : (
          <View className="divide-y divide-line/40">
            {calc.items.map((item, index) => (
              <View
                key={item.id}
                className="flex-row items-center justify-between py-3"
                testID={`item-row-${index}`}
              >
                <View className="flex-1 pr-3">
                  <Typography variant="body" numberOfLines={1}>
                    {item.name}
                  </Typography>
                </View>
                <View className="flex-row items-center gap-3">
                  <Typography variant="figure">
                    {formatAmount(item.amount, calc.currency)}
                  </Typography>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${item.name}`}
                    testID={`btn-remove-${item.id}`}
                    onPress={() => calc.removeItem(item.id)}
                    hitSlop={8}
                    className="p-1 active:opacity-60"
                  >
                    <Icon name="close" size={16} color={COLORS.muted} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Boton principal para registrar como gasto */}
      {onRegisterExpense ? (
        <Button
          label="Registrar como gasto"
          icon="check"
          size="large"
          fullWidth
          disabled={calc.totalAmount <= 0}
          onPress={calc.openRegisterModal}
          testID="btn-open-register-expense"
        />
      ) : null}

      {/* Confirmacion para vaciar lista */}
      <ConfirmDialog
        visible={calc.showConfirmClear}
        title="Vaciar lista"
        message="Se eliminaran todos los articulos agregados de la lista de compras."
        confirmLabel="Vaciar"
        destructive
        onConfirm={calc.clearItems}
        onCancel={() => calc.setShowConfirmClear(false)}
      />

      {/* Paso 1: Modal para preguntar si desea incluir costo adicional */}
      <ModalBackdrop visible={calc.showExtraCostModal} onRequestClose={calc.closeExtraCostModal}>
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <Typography variant="title">Costo adicional</Typography>
            <Pressable
              onPress={calc.closeExtraCostModal}
              hitSlop={8}
              className="active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel="Cerrar costo adicional"
              testID="btn-close-extra-cost"
            >
              <Icon name="close" size={20} color={COLORS.muted} />
            </Pressable>
          </View>

          <Typography variant="caption" className="text-faint">
            ¿Deseas agregar un costo extra a tu compra? Por ejemplo, una bolsa o empaque.
          </Typography>

          <View className="gap-1.5">
            <Typography variant="label">Moneda</Typography>
            <SegmentedControl
              options={[
                { value: 'VES', label: 'Bs.' },
                { value: 'USD', label: '$' },
                { value: 'EUR', label: '€' },
                { value: 'USDT', label: 'USDT' }
              ]}
              value={calc.extraCostCurrency}
              onChange={(val) => calc.setExtraCostCurrency(val as Currency)}
            />
          </View>

          <View className="gap-1.5">
            <View className="flex-row items-baseline justify-between">
              <Typography variant="label">Monto adicional</Typography>
              {calc.extraCostEquivalent ? (
                <Typography variant="caption" className="text-accent">
                  ≈ {calc.extraCostEquivalent}
                </Typography>
              ) : null}
            </View>
            <MoneyInput
              key={`extra-cost-input-${calc.extraCostCurrency}-${calc.extraCostInputKey}`}
              symbol={currencySymbol(calc.extraCostCurrency)}
              onCents={calc.setExtraCostCents}
              testID="input-extra-cost-amount"
            />
          </View>

          <Input
            label="Detalle (opcional)"
            value={calc.extraCostName}
            onChangeText={calc.setExtraCostName}
            placeholder="Bolsa"
            testID="input-extra-cost-name"
          />

          <View className="flex-row gap-2 pt-2">
            <View className="flex-1">
              <Button
                label="Omitir"
                variant="secondary"
                fullWidth
                onPress={calc.skipExtraCost}
                testID="btn-skip-extra-cost"
              />
            </View>
            <View className="flex-1">
              <Button
                label="Continuar"
                icon="check"
                fullWidth
                onPress={calc.applyExtraCostAndContinue}
                testID="btn-apply-extra-cost"
              />
            </View>
          </View>
        </View>
      </ModalBackdrop>

      {/* Paso 2: Modal para registrar el gasto unico */}
      <ModalBackdrop visible={calc.showRegisterModal} onRequestClose={calc.closeRegisterModal}>
        <View className="gap-4">
          <Typography variant="title">Registrar como gasto</Typography>
          <Typography variant="caption" className="text-faint">
            Se creara un gasto unico con el total acumulado de tu compra.
          </Typography>

          <View className="rounded-xl border border-line bg-paper p-3.5">
            <Typography variant="caption" className="text-faint">
              Monto a registrar
            </Typography>
            <Typography variant="display" className="text-accent">
              {formatAmount(calc.totalAmount, calc.currency)}
            </Typography>
          </View>

          <Input
            label="Nombre del gasto"
            value={calc.expenseName}
            onChangeText={calc.setExpenseName}
            placeholder="Mercado"
            testID="input-expense-name"
          />

          <Input
            label="Categoria"
            value={calc.expenseCategory}
            onChangeText={calc.setExpenseCategory}
            placeholder="Compras"
            testID="input-expense-category"
          />

          <View className="flex-row gap-2 pt-2">
            <View className="flex-1">
              <Button
                label="Cancelar"
                variant="secondary"
                fullWidth
                onPress={calc.closeRegisterModal}
                disabled={calc.savingExpense}
              />
            </View>
            <View className="flex-1">
              <Button
                label="Guardar"
                icon="check"
                fullWidth
                loading={calc.savingExpense}
                onPress={() => void calc.confirmRegisterExpense()}
                testID="btn-confirm-save-expense"
              />
            </View>
          </View>
        </View>
      </ModalBackdrop>

      {/* Dialogo de exito al registrar */}
      <AlertDialog
        visible={calc.showSuccessDialog}
        title="Gasto registrado"
        message="Tu compra de mercado fue guardada exitosamente en el historial de gastos."
        tone="success"
        onClose={calc.closeSuccessDialog}
      />
    </View>
  )
}
