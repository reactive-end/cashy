/**
 * User-facing error messages.
 * La interfaz nunca muestra textos tecnicos crudos ("Failed Query",
 * "Internal Server Error", "Network request failed"); cada dominio
 * expone aqui su unico texto amigable en espanol.
 */

/** Texto mostrado cuando la consulta de tasas de cambio falla */
export const RATES_LOAD_ERROR_MESSAGE =
  'La solicitud para obtener las tasas ha fallado. Revisa tu conexion e intenta de nuevo.'

/** Texto mostrado cuando la lectura o escritura de gastos falla */
export const EXPENSES_LOAD_ERROR_MESSAGE =
  'No se pudieron cargar tus gastos. Revisa tu conexion e intenta de nuevo.'
