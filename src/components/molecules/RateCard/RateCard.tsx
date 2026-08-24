/**
 * Molecula RateCard: presenta una tasa del dia con su icono,
 * valor en bolivares y estado de carga mientras se consulta la red.
 * Layout blindado: altura minima, contenedor con overflow oculto,
 * fuente reducida y recorte automatico, de modo que valores muy
 * largos estiren jamas la tarjeta ni rompan el padding.
 */

import { View } from 'react-native'

import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'

import type { RateCardProps } from './RateCard.d'

/**
 * Renderiza la tarjeta de tasa individual.
 * @param props Titulo, valor formateado, icono, estado de carga y clases
 * @returns Tarjeta compacta para la cuadricula de tasas
 */
export function RateCard({ title, value, icon, loading = false, className }: RateCardProps) {
  return (
    <Card className={`min-h-[96px] gap-3 overflow-hidden ${className ?? ''}`}>
      <View className="size-9 items-center justify-center rounded-full bg-accent-soft">
        <Icon name={icon} size={18} color="#2F6B4F" />
      </View>

      <View className="w-full min-h-[40px] gap-0.5">
        <Typography variant="caption" numberOfLines={1}>
          {title}
        </Typography>

        {loading ? (
          <View className="h-[24px] w-24 justify-center rounded-md bg-line/60">
            <View className="h-3 w-16 rounded-full bg-line" />
          </View>
        ) : (
          <Typography
            variant="display"
            className="w-full text-[18px] leading-[22px]"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value || '--'}
          </Typography>
        )}
      </View>
    </Card>
  )
}
