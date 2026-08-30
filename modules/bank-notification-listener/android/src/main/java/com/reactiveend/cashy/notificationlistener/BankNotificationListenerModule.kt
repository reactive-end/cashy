package com.reactiveend.cashy.notificationlistener

import android.content.Intent
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BankNotificationListenerModule : Module() {

    override fun definition() = ModuleDefinition {
        Name("BankNotificationListener")

        Events("onBankNotificationReceived")

        Function("isPermissionGranted") {
            val context = appContext.reactContext ?: return@Function false
            val enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(context)
            enabledPackages.contains(context.packageName)
        }

        Function("requestPermission") {
            val context = appContext.reactContext ?: return@Function false
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            true
        }

        Function("getPendingNotifications") {
            val context = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
            BankNotificationListenerService.getAndClearPendingNotifications(context)
        }

        OnCreate {
            instance = this@BankNotificationListenerModule
        }

        OnDestroy {
            if (instance == this@BankNotificationListenerModule) {
                instance = null
            }
        }
    }

    fun notifyReceived(title: String, text: String, pkg: String) {
        sendEvent(
            "onBankNotificationReceived",
            mapOf("title" to title, "body" to text, "packageName" to pkg)
        )
    }

    companion object {
        private var instance: BankNotificationListenerModule? = null

        fun emitNotificationReceived(title: String, text: String, pkg: String) {
            instance?.notifyReceived(title, text, pkg)
        }
    }
}
