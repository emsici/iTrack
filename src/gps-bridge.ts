import { CapacitorHttp } from '@capacitor/core';

// Global GPS transmission function for Android background service
export const setupGPSBridge = () => {
  // Make function globally available for Android WebView
  (window as any).sendGPSViaCapacitor = async (gpsDataString: string, token: string): Promise<boolean> => {
    try {
      console.log('📡 Background GPS transmission started');
      console.log('📊 GPS data length:', gpsDataString.length);
      
      const gpsData = JSON.parse(gpsDataString);
      
      const response = await CapacitorHttp.post({
        url: 'https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'iTrack-Android-Service/1.0'
        },
        data: gpsData
      });
      
      if (response.status >= 200 && response.status < 300) {
        console.log('✅ Background GPS transmission successful');
        return true;
      } else {
        console.error('❌ Background GPS transmission failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Background GPS transmission error:', error);
      return false;
    }
  };
  
  console.log('✅ GPS bridge setup completed');
};