/**
 * Constantes de configuracion de Supabase y autenticacion.
 */

export const SUPABASE_URL = 'https://sxbidvudaajpjvdyvfss.supabase.co'

export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YmlkdnVkYWFqcGp2ZHl2ZnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNDczNTIsImV4cCI6MjEwMzYyMzM1Mn0.D-xKKYQoqQ8CtbDXoZcduUrSRStlzz-EnneCrGN_Vk8'

export const SUPABASE_REDIRECT_URL = 'cashy://auth/callback'

export const GOOGLE_WEB_CLIENT_ID =
  '1068482574247-m572v4lmji743lq638ihhvq10b9v3gc5.apps.googleusercontent.com'

export const GOOGLE_ANDROID_CLIENT_ID =
  '1068482574247-ti66a9vb6ir23r7upp314uek1so3hh1s.apps.googleusercontent.com'

export const SUBSCRIPTION_CACHE_KEY = 'cashy.user-subscription'

export const WELCOME_SEEN_KEY = 'cashy.welcome-seen'

/** Precio oficial de la version PRO en dolares */
export const PRO_PRICE_USD = 2

/** Datos oficiales de pago movil para activacion de Cashy PRO */
export const PRO_PAYMENT_DETAILS = {
  priceUsd: PRO_PRICE_USD,
  bankCode: process.env.EXPO_PUBLIC_PRO_BANK_CODE ?? '0191',
  bankName: process.env.EXPO_PUBLIC_PRO_BANK_NAME ?? 'Banco Nacional de Crédito (BNC)',
  idDoc: process.env.EXPO_PUBLIC_PRO_ID_DOC ?? 'V28502328',
  phone: process.env.EXPO_PUBLIC_PRO_PHONE ?? '04247413675'
} as const

/** Mensaje explicativo para el dialogo de adquisicion de Cashy PRO */
export const PRO_PAYMENT_MESSAGE =
  'Activa Cashy PRO por solo $2 (o su equivalente en Bs. a tasa BCV):\n\n' +
  'Pago Móvil:\n' +
  '• Banco: 0191 (Banco Nacional de Crédito)\n' +
  '• Cédula: V-28502328\n' +
  '• Teléfono: 04247413675\n\n' +
  'Luego de realizar el pago, envíanos el comprobante al mismo número de teléfono para activar tu cuenta de inmediato.'
