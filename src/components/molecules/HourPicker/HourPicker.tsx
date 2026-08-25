/**
 * Molecula HourPicker: selector de hora del dia propio del proyecto.
 * Muestra la hora vigente en formato 12 horas y abre un modal con
 * la lista completa de horas, reemplazando los selectores nativos
 * del sistema.
 */

import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { ModalBackdrop } from '@src/components/molecules/ModalBackdrop'
import { COLORS } from '@src/constants/theme'
import { formatHour12 } from '@src/lib/format'

import type { HourPickerProps } from './HourPicker.d'

/** Todas las horas del dia disponibles para seleccionar */
const HORAS: readonly number[] = Array.from({ length: 24 }, (_, hora) => hora)

/**
 * Renderiza el campo presionable y el modal de seleccion de horas.
 * @param value Hora seleccionada en formato 24 horas
 * @param onChange Accion al elegir una hora
 * @param disabled Bloquea la apertura del selector
 * @param accessibilityLabel Etiqueta de accesibilidad del campo
 * @returns Selector de hora para tarjetas de ajustes
 */
export function HourPicker({
  value,
  onChange,
  disabled = false,
  accessibilityLabel
}: HourPickerProps) {
  const [abierto, setAbierto] = useState(false)

  function elegir(hora: number): void {
    setAbierto(false)
    onChange(hora)
  }

  return (
    <View>
      <Pressable
        onPress={() => setAbierto(true)}
        disabled={disabled}
        className={`flex-row items-center justify-between rounded-xl border border-line bg-paper px-4 py-3 ${
          disabled ? 'opacity-40' : 'active:opacity-70'
        }`}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: formatHour12(value) }}
      >
        <Typography variant="body">{formatHour12(value)}</Typography>
        <Icon name="clock" size={20} color={COLORS.muted} />
      </Pressable>

      <ModalBackdrop visible={abierto} onRequestClose={() => setAbierto(false)}>
        <Typography variant="label">Selecciona la hora</Typography>

        <ScrollView className="mt-3 max-h-80" nestedScrollEnabled>
          <View className="gap-1">
            {HORAS.map((hora) => {
              const seleccionada = hora === value

              return (
                <Pressable
                  key={hora}
                  onPress={() => elegir(hora)}
                  className={`flex-row items-center justify-between rounded-lg px-3 py-2.5 ${
                    seleccionada ? 'bg-accent-soft' : 'active:bg-paper'
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={formatHour12(hora)}
                  accessibilityState={{ selected: seleccionada }}
                >
                  <Typography variant="body">{formatHour12(hora)}</Typography>
                  {seleccionada ? <Icon name="check" size={18} color={COLORS.accent} /> : null}
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      </ModalBackdrop>
    </View>
  )
}
