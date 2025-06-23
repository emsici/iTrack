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
      backgroundLocationUpdateInterval: 5000,
      distanceFilter: 0,
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 3000
    },
    App: {
      appendUserAgent: 'iTrack/1.0',
      handleTasks: true
    },
    Device: {
      getInfo: true
    }
  }
};

export default config;
