/**
 * Atomo Input: campo de texto etiquetado con estados de foco y error.
 * Usado en formularios de gastos, montos, nombres y notas.
 */

import { TextInput, View } from 'react-native'

import { Typography } from '@src/components/atoms/Typography'

import type { InputProps } from './Input.d'
import { useInput } from './useInput'

/**
 * Renderiza el campo con etiqueta, prefijo opcional y mensaje de error.
 * @param props Configuracion visual y funcional del campo
 * @returns Campo de texto completo listo para formularios
 */
export function Input({
  testID,
  label,
  value,
  onChangeText,
  placeholder,
  numeric = false,
  prefix,
  errorMessage,
  multiline = false,
  disabled = false
}: InputProps) {
  const { containerClasses, prefixClasses, onFocus, onBlur } = useInput(
    Boolean(errorMessage),
    disabled
  )

  return (
    <View className="gap-1.5">
      <Typography variant="label">{label}</Typography>

      <View className={containerClasses}>
        {prefix ? (
          <Typography variant="figure" className={prefixClasses}>
            {prefix}
          </Typography>
        ) : null}

        <TextInput
          className="flex-1 py-2.5 font-sans text-[15px] text-ink"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#70706A"
          onFocus={onFocus}
          onBlur={onBlur}
          editable={!disabled}
          multiline={multiline}
          testID={testID}
          keyboardType={numeric ? 'decimal-pad' : 'default'}
          accessibilityLabel={label}
        />
      </View>

      {errorMessage ? (
        <Typography variant="caption" className="text-danger">
          {errorMessage}
        </Typography>
      ) : null}
    </View>
  )
}
