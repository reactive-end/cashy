/**
 * Servicios de autenticacion local y biometria.
 * Consulta disponibilidad de hardware y solicita desbloqueo
 * con huella dactilar, reconocimiento facial o credenciales del sistema.
 */

import * as LocalAuthentication from 'expo-local-authentication'

/**
 * Comprueba si el dispositivo cuenta con hardware biometrico y
 * tiene al menos un registro biometrico o credencial enrolada.
 * @returns true si el usuario puede autenticarse biometricamente
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    if (!hasHardware) return false

    return await LocalAuthentication.isEnrolledAsync()
  } catch {
    return false
  }
}

/**
 * Solicita autenticacion al usuario mediante el cuadro de dialogo del sistema.
 * Permite el fallback a PIN, patron o contrasena del dispositivo.
 * @param promptMessage Mensaje a mostrar en el cuadro de dialogo
 * @returns true si la autenticacion fue exitosa
 */
export async function authenticateWithBiometrics(
  promptMessage = 'Confirma tu identidad para ingresar a Cashy'
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Usar PIN del dispositivo',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false
    })

    return result.success
  } catch {
    return false
  }
}
