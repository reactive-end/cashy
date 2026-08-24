/**
 * Atomo Badge: pastilla compacta para comunicar estados
 * como vencimientos proximos, pagos realizados o metadatos.
 */

import { View } from 'react-native'

import { Typography } from '@src/components/atoms/Typography'

import type { BadgeProps, BadgeTone } from './Badge.d'

/** Clases de fondo y texto asociadas a cada tono semantico */
const CLASSES_BY_TONE: Readonly<Record<BadgeTone, string>> = {
  neutral: 'bg-paper border-line text-muted',
  success: 'bg-accent-soft border-accent-soft text-accent',
  warning: 'bg-warn-soft border-warn-soft text-warn',
  danger: 'bg-danger-soft border-danger-soft text-danger'
}

/**
 * Renderiza la pastilla con el tono indicado.
 * @param props Texto y tono semantico
 * @returns Etiqueta pill estilizada
 */
export function Badge({ text, tone = 'neutral' }: BadgeProps) {
  return (
    <View className={`rounded-full border px-2.5 py-1 ${CLASSES_BY_TONE[tone]}`}>
      <Typography variant="caption" className="font-sans-semibold">
        {text}
      </Typography>
    </View>
  )
}
