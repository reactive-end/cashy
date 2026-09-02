/**
 * Hook useProPayment: gestiona la conversion a bolivares con tasa BCV,
 * generacion del payload QR de Pago Movil BNC, copiado al portapapeles
 * y contacto de comprobante via WhatsApp para /settings/pro-payment.
 */

import * as Clipboard from 'expo-clipboard'
import * as Linking from 'expo-linking'
import { useCallback, useMemo, useState } from 'react'

import type { AlertDialogTone } from '@src/components/molecules/AlertDialog'
import { useRates } from '@src/hooks/useRates'

/** Datos fijos de la cuenta de Pago Movil BNC */
export const PRO_PAYMENT_DATA = {
  bankCode: process.env.EXPO_PUBLIC_PRO_BANK_CODE ?? '0191',
  bankName: process.env.EXPO_PUBLIC_PRO_BANK_NAME ?? '0191 - BNC (Banco Nacional de Crédito)',
  idNumber: process.env.EXPO_PUBLIC_PRO_ID_DOC ?? 'V-28502328',
  idNumberRaw: (process.env.EXPO_PUBLIC_PRO_ID_DOC ?? 'V28502328').replace('-', ''),
  phone: process.env.EXPO_PUBLIC_PRO_PHONE_FORMATTED ?? '0424-7413675',
  phoneRaw: (process.env.EXPO_PUBLIC_PRO_PHONE ?? '04247413675').replace(/\D/g, ''),
  beneficiary: process.env.EXPO_PUBLIC_PRO_BENEFICIARY ?? 'PISANI ALARCON RAFAEL ENRIQUE',
  priceUsd: 2.0
} as const

export interface UseProPaymentResult {
  bcvRate: number
  montoBsFormatted: string
  montoBsNumber: number
  qrPayload: string
  notice: { tone: AlertDialogTone; message: string } | null
  setNotice: (notice: { tone: AlertDialogTone; message: string } | null) => void
  handleCopyField: (text: string, label: string) => Promise<void>
  handleCopyAllData: () => Promise<void>
  handleContactWhatsApp: () => void
}

/**
 * Hook para la subpantalla de pago de suscripcion PRO.
 * @returns Montos calculados, copiado y enlace de WhatsApp
 */
export function useProPayment(): UseProPaymentResult {
  const ratesState = useRates()
  const [notice, setNotice] = useState<{ tone: AlertDialogTone; message: string } | null>(null)

  const bcvRate = ratesState.rates?.bcvUsd ?? 0
  const montoBsNumber = PRO_PAYMENT_DATA.priceUsd * bcvRate
  const montoBsFormatted = useMemo(() => {
    return montoBsNumber > 0
      ? montoBsNumber.toLocaleString('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      : 'Cargando tasa...'
  }, [montoBsNumber])

  const multilineCopyText = useMemo(() => {
    return `${PRO_PAYMENT_DATA.bankCode}\n${PRO_PAYMENT_DATA.idNumberRaw}\n${PRO_PAYMENT_DATA.phoneRaw}`
  }, [])

  const qrPayload = useMemo(() => {
    return `${PRO_PAYMENT_DATA.bankCode}|${PRO_PAYMENT_DATA.idNumberRaw}|${PRO_PAYMENT_DATA.phoneRaw}|${
      montoBsNumber > 0 ? montoBsNumber.toFixed(2) : '0.00'
    }`
  }, [montoBsNumber])

  const handleCopyField = useCallback(async (text: string, label: string): Promise<void> => {
    await Clipboard.setStringAsync(text)
    setNotice({
      tone: 'success',
      message: `${label} copiado al portapapeles.`
    })
  }, [])

  const handleCopyAllData = useCallback(async (): Promise<void> => {
    await Clipboard.setStringAsync(multilineCopyText)
    setNotice({
      tone: 'success',
      message: 'Datos de Pago Móvil copiados en formato multilínea (Banco, Cédula, Teléfono).'
    })
  }, [multilineCopyText])

  const handleContactWhatsApp = useCallback((): void => {
    const text = encodeURIComponent(
      `Hola, acabo de realizar el Pago Móvil por $2 USD (Bs. ${montoBsFormatted}) para activar mi cuenta Cashy PRO. Adjunto mi comprobante.`
    )
    const phone = PRO_PAYMENT_DATA.phoneRaw.replace(/^0/, '')
    void Linking.openURL(`https://wa.me/58${phone}?text=${text}`)
  }, [montoBsFormatted])

  return {
    bcvRate,
    montoBsFormatted,
    montoBsNumber,
    qrPayload,
    notice,
    setNotice,
    handleCopyField,
    handleCopyAllData,
    handleContactWhatsApp
  }
}
