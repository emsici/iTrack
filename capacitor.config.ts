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
      enableBackgroundLocationUpdates: true,
      backgroundLocationUpdateInterval: 60000, // 1 minute
      distanceFilter: 10 // meters
    },
    App: {
      appendUserAgent: 'iTrack/1.0'
    }
  }
};

export default config;
