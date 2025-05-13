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
    Geolocation: {
      // Geolocation permissions
      permissions: {
        ios: [
          'Accesul la locație este necesar pentru a urmări poziția GPS în timpul transportului.'
        ]
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
      stopOnStillActivity: false
    }
  },
  android: {
    backgroundColor: '#FFFFFF',
    allowMixedContent: true,
    // Permisiuni pentru Android
    permissions: [
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
