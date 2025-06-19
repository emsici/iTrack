import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.euscagency.itrack',
  appName: 'iTrack',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Geolocation: {
      requestPermissions: true,
      enableBackgroundLocationUpdates: true,
      backgroundLocationUpdateInterval: 60000, // 60 seconds as requested
      distanceFilter: 5, // meters - more sensitive
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 10000
    },
    App: {
      appendUserAgent: 'iTrack/1.0',
      handleTasks: true // Enable background task handling
    },
    Device: {
      getInfo: true
    }
  }
};

export default config;
