import { CapacitorConfig } from '@capacitor/cli';

// Extindem configurația pentru a avea suport pentru opțiunile personalizate
// Aceasta este o abordare pentru a evita erorile de typeScript
const config = {
  appId: 'com.euscagency.itrack',
  appName: 'iTrack',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    Geolocation: {
      // Geolocation permissions - solicită permisiunea la pornirea aplicației
      permissions: {
        ios: [
          'Accesul la locație este necesar pentru a urmări poziția GPS în timpul transportului.'
        ],
        android: {
          fineLocation: {
            title: "Permisiune locație GPS",
            message: "Aplicația necesită acces la locația dvs. pentru a urmări cursele de transport."
          },
          coarseLocation: {
            title: "Permisiune locație",
            message: "Aplicația necesită acces la locația dvs. pentru a funcționa corect."
          },
          backgroundLocation: {
            title: "Permisiune locație în fundal",
            message: "Aplicația necesită acces la locația dvs. în fundal pentru a continua urmărirea transportului chiar și atunci când aplicația este minimizată."
          }
        }
      }
    },
    // Configurație pentru Foreground Service GPS
    ForegroundService: {
      enabled: true,
      notificationTitle: "iTrack GPS activ",
      notificationText: "Urmărire transport în curs...",
      notificationIcon: "ic_notification",
      notificationChannelId: "itrack_gps_channel",
      notificationChannelName: "iTrack GPS Service",
      notificationChannelDescription: "Serviciu GPS pentru urmărirea transporturilor",
      enableWakeLock: true,
      interval: 60000 // 1 minut
    }
  },
  android: {
    backgroundColor: '#FFFFFF',
    allowMixedContent: true,
    // Permitem trafic necriptat (HTTP) pentru API-uri care nu folosesc HTTPS
    webContentsDebuggingEnabled: true,
    // Permisiuni pentru Android
    permissions: [
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_LOCATION",
      "android.permission.WAKE_LOCK",
      "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
      "android.permission.SYSTEM_ALERT_WINDOW"
    ]
  },
  ios: {
    backgroundColor: '#FFFFFF',
    contentInset: 'always',
    scheme: 'iTrack',
    // Permisiuni pentru iOS
    permissions: {
      locationAlways: {
        "iOS usage description": "Aplicația folosește locația pentru a urmări traseul în timp ce cursa este activă"
      },
      locationWhenInUse: {
        "iOS usage description": "Aplicația folosește locația pentru a urmări traseul"
      }
    }
  }
};

export default config as CapacitorConfig;
