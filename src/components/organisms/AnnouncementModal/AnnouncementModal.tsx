/**
 * Organismo AnnouncementModal: modal a pantalla completa para presentar
 * comunicados, alertas de mantenimiento y noticias oficiales con paginacion interactiva,
 * enlaces clicables en el texto, boton de cierre superior y acciones primarias.
 */

import { useRouter } from 'expo-router'
import { memo, useState } from 'react'
import { Image, Linking, Modal, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button } from '@src/components/atoms/Button'
import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'
import type { AnnouncementTone, AppAnnouncement } from '@src/types/marketing'

import type { AnnouncementModalProps } from './AnnouncementModal.d'

/** Mapeo de tono visual a estilos de color */
function getToneStyles(tone: AnnouncementTone): {
  bg: string
  iconColor: string
  badgeText: string
} {
  switch (tone) {
    case 'warning':
      return {
        bg: 'bg-amber-50 border-amber-200',
        iconColor: '#D97706',
        badgeText: 'text-amber-800'
      }
    case 'danger':
      return { bg: 'bg-red-50 border-red-200', iconColor: '#DC2626', badgeText: 'text-red-700' }
    case 'success':
      return {
        bg: 'bg-emerald-50 border-emerald-200',
        iconColor: '#059669',
        badgeText: 'text-emerald-800'
      }
    case 'accent':
      return {
        bg: 'bg-accent-soft border-accent/20',
        iconColor: COLORS.accent,
        badgeText: 'text-accent'
      }
    case 'info':
    default:
      return { bg: 'bg-sky-50 border-sky-200', iconColor: '#0284C7', badgeText: 'text-sky-800' }
  }
}

/** Nombre amigable de la categoria */
function getCategoryLabel(category: AppAnnouncement['category']): string {
  switch (category) {
    case 'alert':
      return 'Alerta importante'
    case 'maintenance':
      return 'Mantenimiento'
    case 'tip':
      return 'Consejo financiero'
    case 'promo':
      return 'Promoción'
    case 'news':
    default:
      return 'Novedades'
  }
}

/**
 * Renderiza un texto permitiendo URLs externas (http/https) interactivas y enlaces markdown.
 */
function FormattedMessage({ text }: { text: string }) {
  const parts: { type: 'text' | 'link'; content: string; url?: string }[] = []
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g

  let lastIndex = 0
  let match: RegExpExecArray | null = linkRegex.exec(text)

  while (match !== null) {
    const matchIndex = match.index

    if (matchIndex > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, matchIndex)
      })
    }

    if (match[1] && match[2]) {
      // Enlace markdown [label](url)
      parts.push({
        type: 'link',
        content: match[1],
        url: match[2]
      })
    } else if (match[3]) {
      // URL directa https://...
      parts.push({
        type: 'link',
        content: match[3],
        url: match[3]
      })
    }

    lastIndex = linkRegex.lastIndex
    match = linkRegex.exec(text)
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    })
  }

  async function handleOpenUrl(url: string): Promise<void> {
    try {
      const can = await Linking.canOpenURL(url)
      if (can) {
        await Linking.openURL(url)
      }
    } catch {
      // Fallback silencioso
    }
  }

  return (
    <Typography variant="body" className="text-base text-muted leading-[24px]">
      {parts.map((part, index) => {
        if (part.type === 'link' && part.url) {
          const targetUrl = part.url
          return (
            <Typography
              key={index}
              variant="body"
              className="text-base font-semibold text-accent underline"
              accessibilityRole="link"
              accessibilityLabel={`Enlace a ${part.content}`}
              onPress={() => void handleOpenUrl(targetUrl)}
            >
              {part.content}
            </Typography>
          )
        }
        return (
          <Typography key={index} variant="body" className="text-base text-muted leading-[24px]">
            {part.content}
          </Typography>
        )
      })}
    </Typography>
  )
}

