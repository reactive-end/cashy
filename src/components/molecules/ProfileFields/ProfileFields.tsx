/**
 * Molecula ProfileFields: los tres campos de identidad del usuario
 * (nombre, apellido y correo) reutilizados por el onboarding y por
 * la edicion de datos desde Ajustes. Cada campo muestra su mensaje
 * de error en rojo en cuanto el usuario teclea el primer caracter.
 */

import { View } from 'react-native'

import { Input } from '@src/components/atoms/Input'

import type { ProfileFieldsProps } from './ProfileFields.d'

/**
 * Renderiza nombre, apellido y correo con sus errores en vivo.
 * @param props Valores, errores calculados y callback de cambio
 * @returns Grupo de campos listo dentro de cualquier formulario
 */
export function ProfileFields({ values, errors, onChange, testIDBase }: ProfileFieldsProps) {
  return (
    <View className="gap-3">
      <Input
        label="Nombre"
        value={values.firstName}
        onChangeText={(text) => onChange('firstName', text)}
        placeholder="Ej. Carlos"
        errorMessage={errors.firstName ?? undefined}
        testID={testIDBase ? `${testIDBase}-firstName` : undefined}
      />

      <Input
        label="Apellido"
        value={values.lastName}
        onChangeText={(text) => onChange('lastName', text)}
        placeholder="Ej. Perez"
        errorMessage={errors.lastName ?? undefined}
        testID={testIDBase ? `${testIDBase}-lastName` : undefined}
      />

      <Input
        label="Correo"
        value={values.email}
        onChangeText={(text) => onChange('email', text)}
        placeholder="usuario@dominio.com"
        errorMessage={errors.email ?? undefined}
        email
        testID={testIDBase ? `${testIDBase}-email` : undefined}
      />
    </View>
  )
}
