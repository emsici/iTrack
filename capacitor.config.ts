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
      backgroundLocationUpdateInterval: 5000, // 5 seconds for consistent tracking
      distanceFilter: 0,
      enableHighAccuracy: true,
      timeout: 15000, // Reduced timeout for faster response  
      maximumAge: 2000 // Use only fresh locations (2s or newer)
    },
    App: {
      appendUserAgent: 'iTrack/1.0',
      handleTasks: true
    },
    Device: {
      getInfo: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
      overlaysWebView: false
    }
  }
};

export default config;
