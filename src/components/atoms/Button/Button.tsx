/**
 * Atomo Button: boton del sistema con variantes primaria, secundaria,
 * fantasma y peligrosa, estados de carga y deshabilitado.
 */

import { ActivityIndicator, Pressable } from 'react-native'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'

import type { ButtonProps } from './Button.d'
import { useButton } from './useButton'

/**
 * Renderiza el boton aplicando variante, tamano y estado.
 * @param label Texto visible dentro del boton
 * @param onPress Accion al pulsar
 * @param variant Variante visual; por defecto primario
 * @param size Tamano del boton; por defecto mediano
 * @param icon Icono outlined mostrado antes de la etiqueta
 * @param disabled Bloquea interaccion y atenue el boton
 * @param loading Reemplaza la etiqueta por un estado ocupado
 * @param fullWidth Estira el boton a todo el ancho disponible
 * @returns Boton listo para acciones de formulario y navegacion
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  disabled = false,
  loading = false,
  fullWidth = false
}: ButtonProps) {
  const { containerClasses, textClasses, iconColor, handlePress } = useButton({
    variant,
    size,
    disabled,
    loading,
    fullWidth,
    onPress
  })

  return (
    <Pressable
      className={containerClasses}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={iconColor} /> : null}
          <Typography className={textClasses}>{label}</Typography>
        </>
      )}
    </Pressable>
  )
}
