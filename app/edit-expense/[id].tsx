/**
 * EditExpense screen: modificacion y borrado de un gasto existente.
 * Carga el gasto segun el parametro id de la ruta /edit-expense/[id].
 * La logica de consulta y persistencia reside en useEditExpense.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@src/components/atoms/Icon'
import { Typography } from '@src/components/atoms/Typography'
import { ExpenseForm } from '@src/components/organisms/ExpenseForm'
import { useEditExpense } from '@src/hooks/useEditExpense'

export default function EditExpense() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { expense, loading, handleSave, handleDelete } = useEditExpense(id)

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-3 px-5 py-4">
        <Pressable onPress={() => router.back()} className="active:opacity-60">
          <Icon name="back" size={22} color="#6B6B66" />
        </Pressable>
        <Typography variant="title">Editar gasto</Typography>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Typography variant="caption">Cargando...</Typography>
        ) : !expense ? (
          <Typography variant="body">Este gasto ya no existe.</Typography>
        ) : (
          <ExpenseForm initialExpense={expense} onSave={handleSave} onDelete={handleDelete} />
        )}
        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  )
}
