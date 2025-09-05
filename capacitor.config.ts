import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.euscagency.itrack',
  appName: 'iTrack',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // NOTA: Geolocation nu acceptă configurații globale aici
    // Opțiunile (enableHighAccuracy, timeout, maximumAge, minimumUpdateInterval) 
    // se configurează prin PositionOptions la fiecare apel către getCurrentPosition/watchPosition
    
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
      overlaysWebView: false
    }
  }
};

export default config;
