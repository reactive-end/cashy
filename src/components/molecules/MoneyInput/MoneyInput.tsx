/**
 * Molecula MoneyInput: captura monetaria cents-first con edicion de
 * decimales, encapsulada en un hijo aislado.
 *
 * Comportamiento:
 * - Nace prerellenado con "0.00" y cada digito empuja la cifra desde
 *   los decimales (0.01 -> 0.10 -> 1.00 -> 10.00).
 * - Pulsar "." o "," conserva la parte entera y pasa a llenar solo
 *   los dos decimales de derecha a izquierda ("10.00" + "." + "3" +
 *   "6" -> 10.36); un tercer digito desplaza los decimales (10.67).
 * - Borrar retrocede naturalmente y sale del modo decimales al vaciar.
 * - El cursor queda libre: editar en mitad del texto reinterpreta los
 *   digitos por peso posicional sin perder el valor.
 * - Boton X para limpiar el campo cuando tiene contenido.
 */

import { useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'
import { amountAfterInput, initialAmountState, type AmountState } from '@src/lib/money'

import type { MoneyInputProps } from './MoneyInput.d'

/**
 * Renderiza prefijo de simbolo, campo de monto y boton de limpieza.
 * @param props Simbolo, callback de centavos y testID opcional
 * @returns Campo monetario prerellenado con 0.00 y accion limpiar
 */
export function MoneyInput({ symbol, onCents, testID }: MoneyInputProps) {
  const [estado, setEstado] = useState<AmountState>(initialAmountState)

  const alCambiarTexto = (entrada: string) => {
    const siguiente = amountAfterInput(estado, entrada)

    setEstado(siguiente)
    onCents(siguiente.centavos)
  }

  const limpiar = () => {
    const base = initialAmountState()

    setEstado(base)
    onCents(base.centavos)
  }

  return (
    <View className="flex-row items-center gap-2">
      <Typography variant="display" className="text-faint">
        {symbol}
      </Typography>

      <TextInput
        className="flex-1 py-1 font-display text-[28px] text-ink"
        value={estado.texto}
        onChangeText={alCambiarTexto}
        keyboardType="number-pad"
        autoCorrect={false}
        spellCheck={false}
        testID={testID}
      />

      {estado.centavos > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpiar monto"
          className="size-8 items-center justify-center rounded-full border border-line active:opacity-60"
          onPress={limpiar}
        >
          <Icon name="close" size={14} color={COLORS.faint} />
        </Pressable>
      ) : null}
    </View>
  )
}
