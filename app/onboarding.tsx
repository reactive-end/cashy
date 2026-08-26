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
import { ProfileFields } from '@src/components/molecules/ProfileFields'
import { IncomeEditor } from '@src/components/organisms/IncomeEditor'
import { IncomesTable } from '@src/components/organisms/IncomesTable'
import { COLORS } from '@src/constants/theme'
import { TOTAL_STEPS, useOnboarding } from '@src/hooks/useOnboarding'

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
    <View className="flex-row items-center gap-2">
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          className={`h-1.5 rounded-full ${index <= current ? 'bg-accent' : 'bg-line'}`}
          style={{ width: index === current ? 28 : 16 }}
        />
      ))}
      <Typography variant="caption" className="ml-1 text-faint">
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

  const onIdentityStep = wizard.step === 0

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
              {isRowReady(wizard.row) ? (
                <View className="flex-row items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5">
                  <Icon name="check" size={14} color={COLORS.accent} />
                  <Typography variant="caption" className="font-sans-semibold text-accent">
                    Listo para agregar
                  </Typography>
                </View>
              ) : null}
            </View>

            <IncomeEditor
              values={wizard.row}
              onChange={wizard.changeRow}
              actionLabel={wizard.editingId ? 'Guardar cambios' : 'Agregar ingreso'}
              onConfirm={() => void wizard.confirmRow()}
              testIDBase="income"
            />

            {wizard.draftIncomes.length > 0 ? (
              <View className="gap-2">
                <Typography variant="caption" className="text-faint">
                  {wizard.draftIncomes.length === 1
                    ? '1 fuente registrada para este mes'
                    : `${wizard.draftIncomes.length} fuentes registradas para este mes`}
                </Typography>
                <IncomesTable
                  incomes={wizard.draftIncomes}
                  onEdit={wizard.editIncome}
                  onRemove={wizard.removeIncome}
                  testIDBase="incomes-table"
                />
              </View>
            ) : null}
          </Card>
        )}

        <View className="mt-auto flex-row gap-3">
          {onIdentityStep ? (
            <View className="flex-[2]">
              <Button
                label="Continuar"
                variant="primary"
                fullWidth
                disabled={!wizard.isProfileValid}
                onPress={wizard.advanceStep}
              />
            </View>
          ) : (
            <>
              <View className="flex-1">
                <Button label="Volver" variant="ghost" fullWidth onPress={wizard.goBackStep} />
              </View>
              <View className="flex-[2]">
                <Button
                  label="Terminar"
                  variant="primary"
                  fullWidth
                  loading={wizard.saving}
                  onPress={() => void finish()}
                />
              </View>
            </>
          )}
        </View>
      </View>

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

/** Forma estructural minima que necesita la validacion de fila */
interface RowLike {
  name: string
  amountCents: number
  currency: string
  paydayDayText: string
}

/**
 * Indica si la fila capturada esta lista para agregarse.
 * @param row Fila vigente del editor
 * @returns true cuando concepto, monto y dia son validos
 */
function isRowReady(row: RowLike): boolean {
  return row.name.trim().length >= 3 && row.amountCents > 0 && /^\d{1,2}$/.test(row.paydayDayText)
}
