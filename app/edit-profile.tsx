/**
 * Edit profile screen: modal para actualizar la identidad del
 * usuario (nombre, apellido y correo) y administrar sus ingresos
 * con alta, edicion y baja inmediata en la base local.
 */

import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog } from '@src/components/molecules/AlertDialog'
import { ProfileFields } from '@src/components/molecules/ProfileFields'
import { IncomeEditor } from '@src/components/organisms/IncomeEditor'
import { IncomesTable } from '@src/components/organisms/IncomesTable'
import { COLORS } from '@src/constants/theme'
import { useProfileEditor } from '@src/hooks/useProfileEditor'

/**
 * Edicion de los datos capturados durante el onboarding.
 * @returns Pantalla modal de gestion de datos e ingresos
 */
export default function EditProfile() {
  const router = useRouter()
  const editor = useProfileEditor()
  const [notice, setNotice] = useState<{ ok: boolean } | null>(null)

  async function saveIdentity(): Promise<void> {
    const saved = await editor.saveProfile()

    setNotice({ ok: saved })
  }

  return (
    <Screen scrollable>
      <View className="gap-5 pt-6">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.back()}
            className="size-11 items-center justify-center rounded-full border border-line bg-card active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Volver a ajustes"
          >
            <Icon name="back" size={20} color={COLORS.ink} />
          </Pressable>
          <Typography variant="display">Tus datos</Typography>
        </View>

        <View className="gap-3">
          <Typography variant="label">Identidad</Typography>
          <ProfileFields
            values={editor.profile}
            errors={editor.profileErrors}
            onChange={editor.changeProfileField}
            testIDBase="profile"
          />
          <Button
            label="Guardar identidad"
            variant="secondary"
            fullWidth
            disabled={!editor.isProfileValid}
            loading={editor.savingProfile}
            onPress={() => void saveIdentity()}
          />
        </View>

        <View className="gap-3">
          <Typography variant="label">Ingresos</Typography>
          <IncomeEditor
            values={editor.row}
            onChange={editor.changeRow}
            actionLabel={editor.editingId ? 'Guardar cambios' : 'Agregar ingreso'}
            onConfirm={() => void editor.confirmRow()}
            onCancel={editor.editingId ? editor.cancelRowEdit : undefined}
            testIDBase="income"
          />

          {editor.incomes.length > 0 ? (
            <IncomesTable
              incomes={editor.incomes}
              onEdit={editor.editIncome}
              onRemove={(id) => void editor.removeIncome(id)}
              testIDBase="incomes-table"
            />
          ) : null}
        </View>
      </View>

      <AlertDialog
        visible={notice !== null}
        title={notice?.ok ? 'Todo en orden' : 'Algo fallo'}
        message={notice?.ok ? 'Datos guardados correctamente' : 'No se pudieron guardar tus datos.'}
        tone={notice?.ok ? 'success' : 'danger'}
        onClose={() => setNotice(null)}
      />
    </Screen>
  )
}
