import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ro.transportgps.app',
  appName: 'Transport GPS',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Geolocation: {
      // Geolocation permissions
      permissions: {
        ios: [
          'Accesul la locație este necesar pentru a urmări poziția GPS în timpul transportului.'
        ]
      }
    }
  },
  android: {
    backgroundColor: '#FFFFFF',
    allowMixedContent: true
  },
  ios: {
    backgroundColor: '#FFFFFF',
    contentInset: 'always',
    scheme: 'TransportGPS'
  }
};

export default config;
