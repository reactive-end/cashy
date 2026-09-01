/**
 * Hook useBankPayments: sincroniza y expone las notificaciones de pago
 * movil pendientes de confirmar, permitiendo registrarlas como ingresos
 * unicos en SQLite o descartarlas. Reservado a usuarios Cashy PRO.
 */

import { useCallback, useEffect, useState } from 'react'
import { AppState } from 'react-native'

import { insertIncome } from '@src/db/incomes'
import { useSubscription } from '@src/hooks/useSubscription'
import {
  dequeueBankNotification,
  drainNativeBankNotifications,
  getPendingBankNotifications,
  subscribeToNativeBankNotifications,
  type ParsedBankNotification
} from '@src/lib/bankNotifications'
import { emit, subscribe } from '@src/lib/events'
import { generateId } from '@src/lib/ids'
import type { IncomeInput } from '@src/types/domain'

/** Resultado y acciones expuestos por el hook useBankPayments */
export interface UseBankPaymentsResult {
  /** Notificacion activa a presentar en el modal o null si la cola esta vacia */
  activeNotification: ParsedBankNotification | null
  /** Cantidad de notificaciones pendientes en la cola */
  pendingCount: number
  /** Estado de guardado en base de datos */
  saving: boolean
  /** Confirma y persiste la notificacion como ingreso unico */
  confirm: (customName: string) => Promise<boolean>
  /** Descarta la notificacion sin guardarla */
  dismiss: () => Promise<void>
  /** Recarga manualmente la cola de notificaciones pendientes */
  refresh: () => Promise<void>
}

/**
 * Recarga la cola desde el almacenamiento local drenando primero
 * las capturas acumuladas por el servicio nativo.
 */
async function reloadQueue(): Promise<ParsedBankNotification[]> {
  try {
    await drainNativeBankNotifications()
  } catch {
    // Entornos sin modulo nativo
  }

  return getPendingBankNotifications()
}

/**
 * Hook reactivo para gestionar la deteccion y confirmacion de pagos moviles.
 * @returns Estado de notificaciones detectadas y metodos de confirmacion
 */
export function useBankPayments(): UseBankPaymentsResult {
  const [queue, setQueue] = useState<ParsedBankNotification[]>([])
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async (): Promise<void> => {
    const items = await reloadQueue()
    setQueue(items)
  }, [])

  useEffect(() => {
    let active = true

    const loadInitial = async (): Promise<void> => {
      const items = await reloadQueue()
      if (active) {
        setQueue(items)
      }
    }

    void loadInitial()

    const unsubscribeEvent = subscribe('bank-notification-detected', () => {
      if (active) void refresh()
    })

    const unsubscribeNative = subscribeToNativeBankNotifications(() => {
      if (active) void refresh()
    })

    const subscriptionAppState = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && active) {
        void refresh()
      }
    })

    return () => {
      active = false
      unsubscribeEvent()
      unsubscribeNative()
      subscriptionAppState.remove()
    }
  }, [refresh])

  const { isPro } = useSubscription()
  const activeNotification = isPro && queue.length > 0 ? (queue[0] ?? null) : null

  const confirm = useCallback(
    async (customName: string): Promise<boolean> => {
      if (!activeNotification || saving) return false

      setSaving(true)
      try {
        const input: IncomeInput = {
          name: customName.trim(),
          amount: activeNotification.amount,
          currency: activeNotification.currency,
          type: 'unique',
          paydayDay: new Date().getDate()
        }

        await insertIncome(input, generateId())
        await dequeueBankNotification(activeNotification.detectedAt)
        emit('incomes-changed')
        await refresh()
        return true
      } catch {
        return false
      } finally {
        setSaving(false)
      }
    },
    [activeNotification, saving, refresh]
  )

  const dismiss = useCallback(async (): Promise<void> => {
    if (!activeNotification) return

    await dequeueBankNotification(activeNotification.detectedAt)
    await refresh()
  }, [activeNotification, refresh])

  return {
    activeNotification,
    pendingCount: queue.length,
    saving,
    confirm,
    dismiss,
    refresh
  }
}