export const AnnouncementModal = memo(function AnnouncementModal({
  visible,
  announcements,
  onDismiss
}: AnnouncementModalProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!visible || announcements.length === 0) return null

  const total = announcements.length
  const current = announcements[currentIndex] ?? announcements[0]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === total - 1
  const toneStyle = getToneStyles(current.tone)

  function handleNext(): void {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      onDismiss()
    }
  }

  function handlePrev(): void {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  async function handleCtaAction(
    action?: AppAnnouncement['primary_cta_action'],
    payload?: string | null
  ): Promise<void> {
    if (!action || action === 'dismiss') {
      onDismiss()
      return
    }

    if (action === 'url' && payload) {
      try {
        const can = await Linking.canOpenURL(payload)
        if (can) await Linking.openURL(payload)
      } catch {
        // Fallback silencioso
      }
      onDismiss()
      return
    }

    if (action === 'route' && payload) {
      router.navigate(payload as never)
      onDismiss()
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onDismiss}
      transparent={false}
    >
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-between px-6 py-4">
          {/* Barra superior con paginador o etiqueta y boton X de cierre */}
          <View className="flex-row items-center justify-between border-b border-line pb-3">
            <View className="flex-row items-center gap-2">
              <View className={`rounded-full border px-2.5 py-0.5 ${toneStyle.bg}`}>
                <Typography
                  variant="caption"
                  className={`text-xs font-semibold ${toneStyle.badgeText}`}
                >
                  {getCategoryLabel(current.category)}
                </Typography>
              </View>

              {total > 1 ? (
                <Typography variant="caption" className="text-faint">
                  {currentIndex + 1} de {total}
                </Typography>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar ventana de comunicados"
              onPress={onDismiss}
              className="h-10 w-10 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
            >
              <Icon name="close" size={20} color="#1C1C1A" />
            </Pressable>
          </View>

          {/* Cuerpo del comunicado actual con scroll */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}
            className="flex-1"
          >
            <View className="gap-4">
              {/* Icono tematico decorativo */}
              <View className="items-center justify-center pt-2">
                <View
                  className={`h-16 w-16 items-center justify-center rounded-full border ${toneStyle.bg}`}
                >
                  <Icon name={current.icon_name || 'bell'} size={32} color={toneStyle.iconColor} />
                </View>
              </View>

              {/* Imagen opcional si el comunicado la incluye */}
              {current.image_url ? (
                <View className="w-full overflow-hidden rounded-2xl bg-line/20">
                  <Image
                    source={{ uri: current.image_url }}
                    style={{ width: '100%', height: 180 }}
                    resizeMode="cover"
                    accessibilityLabel={current.title}
                  />
                </View>
              ) : null}

              {/* Titulo editorial */}
              <Typography variant="display" className="text-center text-2xl text-ink">
                {current.title}
              </Typography>

              {/* Mensaje explicativo con enlaces interactivos */}
              <View className="px-1">
                <FormattedMessage text={current.message} />
              </View>

              {/* Botones de accion propios del comunicado */}
              {current.primary_cta_label ? (
                <View className="gap-2 pt-4">
                  <Button
                    label={current.primary_cta_label}
                    variant="primary"
                    fullWidth
                    onPress={() =>
                      void handleCtaAction(current.primary_cta_action, current.primary_cta_payload)
                    }
                  />

                  {current.secondary_cta_label ? (
                    <Button
                      label={current.secondary_cta_label}
                      variant="ghost"
                      fullWidth
                      onPress={() =>
                        void handleCtaAction(
                          current.secondary_cta_action,
                          current.secondary_cta_payload
                        )
                      }
                    />
                  ) : null}
                </View>
              ) : null}
            </View>
          </ScrollView>

          {/* Pie de navegacion entre comunicados */}
          <View className="border-t border-line pt-4">
            {total > 1 ? (
              <View className="gap-3">
                {/* Paginador de puntos */}
                <View className="flex-row items-center justify-center gap-2">
                  {announcements.map((_, index) => (
                    <View
                      key={index}
                      className={`h-2 rounded-full ${
                        index === currentIndex ? 'w-6 bg-accent' : 'w-2 bg-line'
                      }`}
                    />
                  ))}
                </View>

                {/* Botones de navegacion anterior / siguiente */}
                <View className="flex-row items-center justify-between">
                  {isFirst ? (
                    <View className="w-24" />
                  ) : (
                    <Button
                      label="Anterior"
                      variant="ghost"
                      icon="chevronLeft"
                      onPress={handlePrev}
                    />
                  )}

                  <Button
                    label={isLast ? 'Entendido' : 'Siguiente'}
                    variant="primary"
                    icon={isLast ? 'check' : 'chevronRight'}
                    onPress={handleNext}
                  />
                </View>
              </View>
            ) : (
              <Button label="Entendido" variant="primary" fullWidth onPress={onDismiss} />
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
})
