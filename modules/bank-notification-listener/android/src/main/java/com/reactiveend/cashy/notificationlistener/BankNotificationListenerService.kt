package com.reactiveend.cashy.notificationlistener

import android.app.Notification
import android.content.Context
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.text.Normalizer
import java.util.Locale
import org.json.JSONArray
import org.json.JSONObject

/**
 * Servicio de escucha de notificaciones del sistema.
 * Detecta avisos de pago movil recibido por patron de texto
 * ("pago movil", con o sin espacio y sin importar acentos),
 * independiente del banco emisor. Las notificaciones que no
 * coinciden se descartan sin persistir nada.
 */
class BankNotificationListenerService : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val extras = sbn.notification?.extras ?: return
        val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val pkg = sbn.packageName ?: ""

        val combined = "$title $text"

        if (!isPagoMovilNotification(combined)) return

        savePendingNotification(applicationContext, title, text, pkg)
        BankNotificationListenerModule.emitNotificationReceived(title, text, pkg)
    }

    companion object {
        private const val PREFS_NAME = "cashy_bank_notifications_prefs"
        private const val KEY_PENDING = "pending_notifications"
        private const val MAX_QUEUE_SIZE = 10

        /**
         * Indica si el texto corresponde a un pago movil entrante.
         * Normaliza minusculas y elimina acentos antes de aplicar el
         * patron, de modo que "Pago Movil", "PAGO MOVIL RECIBIDO" y
         * "PagomovilBDV" coinciden por igual.
         * @param rawText Texto combinado de titulo y cuerpo
         * @return true cuando el texto contiene el patron de pago movil
         */
        fun isPagoMovilNotification(rawText: String): Boolean {
            val normalized = Normalizer
                .normalize(rawText.lowercase(Locale.ROOT), Normalizer.Form.NFD)
                .replace(Regex("\\p{InCombiningDiacriticalMarks}+"), "")

            return normalized.contains(Regex("pago\\s*movil"))
        }

        /**
         * Persiste la notificacion detectada en la cola pendiente.
         * La cola conserva como maximo las 10 capturas mas recientes.
         * @param context Contexto de la aplicacion
         * @param title Titulo original de la notificacion
         * @param text Cuerpo original de la notificacion
         * @param pkg Paquete Android de la app emisora
         */
        fun savePendingNotification(context: Context, title: String, text: String, pkg: String) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val existing = prefs.getString(KEY_PENDING, "[]")
            val array = try {
                JSONArray(existing)
            } catch (_: Exception) {
                JSONArray()
            }

            val item = JSONObject().apply {
                put("title", title)
                put("body", text)
                put("packageName", pkg)
                put("timestamp", System.currentTimeMillis())
            }

            array.put(item)
            while (array.length() > MAX_QUEUE_SIZE) {
                array.remove(0)
            }

            prefs.edit().putString(KEY_PENDING, array.toString()).apply()
        }

        /**
         * Recupera y vacia las notificaciones acumuladas mientras la
         * aplicacion estuvo cerrada o en segundo plano.
         * @param context Contexto de la aplicacion
         * @return Lista de mapas con titulo, cuerpo, paquete y marca de tiempo
         */
        fun getAndClearPendingNotifications(context: Context): List<Map<String, Any>> {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val existing = prefs.getString(KEY_PENDING, "[]")
            val result = mutableListOf<Map<String, Any>>()

            try {
                val array = JSONArray(existing)
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    result.add(
                        mapOf(
                            "title" to obj.optString("title"),
                            "body" to obj.optString("body"),
                            "packageName" to obj.optString("packageName"),
                            "timestamp" to obj.optLong("timestamp")
                        )
                    )
                }
            } catch (_: Exception) {
            }

            prefs.edit().remove(KEY_PENDING).apply()
            return result
        }
    }
}
