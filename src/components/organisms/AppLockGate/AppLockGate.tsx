/**
 * Organismo AppLockGate: pantalla de bloqueo biometrico local.
 * Intercepta el renderizado de la aplicacion cuando la opcion de
 * biometria esta activa, exigiendo autenticacion para desbloquear.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { useSettings } from '@src/hooks/useSettings'
import { authenticateWithBiometrics } from '@src/lib/biometrics'

import type { AppLockGateProps } from './AppLockGate.d'

/** Tiempo maximo en segundo plano antes de volver a solicitar biometria (60s) */
export const INACTIVITY_LOCK_THRESHOLD_MS = 60 * 1000

/**
 * Envoltorio de proteccion de acceso.
 * Solo muestra los elementos hijos si la biometria no esta habilitada
 * o si el usuario ya se autentico exitosamente.
 */
export function AppLockGate({ children }: AppLockGateProps) {
  const { settings } = useSettings()
  const biometricsEnabled = settings?.biometricsEnabled ?? false

  const [isUnlocked, setIsUnlocked] = useState(false)
  const backgroundTimeRef = useRef<number | null>(null)

  const handleUnlock = useCallback(async (): Promise<void> => {
    const success = await authenticateWithBiometrics()
    if (success) {
      setIsUnlocked(true)
    }
  }, [])

  // Intenta desbloquear al montar o cuando se habilita la proteccion
  useEffect(() => {
    if (!biometricsEnabled) return

    let isMounted = true
    void authenticateWithBiometrics().then((success) => {
      if (isMounted && success) {
        setIsUnlocked(true)
      }
    })

    return () => {
      isMounted = false
    }
  }, [biometricsEnabled])

  // Escucha transiciones de AppState para re-bloquear tras inactividad
  useEffect(() => {
    if (!biometricsEnabled) return

    const handleAppStateChange = (nextState: AppStateStatus): void => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimeRef.current = Date.now()
      } else if (nextState === 'active') {
        const backgroundTime = backgroundTimeRef.current
        if (backgroundTime !== null) {
          const elapsed = Date.now() - backgroundTime
          if (elapsed >= INACTIVITY_LOCK_THRESHOLD_MS) {
            setIsUnlocked(false)
            void authenticateWithBiometrics().then((success) => {
              if (success) {
                setIsUnlocked(true)
              }
            })
          }
        }
        backgroundTimeRef.current = null
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [biometricsEnabled])

  // Si la proteccion no esta activa o ya esta desbloqueado, muestra el contenido
  if (!biometricsEnabled || isUnlocked) {
    return children
  }

  return (
    <Screen>
      <View testID="app-lock-screen" className="flex-1 items-center justify-center px-6">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-sand-200 dark:bg-sand-800">
          <Icon name="lock" size={40} />
        </View>

        <Typography variant="title" className="mb-2 text-center">
          Cashy bloqueado
        </Typography>

        <Typography variant="body" className="mb-8 text-center text-sand-600 dark:text-sand-400">
          Confirma tu identidad para acceder a tus finanzas y saldos.
        </Typography>

        <Button
          label="Desbloquear"
          variant="primary"
          icon="lock"
          fullWidth
          onPress={() => void handleUnlock()}
          testID="app-lock-unlock-button"
        />
      </View>
    </Screen>
  )
}
