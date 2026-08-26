/**
 * Edit profile screen: modal para actualizar la identidad del
 * usuario (nombre, apellido y correo) y administrar sus ingresos
 * con alta, edicion y baja inmediata en la base local. Segmentado
 * en pestanas Identidad e Ingresos para evitar sobrecarga visual.
 */

import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog } from '@src/components/molecules/AlertDialog'
import { EmptyState } from '@src/components/molecules/EmptyState'
import { IncomeFormSheet } from '@src/components/molecules/IncomeFormSheet'
import { ProfileFields } from '@src/components/molecules/ProfileFields'
import { SegmentedControl } from '@src/components/molecules/SegmentedControl'
import { IncomesTable } from '@src/components/organisms/IncomesTable'
import { COLORS } from '@src/constants/theme'
import { useProfileEditor } from '@src/hooks/useProfileEditor'

/** Secciones disponibles para la edicion de datos */
type ProfileSection = 'identity' | 'incomes'

/** Opciones del control segmentado */
const SECTION_OPTIONS = [
  { value: 'identity', label: 'Identidad' },
  { value: 'incomes', label: 'Ingresos' }
] as const

/**
 * Edicion de los datos capturados durante el onboarding.
 * @returns Pantalla modal de gestion de datos e ingresos
 */
export default function EditProfile() {
  const router = useRouter()
  const editor = useProfileEditor()
  const [section, setSection] = useState<ProfileSection>('identity')
  const [incomeSheetVisible, setIncomeSheetVisible] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean } | null>(null)

  function openCreateIncome(): void {
    editor.cancelRowEdit()
    setIncomeSheetVisible(true)
  }

  function openEditIncome(id: string): void {
    editor.editIncome(id)
    setIncomeSheetVisible(true)
  }

  async function handleConfirmIncome(): Promise<void> {
    const ok = await editor.confirmRow()
    if (ok) {
      setIncomeSheetVisible(false)
    }
  }

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

        <SegmentedControl options={[...SECTION_OPTIONS]} value={section} onChange={setSection} />

        {section === 'identity' ? (
          <Card className="gap-4 p-5">
            <Typography variant="label">Datos personales</Typography>
            <ProfileFields
              values={editor.profile}
              errors={editor.profileErrors}
              onChange={editor.changeProfileField}
              testIDBase="profile"
            />
            <Button
              label="Guardar identidad"
              variant="primary"
              fullWidth
              disabled={!editor.isProfileValid}
              loading={editor.savingProfile}
              onPress={() => void saveIdentity()}
            />
          </Card>
        ) : (
          <Card className="gap-4 p-5">
            <View className="flex-row items-center justify-between">
              <Typography variant="label">Fuentes de ingreso</Typography>
              {editor.incomes.length > 0 ? (
                <Typography variant="caption" className="text-faint">
                  {editor.incomes.length === 1 ? '1 fuente' : `${editor.incomes.length} fuentes`}
                </Typography>
              ) : null}
            </View>

            {editor.incomes.length === 0 ? (
              <EmptyState
                icon="savings"
                title="Sin fuentes de ingreso"
                message="Agrega tus ingresos mensuales para proyectar tu flujo de dinero."
                action={<Button label="Agregar ingreso" icon="add" onPress={openCreateIncome} />}
              />
            ) : (
              <View className="gap-3">
                <IncomesTable
                  incomes={editor.incomes}
                  onEdit={openEditIncome}
                  onRemove={(id) => void editor.removeIncome(id)}
                  testIDBase="incomes-table"
                />
                <Button
                  label="Agregar otro ingreso"
                  variant="secondary"
                  icon="add"
                  fullWidth
                  onPress={openCreateIncome}
                />
              </View>
            )}
          </Card>
        )}
      </View>

      <IncomeFormSheet
        visible={incomeSheetVisible}
        values={editor.row}
        onChange={editor.changeRow}
        actionLabel={editor.editingId ? 'Guardar cambios' : 'Agregar ingreso'}
        onConfirm={() => void handleConfirmIncome()}
        onClose={() => {
          editor.cancelRowEdit()
          setIncomeSheetVisible(false)
        }}
        title={editor.editingId ? 'Editar ingreso' : 'Nuevo ingreso'}
        testIDBase="income"
      />

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
