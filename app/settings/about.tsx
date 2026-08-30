/**
 * Subpantalla de Ajustes: Acerca de Cashy.
 * Muestra el banner corporativo de la empresa, creditos de desarrollo para Rafael Pisani
 * y los pilares de privacidad y arquitectura de la aplicacion.
 */

import { useRouter } from 'expo-router'
import { Image, Pressable, View } from 'react-native'

import enterpriseBanner from '@assets/enterprise-img.jpg'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { COLORS } from '@src/constants/theme'
import { installedVersion } from '@src/services/appUpdate'

export default function AboutSettings() {
  const router = useRouter()

  return (
    <Screen scrollable>
      <View className="gap-6 pt-6 pb-12">
        {/* Cabecera con boton volver y titulo */}
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a Ajustes"
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
          >
            <Icon name="back" size={20} color="#1C1C1A" />
          </Pressable>
          <Typography variant="display">Acerca de</Typography>
        </View>

        {/* Imagen de la empresa */}
        <Card className="overflow-hidden p-0 border border-line">
          <Image
            source={enterpriseBanner}
            style={{ width: '100%', height: 180 }}
            resizeMode="cover"
            accessibilityLabel="Logo y fotografia corporativa de la empresa"
          />
        </Card>

        {/* Desarrollador */}
        <Card className="gap-3">
          <Typography variant="label">Desarrollador</Typography>
          <View className="flex-row items-center gap-3 pt-1">
            <View
              className="h-12 w-12 items-center justify-center rounded-full border border-line"
              style={{ backgroundColor: COLORS.accentSoft }}
            >
              <Icon name="user" size={24} color={COLORS.accent} />
            </View>
            <View className="flex-1">
              <Typography variant="body" className="font-semibold text-ink">
                Rafael Pisani
              </Typography>
              <Typography variant="caption" className="text-faint">
                Creador y Desarrollador Principal
              </Typography>
            </View>
          </View>
        </Card>

        {/* Informacion de Cashy */}
        <Card className="gap-3">
          <Typography variant="label">Sobre Cashy</Typography>
          <Typography variant="body" className="font-medium text-ink">
            Cashy · Finanzas Personales Multimoneda
          </Typography>
          <Typography variant="caption" className="text-faint">
            Versión {installedVersion() || '1.1.0'}
          </Typography>

          <Typography variant="caption">
            Diseñada especialmente para darte control total sobre tus finanzas en Venezuela con
            conversión multimoneda en vivo (BCV USD/EUR y USDT P2P), recordatorios de pago y
            presupuestos.
          </Typography>

          <Typography variant="caption">
            Arquitectura 100% local-first: tus datos viven en tu dispositivo. Sin rastreadores, sin
            publicidad y con total respeto a tu privacidad financiera.
          </Typography>
        </Card>
      </View>
    </Screen>
  )
}
