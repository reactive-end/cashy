/**
 * Pantalla EditIncome: modificacion de una fuente de ingreso existente.
 * Carga los datos del ingreso segun el parametro id de la ruta y
 * persiste los cambios actualizados en la base de datos local.
 * La logica de carga previa y guardado reside en useEditIncome.
 */

import { Stack, useLocalSearchParams } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { IncomeEditor } from '@src/components/organisms/IncomeEditor'
import { COLORS } from '@src/constants/theme'
import { useEditIncome } from '@src/hooks/useEditIncome'

export default function EditIncome() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { income, values, setValues, loading, saving, handleSave, close } = useEditIncome(id)

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-5 py-4">
        <Typography variant="title">Editar ingreso</Typography>
        <Pressable
          onPress={close}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          <Icon name="close" size={22} color={COLORS.muted} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="py-12 items-center justify-center">
            <Typography variant="caption">Cargando ingreso...</Typography>
          </View>
        ) : !income ? (
          <Typography variant="body">Este ingreso ya no existe.</Typography>
        ) : (
          <IncomeEditor
            values={values}
            onChange={setValues}
            actionLabel="Guardar cambios"
            loading={saving}
            onConfirm={() => void handleSave()}
            onCancel={close}
            testIDBase="income"
          />
        )}

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  )
}
