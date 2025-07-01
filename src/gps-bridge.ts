import { CapacitorHttp } from '@capacitor/core';

// Modern Capacitor GPS Bridge - replaces old WebView interface
export const setupGPSBridge = () => {
  console.log('✅ GPS Bridge initialized - Android service ready for GPS transmission');
  // Make function globally available for Android WebView
  (window as any).sendGPSViaCapacitor = async (gpsDataString: string, token: string): Promise<boolean> => {
    try {
      console.log('🌉 GPS Bridge: Android service transmission request');
      console.log('📊 Data length:', gpsDataString.length, 'chars');
      console.log('🔑 Token available:', token ? 'YES' : 'NO');
      
      const gpsData = JSON.parse(gpsDataString);
      console.log('📍 Coordinates:', gpsData.lat, gpsData.lng);
      console.log('🎯 UIT:', gpsData.uit, '| Status:', gpsData.status);
      
      const requestData = {
        url: 'https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'iTrack-Android-Service/1.0'
        },
        data: gpsData
      };
      
      console.log('📡 Transmitting GPS via CapacitorHttp...');
      const response = await CapacitorHttp.post(requestData);
      
      console.log('📨 Response status:', response.status);
      console.log('📊 Response data:', response.data);
      
      if (response.status >= 200 && response.status < 300) {
        console.log('✅ GPS transmission SUCCESS for UIT:', gpsData.uit);
        return true;
      } else {
        console.error('❌ GPS transmission FAILED:', response.status, response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ GPS Bridge ERROR:', error);
      
      // Enhanced fallback with fetch
      try {
        console.log('🔄 Fallback: trying with fetch...');
        const gpsData = JSON.parse(gpsDataString);
        
        const response = await fetch('https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'iTrack-Android-Service/1.0'
          },
          body: JSON.stringify(gpsData),
          signal: AbortSignal.timeout(10000)
        });
        
        const success = response.ok;
        console.log('📡 Fallback result:', success ? 'SUCCESS' : 'FAILED');
        
        if (success) {
          const responseText = await response.text();
          console.log('📊 Fallback response:', responseText);
        }
        
        return success;
      } catch (fallbackError) {
        console.error('❌ Fallback fetch FAILED:', fallbackError);
        return false;
      }
    }
  };
  
  console.log('✅ GPS Bridge setup complete - Android service ready');
};