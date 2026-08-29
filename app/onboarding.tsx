/**
 * Onboarding screen: wizard bloqueante por pasos que captura la
 * identidad del usuario (nombre, apellido y correo) y su tabla de
 * ingresos con dia de cobro. Se muestra al abrir la app por primera
 * vez o mientras el perfil no este completo; cerrar la app a medio
 * camino regresa aqui porque nada se persiste hasta finalizar.
 */

import { useRouter } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog } from '@src/components/molecules/AlertDialog'
import { ProfileFields } from '@src/components/molecules/ProfileFields'
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
  const router = useRouter()
  const wizard = useOnboarding()
  const [saveFailed, setSaveFailed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onIdentityStep = wizard.step === 0

  function openCreateIncome(): void {
    router.push('/new-income')
  }

  function openEditIncome(id: string): void {
    router.push({ pathname: '/edit-income/[id]', params: { id } })
  }

  async function finish(): Promise<void> {
    if (submitting || wizard.saving) return
    setSubmitting(true)

    const [saved] = await Promise.all([
      wizard.finish(),
      new Promise((resolve) => setTimeout(resolve, 350))
    ])

    if (!saved) {
      setSubmitting(false)
      setSaveFailed(true)
    }
  }

  return (
    <Screen scrollable>
      <View className="flex-1 justify-between gap-5 pt-4 pb-4">
        <View className="gap-5">
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
              <View className="flex-row items-center gap-3">
                <View className="size-11 items-center justify-center rounded-full bg-accent-soft">
                  <Icon name={STEP_ICONS[0]} size={20} color={COLORS.accent} />
                </View>
                <View>
                  <Typography variant="figure">Datos personales</Typography>
                  <Typography variant="caption" className="text-muted">
                    Informacion para tu perfil local
                  </Typography>
                </View>
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
                <View className="flex-row items-center gap-3">
                  <View className="size-11 items-center justify-center rounded-full bg-accent-soft">
                    <Icon name={STEP_ICONS[1]} size={20} color={COLORS.accent} />
                  </View>
                  <View>
                    <Typography variant="figure">Fuentes de ingreso</Typography>
                    <Typography variant="caption" className="text-muted">
                      {wizard.draftIncomes.length === 0
                        ? 'Sin fuentes agregadas'
                        : wizard.draftIncomes.length === 1
                          ? '1 fuente registrada'
                          : `${wizard.draftIncomes.length} fuentes registradas`}
                    </Typography>
                  </View>
                </View>

                {wizard.draftIncomes.length > 0 ? (
                  <View className="flex-row items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5">
                    <Icon name="check" size={14} color={COLORS.accent} />
                  </View>
                ) : null}
              </View>

              {wizard.draftIncomes.length === 0 ? (
                <View className="items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-paper/60 p-6">
                  <Typography variant="title" className="text-center">
                    Sin fuentes de ingreso
                  </Typography>
                  <Typography variant="caption" className="text-center text-[13px] leading-[18px]">
                    Agrega cada ingreso mensual para proyectar tu flujo de dinero.
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
        </View>

        <View className="gap-2.5 pt-2">
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
                loading={wizard.saving || submitting}
                onPress={() => void finish()}
              />
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
