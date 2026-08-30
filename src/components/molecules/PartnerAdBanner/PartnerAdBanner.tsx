/**
 * Molecula PartnerAdBanner: renderiza un banner publicitario estilizado
 * para asociados y promociones con soporte para enlaces externos, rutas internas y copia de cupones.
 */

import * as Clipboard from 'expo-clipboard'
import { useRouter } from 'expo-router'
import { memo, useState } from 'react'
import { Image, Linking, Pressable, View } from 'react-native'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'

import type { PartnerAdBannerProps } from './PartnerAdBanner.d'

export const PartnerAdBanner = memo(function PartnerAdBanner({
  ad,
  className = '',
  onPress
}: PartnerAdBannerProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  if (!ad) return null

  async function handlePress(): Promise<void> {
    onPress?.()

    if (!ad) return

    if (ad.cta_action === 'url') {
      try {
        const canOpen = await Linking.canOpenURL(ad.cta_payload)
        if (canOpen) {
          await Linking.openURL(ad.cta_payload)
        }
      } catch {
        // Fallback silencioso si no se puede abrir el enlace
      }
      return
    }

    if (ad.cta_action === 'route') {
      router.push(ad.cta_payload as never)
      return
    }

    if (ad.cta_action === 'copy') {
      await Clipboard.setStringAsync(ad.cta_payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const badgeText = copied ? 'Copiado al portapapeles' : ad.badge_text || 'Patrocinado'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${badgeText}: ${ad.title}. ${ad.description ?? ''}. ${ad.cta_label}`}
      onPress={handlePress}
      className={`overflow-hidden rounded-2xl border border-line bg-paper p-4 active:opacity-90 ${className}`}
      style={ad.bg_color ? { backgroundColor: ad.bg_color } : undefined}
    >
      {/* Cabecera con etiqueta de patrocinio y tipo de accion */}
      <View className="flex-row items-center justify-between pb-2">
        <View
          className={`rounded-full px-2.5 py-0.5 ${
            copied ? 'bg-accent text-white' : 'bg-accent-soft'
          }`}
        >
          <Typography
            variant="caption"
            className={`text-xs font-medium ${copied ? 'text-white' : 'text-accent'}`}
          >
            {badgeText}
          </Typography>
        </View>

        <Icon
          name={ad.cta_action === 'copy' ? 'copy' : ad.cta_action === 'route' ? 'chevronRight' : 'info'}
          size={16}
          color={ad.text_color ?? COLORS.faint}
        />
      </View>

      {/* Imagen ilustrativa opcional */}
      {ad.image_url ? (
        <View className="my-2.5 w-full overflow-hidden rounded-xl bg-line/20">
          <Image
            source={{ uri: ad.image_url }}
            style={{ width: '100%', height: 110 }}
            resizeMode="cover"
            accessibilityLabel={ad.title}
          />
        </View>
      ) : null}

      {/* Titulo y descripcion del anuncio */}
      <View className="gap-1 pt-1">
        <Typography
          variant="label"
          className="text-base font-semibold text-ink"
          style={ad.text_color ? { color: ad.text_color } : undefined}
        >
          {ad.title}
        </Typography>

        {ad.description ? (
          <Typography
            variant="caption"
            className="text-muted leading-[18px]"
            style={ad.text_color ? { color: ad.text_color, opacity: 0.85 } : undefined}
          >
            {ad.description}
          </Typography>
        ) : null}
      </View>

      {/* Boton de accion CTA */}
      <View className="flex-row items-center justify-end pt-3">
        <View
          className="flex-row items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5"
          style={ad.accent_color ? { backgroundColor: ad.accent_color } : undefined}
        >
          <Typography variant="caption" className="font-semibold text-white">
            {copied ? 'Copiado' : ad.cta_label}
          </Typography>
          <Icon
            name={copied ? 'check' : ad.cta_action === 'copy' ? 'copy' : 'chevronRight'}
            size={14}
            color="#FFFFFF"
          />
        </View>
      </View>
    </Pressable>
  )
})
