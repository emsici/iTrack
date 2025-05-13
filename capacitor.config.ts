import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ro.transportgps.app',
  appName: 'Transport GPS',
  webDir: 'dist/public',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Geolocation: {
      // Geolocation permissions
      permissions: {
        ios: [
          'Accesul la locație este necesar pentru a urmări poziția GPS în timpul transportului.'
        ],
        android: {
          highAccuracy: true,
          inBackground: true,
          forceEveryRequest: true
        }
      }
    },
    // Pentru a permite transportul cu background GPS
    BackgroundGeolocation: {
      startOnBoot: false,
      startForeground: true,
      stoppable: true,
      notification: {
        title: 'Transport GPS',
        text: 'Tracking GPS activ'
      }
    }
  },
  // Setări specifice Android
  android: {
    backgroundColor: '#FFFFFF',
    allowMixedContent: true,
    minSdkVersion: 22,
    targetSdkVersion: 33
  },
  // Setări specifice iOS
  ios: {
    backgroundColor: '#FFFFFF',
    contentInset: 'always',
    scheme: 'TransportGPS',
    preferredContentMode: 'mobile'
  }
};

export default config;
