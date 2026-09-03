/**
 * Pantalla de bienvenida interactiva: explica el funcionamiento de Cashy
 * con ilustraciones a pantalla completa, indicadores de navegacion
 * y login obligatorio con Google OAuth para nuevos usuarios.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Image, View, type ImageSourcePropType } from 'react-native'

import logoGreen from '@assets/logo-green.png'
import slide1 from '@assets/welcome/slide1.jpg'
import slide2 from '@assets/welcome/slide2.jpg'
import slide3 from '@assets/welcome/slide3.jpg'
import slide4 from '@assets/welcome/slide4.jpg'
import { Button } from '@src/components/atoms/Button'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { WELCOME_SEEN_KEY } from '@src/constants/supabase'
import { emit } from '@src/lib/events'

interface ExplanatoryStep {
  title: string
  subtitle: string
  description: string
  image: ImageSourcePropType
}

const STEPS: readonly ExplanatoryStep[] = [
  {
    title: 'CONTROL TOTAL',
    subtitle: 'Gastos fijos y presupuestos al día',
    description:
      'Separa tus compromisos fijos de los gastos diarios. Monitorea lo que realmente te queda antes de fin de mes y mantén tus cuentas en orden sin complicaciones.',
    image: slide1
  },
  {
    title: 'MULTIMONEDA EN VIVO',
    subtitle: 'VES, USD, EUR y USDT al instante',
    description:
      'Consulta tasas oficiales del BCV y cotizaciones USDT P2P en tiempo real. Registra tus gastos e ingresos en cualquier moneda con conversión automática y exacta.',
    image: slide2
  },
  {
    title: 'RECORDATORIOS DE PAGO',
    subtitle: 'Nunca olvides una fecha límite',
    description:
      'Recibe avisos exactos para pagar tus servicios, compromisos o registrar tus cobros a tiempo. Configura la hora de tus alertas y mantén tus cuentas al día sin estrés.',
    image: slide3
  },
  {
    title: '100% PRIVADO Y SEGURO',
    subtitle: 'Tu información siempre protegida',
    description:
      'Tus finanzas permanecen seguras exclusivamente en tu dispositivo con bloqueo biométrico. Vincula tu cuenta de Google para verificar tu acceso con total tranquilidad.',
    image: slide4
  }
] as const

/**
 * Pantalla completa de bienvenida con estilo editorial y carrusel guiado.
 * @returns Vista de bienvenida no descartable
 */
export default function Welcome() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const stepData = STEPS[currentStep] ?? STEPS[0]
  const isLastStep = currentStep === STEPS.length - 1

  async function markSeenAndNavigate(): Promise<void> {
    await AsyncStorage.setItem(WELCOME_SEEN_KEY, 'true').catch(() => null)
    emit('welcome-seen-changed')
    router.replace('/login')
  }

  function handleNext(): void {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  function handlePrev(): void {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  return (
    <Screen noPadding className="bg-white">
      <View className="flex-1 bg-white justify-between px-5 py-2">
        {/* Cabecera consistente con las pantallas principales */}
        <View className="flex-row items-center justify-between pt-2 pb-1">
          <View className="flex-row items-center gap-3">
            <Image
              source={logoGreen}
              style={{ width: 34, height: 34 }}
              resizeMode="contain"
              accessibilityLabel="Cashy logo"
            />
            <Typography variant="display">Cashy</Typography>
          </View>
          <Typography variant="caption" className="text-faint">
            Paso {currentStep + 1} de {STEPS.length}
          </Typography>
        </View>

        {/* Contenido de la diapositiva: camuflado con el fondo, sin recuadro ni sombra */}
        <View className="flex-1 items-center justify-between py-2">
          {/* Ilustracion a ancho completo sin bordes */}
          <View className="w-full flex-1 items-center justify-center">
            <Image
              source={stepData.image}
              style={{ width: '100%', height: '100%', maxHeight: 310 }}
              resizeMode="contain"
              accessibilityLabel={stepData.title}
            />
          </View>

          {/* Bloque tipografico con la tipografia oficial de la app */}
          <View className="w-full items-center gap-2 px-2 pt-2">
            <Typography
              variant="display"
              className="text-center text-[26px] leading-[32px] text-ink"
            >
              {stepData.title}
            </Typography>
            <Typography variant="label" className="text-center text-accent">
              {stepData.subtitle}
            </Typography>
            <Typography variant="body" className="text-center text-muted leading-[23px] px-2 pt-1">
              {stepData.description}
            </Typography>
          </View>

          {/* Indicador de paginacion por puntos */}
          <View className="flex-row items-center justify-center gap-2 pt-4 pb-2">
            {STEPS.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full ${
                  index === currentStep ? 'w-7 bg-accent' : 'w-2 bg-line'
                }`}
              />
            ))}
          </View>
        </View>

        {/* Controles de navegacion y accion inferior */}
        <View className="w-full gap-3 pt-2">
          {isLastStep ? (
            <View className="gap-2">
              <Button
                label="Comenzar"
                variant="primary"
                fullWidth
                onPress={() => void markSeenAndNavigate()}
              />
              <View className="flex-row items-center justify-between px-2 pt-1">
                <Button label="Anterior" variant="ghost" onPress={handlePrev} />
                <Typography variant="caption" className="text-faint">
                  Acceso seguro y protegido
                </Typography>
              </View>
            </View>
          ) : (
            <View className="gap-2">
              <Button label="Siguiente" variant="primary" fullWidth onPress={handleNext} />
              <View className="flex-row items-center justify-between px-2 pt-1">
                {currentStep > 0 ? (
                  <Button label="Anterior" variant="ghost" onPress={handlePrev} />
                ) : (
                  <View />
                )}
                <Button label="Saltar" variant="ghost" onPress={() => void markSeenAndNavigate()} />
              </View>
            </View>
          )}
        </View>
      </View>
    </Screen>
  )
}
