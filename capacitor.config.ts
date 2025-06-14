import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.euscagency.iTrack',
  appName: 'iTrack',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Geolocation: {
      requestPermissions: true,
      enableBackgroundLocationUpdates: true
    }
  }
};

export default config;
