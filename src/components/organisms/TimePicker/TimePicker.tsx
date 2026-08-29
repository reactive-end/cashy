/**
 * Organismo TimePicker: selector de hora y minuto en forma de reloj
 * analogico propio del proyecto. Muestra la hora vigente en formato
 * 12 horas y abre un modal con una esfera de dos pasos (hora con
 * periodo am/pm y minutos en pasos de cinco con ajuste fino),
 * reemplazando listas y selectores nativos del sistema.
 */

import { Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { ModalBackdrop } from '@src/components/molecules/ModalBackdrop'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { COLORS } from '@src/constants/theme'
import { formatTime12 } from '@src/lib/format'

import type { TimePickerProps } from './TimePicker.d'
import { useTimePicker } from './useTimePicker'

/** Opciones fijas del control segmentado am/pm */
const MERIDIEM_OPTIONS = [
  { value: 'am', label: 'AM' },
  { value: 'pm', label: 'PM' }
] as const

/**
 * Renderiza el campo presionable, la esfera analogica de dos pasos
 * y los controles de confirmacion.
 * @param props Hora/minuto vigentes, callback y accesibilidad
 * @returns Selector tipo reloj para tarjetas de ajustes
 */
export function TimePicker({
  hour,
  minute,
  onChange,
  disabled = false,
  accessibilityLabel
}: TimePickerProps) {
  const {
    open,
    openPicker,
    close,
    step,
    hour24,
    meridiem,
    minute: currentMinute,
    selectHour,
    selectMeridiem,
    selectMinute,
    adjustMinute,
    confirm,
    hourMarks,
    minuteMarks
  } = useTimePicker({ hour, minute, onChange })

  const marks = step === 'hour' ? hourMarks : minuteMarks

  return (
    <View>
      <Pressable
        onPress={openPicker}
        disabled={disabled}
        className={`flex-row items-center justify-between rounded-xl border border-line bg-paper px-4 py-3 ${
          disabled ? 'opacity-40' : 'active:opacity-70'
        }`}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: formatTime12(hour, minute) }}
      >
        <Typography variant="body">{formatTime12(hour, minute)}</Typography>
        <Icon name="clock" size={20} color={COLORS.muted} />
      </Pressable>

      <ModalBackdrop visible={open} onRequestClose={close}>
        <Typography variant="label">Selecciona la hora</Typography>

        <View className="items-center gap-0.5 py-2">
          <Typography variant="display">{formatTime12(hour24, currentMinute)}</Typography>
          <Typography variant="caption" className="text-faint">
            {step === 'hour'
              ? 'Toca la hora sobre la esfera'
              : 'Toca los minutos o afina con los botones'}
          </Typography>
        </View>

        <SegmentedControl
          options={[...MERIDIEM_OPTIONS]}
          value={meridiem}
          onChange={selectMeridiem}
        />

        <View className="my-3 aspect-square w-full rounded-full border border-line bg-paper">
          <View
            className="absolute size-2 rounded-full bg-accent"
            style={{ left: '50%', top: '50%', marginLeft: -4, marginTop: -4 }}
          />

          {marks.map((mark) => {
            const accessibleLabel =
              step === 'hour'
                ? `Hora ${mark.label} ${meridiem === 'am' ? 'a.m.' : 'p.m.'}`
                : `${mark.label} minutos`

            return (
              <Pressable
                key={mark.label}
                onPress={() =>
                  step === 'hour' ? selectHour(mark.value) : selectMinute(mark.value)
                }
                style={[
                  mark.position,
                  {
                    marginLeft: -20,
                    marginTop: -20
                  }
                ]}
                className={`absolute size-10 items-center justify-center rounded-full ${
                  mark.selected ? 'bg-accent' : ''
                }`}
                accessibilityRole="button"
                accessibilityLabel={accessibleLabel}
                accessibilityState={{ selected: mark.selected }}
                testID={`timepicker-${step}-${mark.value}`}
              >
                <Typography
                  variant="figure"
                  className={mark.selected ? 'text-paper' : 'text-ink'}
                  style={{ color: mark.selected ? COLORS.paper : COLORS.ink }}
                >
                  {mark.label}
                </Typography>
              </Pressable>
            )
          })}
        </View>

        {step === 'minute' ? (
          <View className="flex-row items-center justify-center gap-3">
            <Button
              label="-1 min"
              variant="secondary"
              size="medium"
              onPress={() => adjustMinute(-1)}
            />
            <Typography variant="figure">{String(currentMinute).padStart(2, '0')} min</Typography>
            <Button
              label="+1 min"
              variant="secondary"
              size="medium"
              onPress={() => adjustMinute(1)}
            />
          </View>
        ) : null}

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Button label="Cancelar" variant="ghost" fullWidth onPress={close} />
          </View>
          <View className="flex-1">
            <Button label="Aceptar" variant="primary" fullWidth onPress={confirm} />
          </View>
        </View>
      </ModalBackdrop>
    </View>
  )
}
