/**
 * Onboarding screen: wizard bloqueante por pasos que captura la
 * identidad del usuario (nombre, apellido y correo) y su tabla de
 * ingresos con dia de cobro. Se muestra al abrir la app por primera
 * vez o mientras el perfil no este completo; cerrar la app a medio
 * camino regresa aqui porque nada se persiste hasta finalizar.
 */

import { useState } from 'react'
import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog } from '@src/components/molecules/AlertDialog'
import { EmptyState } from '@src/components/molecules/EmptyState'
import { IncomeFormSheet } from '@src/components/molecules/IncomeFormSheet'
import { ProfileFields } from '@src/components/molecules/ProfileFields'
import { IncomesTable } from '@src/components/organisms/IncomesTable'
import { COLORS } from '@src/constants/theme'
import { emptyRow, TOTAL_STEPS, useOnboarding } from '@src/hooks/useOnboarding'

/** Titulos descriptivos por paso del wizard */
const STEP_TITLES = ['Cuentanos quien eres', 'Tus ingresos mensuales'] as const

/** Subtitulos explicativos por paso del wizard */
const STEP_SUBTITLES = [
  'Necesitamos tu nombre, apellido y un correo de contacto.',
  'Agrega cada fuente de ingreso e indica que dia del mes la cobras.'
] as const

/** Icono decorativo asociado a cada paso */
const STEP_ICONS = ['user', 'savings'] as const

/**
 * Indicador de progreso tipo pastillas del wizard.
 * @param props Paso actual (base 0) y total de pasos
 * @returns Fila de pastillas con el avance marcado en accent
 */
function ProgressPills({ current, total }: { current: number; total: number }) {
  return (
    <View className="w-full gap-1.5">
      <View className="w-full flex-row items-center gap-2">
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index <= current ? 'bg-accent' : 'bg-line'}`}
          />
        ))}
      </View>
      <Typography variant="caption" className="text-faint">
        Paso {current + 1} de {total}
      </Typography>
    </View>
  )
}

/**
 * Wizard de bienvenida en dos pasos con validacion en tiempo real.
 * Al terminar solo persiste y emite profile-changed: el gate del
 * layout raiz se encarga de entrar al arbol principal.
 * @returns Pantalla completa no descartable del onboarding
 */
export default function Onboarding() {
  const wizard = useOnboarding()
  const [saveFailed, setSaveFailed] = useState(false)
  const [incomeSheetVisible, setIncomeSheetVisible] = useState(false)

  const onIdentityStep = wizard.step === 0

  function openCreateIncome(): void {
    wizard.changeRow(emptyRow())
    setIncomeSheetVisible(true)
  }

  function openEditIncome(id: string): void {
    wizard.editIncome(id)
    setIncomeSheetVisible(true)
  }

  function handleConfirmIncome(): void {
    if (wizard.confirmRow()) {
      setIncomeSheetVisible(false)
    }
  }

  async function finish(): Promise<void> {
    const saved = await wizard.finish()

    if (!saved) {
      setSaveFailed(true)
    }
  }

  return (
    <Screen>
      <View className="flex-1 gap-5 pt-8">
        <View className="gap-3">
          <ProgressPills current={wizard.step} total={TOTAL_STEPS} />
          <View className="gap-1.5">
            <Typography variant="display">{STEP_TITLES[wizard.step]}</Typography>
            <Typography variant="body" className="text-muted">
              {STEP_SUBTITLES[wizard.step]}
            </Typography>
          </View>
        </View>

        {onIdentityStep ? (
          <Card className="gap-4 p-5">
            <View className="size-12 items-center justify-center rounded-full bg-accent-soft">
              <Icon name={STEP_ICONS[0]} size={22} color={COLORS.accent} />
            </View>
            <ProfileFields
              values={wizard.profile}
              errors={wizard.profileErrors}
              onChange={wizard.changeProfileField}
              testIDBase="onboarding"
            />
          </Card>
        ) : (
          <Card className="gap-4 p-5">
            <View className="flex-row items-center justify-between">
              <View className="size-12 items-center justify-center rounded-full bg-accent-soft">
                <Icon name={STEP_ICONS[1]} size={22} color={COLORS.accent} />
              </View>
              {wizard.draftIncomes.length > 0 ? (
                <View className="flex-row items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5">
                  <Icon name="check" size={14} color={COLORS.accent} />
                  <Typography variant="caption" className="font-sans-semibold text-accent">
                    {wizard.draftIncomes.length === 1
                      ? '1 fuente registrada'
                      : `${wizard.draftIncomes.length} fuentes registradas`}
                  </Typography>
                </View>
              ) : null}
            </View>

            {wizard.draftIncomes.length === 0 ? (
              <EmptyState
                icon="savings"
                title="Sin fuentes de ingreso"
                message="Agrega cada ingreso mensual para proyectar tu flujo de dinero."
                action={<Button label="Agregar ingreso" icon="add" onPress={openCreateIncome} />}
              />
            ) : (
              <View className="gap-3">
                <IncomesTable
                  incomes={wizard.draftIncomes}
                  onEdit={openEditIncome}
                  onRemove={wizard.removeIncome}
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

        <View className="mt-auto gap-2.5">
          {onIdentityStep ? (
            <Button
              label="Continuar"
              variant="primary"
              fullWidth
              disabled={!wizard.isProfileValid}
              onPress={wizard.advanceStep}
            />
          ) : (
            <>
              <Button label="Volver" variant="ghost" fullWidth onPress={wizard.goBackStep} />
              <Button
                label="Terminar"
                variant="primary"
                fullWidth
                loading={wizard.saving}
                onPress={() => void finish()}
              />
            </>
          )}
        </View>
      </View>

      <IncomeFormSheet
        visible={incomeSheetVisible}
        values={wizard.row}
        onChange={wizard.changeRow}
        actionLabel={wizard.editingId ? 'Guardar cambios' : 'Agregar ingreso'}
        onConfirm={handleConfirmIncome}
        onClose={() => setIncomeSheetVisible(false)}
        title={wizard.editingId ? 'Editar ingreso' : 'Nuevo ingreso'}
        testIDBase="income"
      />

      <AlertDialog
        visible={saveFailed}
        title="Algo fallo"
        message="No se pudieron guardar tus datos. Intenta de nuevo."
        tone="danger"
        onClose={() => setSaveFailed(false)}
      />
    </Screen>
  )
}
