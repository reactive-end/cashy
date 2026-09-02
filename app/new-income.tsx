/**
 * Pantalla NewIncome: creacion de fuentes de ingreso fijas o unicas.
 * Presentada como una pantalla modal dedicada sobre el arbol principal.
 * La logica de borrador, validacion y guardado reside en useNewIncome.
 */

import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { IncomeEditor } from '@src/components/organisms/IncomeEditor'
import { COLORS } from '@src/constants/theme'
import { useNewIncome } from '@src/hooks/useNewIncome'

export default function NewIncome() {
  const insets = useSafeAreaInsets()
  const { values, setValues, saving, handleSave, close } = useNewIncome()

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Typography variant="title">Nuevo ingreso</Typography>
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
        <IncomeEditor
          values={values}
          onChange={setValues}
          actionLabel="Guardar ingreso"
          loading={saving}
          onConfirm={() => void handleSave()}
          onCancel={close}
          testIDBase="income"
        />

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  )
}
