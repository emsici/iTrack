import { CapacitorHttp } from '@capacitor/core';

// Global GPS transmission function for Android background service
export const setupGPSBridge = () => {
  // Enhanced AndroidGPS interface detection
  console.log('🔍 Checking AndroidGPS interface availability...');
  console.log('window.AndroidGPS:', typeof (window as any).AndroidGPS);
  console.log('window.AndroidGPSReady:', (window as any).AndroidGPSReady);
  console.log('window.androidGPSBridgeReady:', (window as any).androidGPSBridgeReady);
  console.log('window.androidGPSInterfaceReady:', (window as any).androidGPSInterfaceReady);
  
  if ((window as any).AndroidGPS) {
    console.log('✅ AndroidGPS interface detected');
    console.log('startGPS method:', typeof (window as any).AndroidGPS.startGPS);
    console.log('stopGPS method:', typeof (window as any).AndroidGPS.stopGPS);
    console.log('updateStatus method:', typeof (window as any).AndroidGPS.updateStatus);
  } else {
    console.log('❌ AndroidGPS interface NOT detected - WebView bridge may not be ready');
    
    // Set up periodic checking for AndroidGPS interface
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      if ((window as any).AndroidGPS) {
        console.log(`✅ AndroidGPS interface detected after ${checkCount} attempts`);
        console.log('startGPS method:', typeof (window as any).AndroidGPS.startGPS);
        clearInterval(checkInterval);
      } else if (checkCount >= 10) {
        console.log(`❌ AndroidGPS interface still not available after ${checkCount} attempts - stopping checks`);
        clearInterval(checkInterval);
      } else {
        console.log(`🔄 AndroidGPS check ${checkCount}/10 - still waiting...`);
      }
    }, 1000); // Check every second for 10 seconds
  }
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