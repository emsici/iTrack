import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gps.tracker',
  appName: 'GPS Tracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    BackgroundMode: {
      enabled: true,
      title: 'GPS Tracking Active',
      text: 'GPS tracking is running in background'
    },
    Geolocation: {
      requestPermissions: true,
      enableBackgroundLocationUpdates: true
    }
  }
};

export default config;
