package com.reactiveend.cashy.notificationlistener

import android.app.Notification
import android.content.Context
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONArray
import org.json.JSONObject

class BankNotificationListenerService : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val extras = sbn.notification?.extras ?: return
        val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val pkg = sbn.packageName ?: ""

        val combined = "$title $text".lowercase()
        val isRelevant = combined.contains("pago movil") ||
                combined.contains("pago móvil") ||
                combined.contains("bnc") ||
                pkg.lowercase().contains("bnc")

        if (!isRelevant) return

        savePendingNotification(applicationContext, title, text, pkg)
        BankNotificationListenerModule.emitNotificationReceived(title, text, pkg)
    }

    companion object {
        private const val PREFS_NAME = "cashy_bank_notifications_prefs"
        private const val KEY_PENDING = "pending_notifications"

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
            prefs.edit().putString(KEY_PENDING, array.toString()).apply()
        }

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
