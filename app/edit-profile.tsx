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
  const [notice, setNotice] = useState<{ ok: boolean } | null>(null)

  function openCreateIncome(): void {
    router.push('/new-income')
  }

  function openEditIncome(id: string): void {
    router.push({ pathname: '/edit-income/[id]', params: { id } })
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
              <View className="items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-paper/60 p-6">
                <Typography variant="title" className="text-center">
                  Sin fuentes de ingreso
                </Typography>
                <Typography variant="caption" className="text-center text-[13px] leading-[18px]">
                  Agrega tus ingresos mensuales para proyectar tu flujo de dinero.
                </Typography>
                <Button
                  label="Agregar ingreso"
                  icon="add"
                  variant="primary"
                  fullWidth
                  onPress={openCreateIncome}
                />
              </View>
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
