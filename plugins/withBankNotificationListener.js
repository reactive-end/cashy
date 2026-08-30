/**
 * Plugin de configuracion para registrar el servicio BankNotificationListenerService
 * en el AndroidManifest.xml con el permiso BIND_NOTIFICATION_LISTENER_SERVICE.
 */

const { withAndroidManifest } = require('@expo/config-plugins')

function withBankNotificationListener(config) {
  return withAndroidManifest(config, (modConfig) => {
    const mainApplication = modConfig.modResults.manifest.application?.[0]
    if (!mainApplication) return modConfig

    mainApplication.service = mainApplication.service || []

    const serviceName =
      'com.reactiveend.cashy.notificationlistener.BankNotificationListenerService'
    const exists = mainApplication.service.some((s) => s.$?.['android:name'] === serviceName)

    if (!exists) {
      mainApplication.service.push({
        $: {
          'android:name': serviceName,
          'android:label': 'Cashy Bank Notification Listener',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
          'android:exported': 'true'
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.service.notification.NotificationListenerService'
                }
              }
            ]
          }
        ]
      })
    }

    return modConfig
  })
}

module.exports = withBankNotificationListener
