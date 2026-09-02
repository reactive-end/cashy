/**
 * Subpantalla de Ajustes: Adquirir Cashy PRO y Pago Movil BNC.
 * Muestra el resumen del plan mensual ($2 USD/mes), conversion a Bs. a tasa BCV,
 * datos de Pago Movil estructurados con copiado en un solo toque, codigo QR nativo BNC
 * y contacto directo por WhatsApp para envio del comprobante.
 * La logica de calculo de montos, copiado y QR reside en useProPayment.
 */

import { useRouter } from 'expo-router'
import { Pressable, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import { Button } from '@src/components/atoms/Button'
import { Card } from '@src/components/atoms/Card'
import { Icon } from '@src/components/atoms/Icon'
import { Screen } from '@src/components/atoms/Screen'
import { Typography } from '@src/components/atoms/Typography'
import { AlertDialog } from '@src/components/molecules/AlertDialog'
import { COLORS } from '@src/constants/theme'
import { PRO_PAYMENT_DATA, useProPayment } from '@src/hooks/useProPayment'

export default function ProPaymentSettings() {
  const router = useRouter()
  const {
    bcvRate,
    montoBsFormatted,
    qrPayload,
    notice,
    setNotice,
    handleCopyField,
    handleCopyAllData,
    handleContactWhatsApp
  } = useProPayment()

  return (
    <Screen scrollable>
      <View className="gap-6 pt-6 pb-12">
        {/* Cabecera con boton volver y titulo */}
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a Tus datos y Cuenta"
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
          >
            <Icon name="back" size={20} color="#1C1C1A" />
          </Pressable>
          <Typography variant="display">Adquirir Cashy PRO</Typography>
        </View>

        {/* Resumen del Plan Mensual */}
        <Card className="gap-3 border border-accent/20 bg-accentSoft/30">
          <View className="flex-row items-center justify-between">
            <Typography variant="label" className="text-accent">
              Suscripción Mensual
            </Typography>
            <View className="rounded-full bg-accent px-3 py-1">
              <Typography variant="caption" className="font-bold text-paper">
                $2.00 USD / mes
              </Typography>
            </View>
          </View>
          <Typography variant="body" className="font-semibold text-ink">
            Monto a pagar en Bs: {montoBsFormatted} {bcvRate > 0 ? 'Bs.' : ''}
          </Typography>
          <Typography variant="caption" className="text-muted">
            {bcvRate > 0
              ? `Calculado automáticamente según la tasa oficial BCV del día (${bcvRate.toFixed(
                  2
                )} Bs/USD).`
              : 'Obteniendo tasa BCV en tiempo real...'}
          </Typography>
        </Card>

        {/* Aviso obligatorio de Monto Exacto */}
        <Card className="gap-2 border border-warn/30 bg-warnSoft/40">
          <View className="flex-row items-center gap-2">
            <Icon name="alert" size={18} color={COLORS.warn} />
            <Typography variant="label" className="text-warn font-semibold">
              Monto exacto requerido
            </Typography>
          </View>
          <Typography variant="caption" className="text-ink">
            El monto transferido debe ser **exacto a los Bs. calculados** según la tasa oficial BCV
            del día (Bs. {montoBsFormatted}) para garantizar la conciliación e inmediata activación
            de tu suscripción PRO.
          </Typography>
        </Card>

        {/* Codigo QR de Pago Movil BNC */}
        <Card className="items-center gap-4 py-6 border border-line bg-card">
          <Typography variant="label" className="text-center">
            Código QR de Pago Móvil BNC
          </Typography>
          <Typography variant="caption" className="text-center text-muted">
            Escanea este código desde la app de tu banco para realizar el pago directamente con el
            monto.
          </Typography>

          <View className="items-center justify-center rounded-2xl border border-line bg-white p-4 shadow-sm">
            <QRCode value={qrPayload} size={200} color="#1C1C1A" backgroundColor="#FFFFFF" />
          </View>
        </Card>

        {/* Datos de Pago Movil Estructurados */}
        <Card className="gap-4 border border-line">
          <View className="flex-row items-center justify-between">
            <Typography variant="label">Datos de Pago Móvil</Typography>
            <Typography variant="caption" className="text-faint">
              BNC (0191)
            </Typography>
          </View>

          <View className="gap-3 divide-y divide-line">
            {/* Beneficiario */}
            <View className="flex-row items-center justify-between pt-1">
              <View className="flex-1 pr-2">
                <Typography variant="caption" className="text-faint">
                  Beneficiario
                </Typography>
                <Typography variant="body" className="font-semibold text-ink">
                  {PRO_PAYMENT_DATA.beneficiary}
                </Typography>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Copiar Beneficiario"
                onPress={() => void handleCopyField(PRO_PAYMENT_DATA.beneficiary, 'Beneficiario')}
                className="h-9 w-9 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
              >
                <Icon name="copy" size={16} color={COLORS.ink} />
              </Pressable>
            </View>

            {/* Banco */}
            <View className="flex-row items-center justify-between pt-2">
              <View className="flex-1 pr-2">
                <Typography variant="caption" className="text-faint">
                  Banco
                </Typography>
                <Typography variant="body" className="font-semibold text-ink">
                  {PRO_PAYMENT_DATA.bankName}
                </Typography>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Copiar Código de Banco"
                onPress={() => void handleCopyField(PRO_PAYMENT_DATA.bankCode, 'Código de Banco')}
                className="h-9 w-9 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
              >
                <Icon name="copy" size={16} color={COLORS.ink} />
              </Pressable>
            </View>

            {/* Cédula */}
            <View className="flex-row items-center justify-between pt-2">
              <View className="flex-1 pr-2">
                <Typography variant="caption" className="text-faint">
                  Cédula / RIF
                </Typography>
                <Typography variant="body" className="font-semibold text-ink">
                  {PRO_PAYMENT_DATA.idNumber}
                </Typography>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Copiar Cédula"
                onPress={() => void handleCopyField(PRO_PAYMENT_DATA.idNumberRaw, 'Cédula')}
                className="h-9 w-9 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
              >
                <Icon name="copy" size={16} color={COLORS.ink} />
              </Pressable>
            </View>

            {/* Teléfono */}
            <View className="flex-row items-center justify-between pt-2">
              <View className="flex-1 pr-2">
                <Typography variant="caption" className="text-faint">
                  Teléfono
                </Typography>
                <Typography variant="body" className="font-semibold text-ink">
                  {PRO_PAYMENT_DATA.phone}
                </Typography>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Copiar Teléfono"
                onPress={() => void handleCopyField(PRO_PAYMENT_DATA.phoneRaw, 'Teléfono')}
                className="h-9 w-9 items-center justify-center rounded-full border border-line bg-paper active:opacity-60"
              >
                <Icon name="copy" size={16} color={COLORS.ink} />
              </Pressable>
            </View>
          </View>

          {/* Boton de copiado multilinea de un solo toque */}
          <Button
            label="Copiar datos rápidos (0191 / Cédula / Teléfono)"
            variant="secondary"
            icon="copy"
            fullWidth
            onPress={() => void handleCopyAllData()}
          />
        </Card>

        {/* Acciones de Verificación y Soporte */}
        <Card className="gap-3 border border-line">
          <Typography variant="label">Confirmación del pago</Typography>
          <Typography variant="caption" className="text-muted">
            Luego de realizar la transferencia en la app de tu banco, presiona el botón inferior
            para enviar la captura o número de referencia por WhatsApp a nuestro equipo de
            activaciones.
          </Typography>

          <Button
            label="Enviar comprobante por WhatsApp"
            variant="primary"
            icon="check"
            fullWidth
            onPress={handleContactWhatsApp}
          />
        </Card>
      </View>

      <AlertDialog
        visible={notice !== null}
        title="Pago Móvil Cashy PRO"
        message={notice?.message ?? ''}
        tone={notice?.tone ?? 'success'}
        onClose={() => setNotice(null)}
      />
    </Screen>
  )
}
