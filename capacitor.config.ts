import { CapacitorConfig } from '@capacitor/cli';

// Extindem configurația pentru a avea suport pentru opțiunile personalizate
// Aceasta este o abordare pentru a evita erorile de typeScript
const config = {
  appId: 'com.euscagency.itrack',
  appName: 'iTrack',
  webDir: 'dist/public',
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
    // Permite utilizarea locației în background
    BackgroundGeolocation: {
      locationProvider: 'distance-filter',
      desiredAccuracy: 'high',
      stationaryRadius: 5,
      distanceFilter: 30,
      debug: false,
      startOnBoot: true,
      stopOnTerminate: false,
      enableHeadless: true,
      interval: 60000, // 1 minut
      fastestInterval: 30000, // 30 secunde
      activitiesInterval: 60000,
      stopOnStillActivity: false,
      notificationTitle: "iTrack GPS activat",
      notificationText: "Monitorizare GPS pentru transport activă",
      notificationIconColor: "#3880ff"
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
      "android.permission.WAKE_LOCK"
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
