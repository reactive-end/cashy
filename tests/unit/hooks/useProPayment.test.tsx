/**
 * Pruebas unitarias del hook useProPayment.
 */

import { act, renderHook } from '@testing-library/react-native'
import * as Clipboard from 'expo-clipboard'

import { useProPayment, PRO_PAYMENT_DATA } from '@src/hooks/useProPayment'
import { getExchangeRates } from '@src/services/rates'
import { buildRates } from '../../helpers/factories'

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true)
}))

jest.mock('expo-linking', () => ({
  openURL: jest.fn(async () => true)
}))

jest.mock('@src/services/rates', () => ({
  getExchangeRates: jest.fn()
}))

const getExchangeRatesMock = getExchangeRates as jest.Mock
const setStringAsyncMock = Clipboard.setStringAsync as jest.Mock

describe('useProPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getExchangeRatesMock.mockResolvedValue(buildRates({ bcvUsd: 50 }))
  })

  it('calcula los montos y genera el payload de QR', async () => {
    const { result } = await renderHook(() => useProPayment())

    expect(result.current.bcvRate).toBe(50)
    expect(result.current.montoBsNumber).toBe(100)
    expect(result.current.qrPayload).toContain(PRO_PAYMENT_DATA.bankCode)
  })

  it('copia campo individual y muestra aviso', async () => {
    const { result } = await renderHook(() => useProPayment())

    await act(async () => {
      await result.current.handleCopyField('0191', 'Código de banco')
    })

    expect(setStringAsyncMock).toHaveBeenCalledWith('0191')
    expect(result.current.notice?.message).toBe('Código de banco copiado al portapapeles.')
  })

  it('copia todos los datos en formato multilinea', async () => {
    const { result } = await renderHook(() => useProPayment())

    await act(async () => {
      await result.current.handleCopyAllData()
    })

    expect(setStringAsyncMock).toHaveBeenCalledWith(
      `${PRO_PAYMENT_DATA.bankCode}\n${PRO_PAYMENT_DATA.idNumberRaw}\n${PRO_PAYMENT_DATA.phoneRaw}`
    )
    expect(result.current.notice?.tone).toBe('success')
  })
})
