/**
 * EFFICIENT: Native GPS Plugin Interface
 * Direct Capacitor plugin calls - no WebView bridge timing issues
 */

import { registerPlugin } from '@capacitor/core';

export interface GPSPlugin {
  startGPS(options: {
    courseId: string;
    vehicleNumber: string;
    uit: string;
    authToken: string;
    status: number;
  }): Promise<{ success: boolean; message: string }>;

  stopGPS(options: {
    courseId: string;
  }): Promise<{ success: boolean; message: string }>;

  updateGPS(options: {
    courseId: string;
    status: number;
  }): Promise<{ success: boolean; message: string }>;

  clearAllGPS(): Promise<{ success: boolean; message: string }>;
}

const GPS = registerPlugin<GPSPlugin>('GPS');

export default GPS;

// Simple wrapper functions for direct use
export const startNativeGPS = async (
  courseId: string,
  vehicleNumber: string,
  uit: string,
  authToken: string,
  status: number
): Promise<boolean> => {
  try {
    // ANDROID APK ONLY: Use DirectGPS interface exclusively
    if (typeof (window as any).DirectGPS !== 'undefined') {
      console.log('🚀 Using DirectGPS interface for Android APK');
      console.log(`Course: ${courseId}, Vehicle: ${vehicleNumber}, UIT: ${uit}, Status: ${status}`);
      
      const result = (window as any).DirectGPS.startGPS(courseId, vehicleNumber, uit, authToken, status);
      
      if (result === 'SUCCESS') {
        console.log('✅ DirectGPS started successfully');
        return true;
      } else {
        console.error('❌ DirectGPS start failed:', result);
        return false;
      }
    } else {
      // TEMPORARY BROWSER TESTING: Simulate GPS transmission for development testing
      console.warn('⚠️ DirectGPS not available - using BROWSER TEST MODE');
      console.log('🧪 SIMULATING GPS transmission to test server connectivity');
      
      try {
        // Import GPS transmission function for browser testing
        const { sendGPSData } = await import('../services/api');
        
        // Create test GPS data
        const testGPSData = {
          lat: 44.4268,
          lng: 26.1025,
          timestamp: new Date().toISOString(),
          viteza: 45,
          directie: 180,
          altitudine: 85,
          baterie: 85,
          numar_inmatriculare: vehicleNumber,
          uit: uit,
          status: status,
          hdop: 2.1,
          gsm_signal: '4G'
        };
        
        console.log('📡 BROWSER TEST: Sending GPS data to server...', testGPSData);
        
        // Test GPS transmission
        const success = await sendGPSData(testGPSData, authToken);
        
        if (success) {
          console.log('✅ BROWSER TEST: GPS transmission successful!');
          return true;
        } else {
          console.error('❌ BROWSER TEST: GPS transmission failed');
          return false;
        }
        
      } catch (error) {
        console.error('❌ BROWSER TEST ERROR:', error);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ GPS Plugin error:', error);
    return false;
  }
};

export const stopNativeGPS = async (courseId: string): Promise<boolean> => {
  try {
    // ANDROID APK ONLY: Use DirectGPS interface exclusively
    if (typeof (window as any).DirectGPS !== 'undefined') {
      console.log('🛑 Stopping GPS via DirectGPS interface');
      console.log(`Course: ${courseId}`);
      
      const result = (window as any).DirectGPS.stopGPS(courseId);
      
      if (result === 'SUCCESS') {
        console.log('✅ DirectGPS stopped successfully');
        return true;
      } else {
        console.error('❌ DirectGPS stop failed:', result);
        return false;
      }
    } else {
      console.error('❌ DirectGPS interface not available for stop operation');
      return false;
    }
  } catch (error) {
    console.error('❌ Native GPS stop error:', error);
    return false;
  }
};

export const updateNativeGPS = async (courseId: string, status: number): Promise<boolean> => {
  try {
    // ANDROID APK ONLY: Use DirectGPS interface exclusively
    if (typeof (window as any).DirectGPS !== 'undefined') {
      console.log('🔄 Updating GPS via DirectGPS interface');
      console.log(`Course: ${courseId}, Status: ${status}`);
      
      const result = (window as any).DirectGPS.updateGPS(courseId, status);
      
      if (result === 'SUCCESS') {
        console.log('✅ DirectGPS updated successfully');
        return true;
      } else {
        console.error('❌ DirectGPS update failed:', result);
        return false;
      }
    } else {
      console.error('❌ DirectGPS interface not available for update operation');
      return false;
    }
  } catch (error) {
    console.error('❌ Native GPS update error:', error);
    return false;
  }
};

export const clearAllNativeGPS = async (): Promise<boolean> => {
  try {
    // ANDROID APK ONLY: Use DirectGPS interface exclusively
    if (typeof (window as any).DirectGPS !== 'undefined') {
      console.log('🧹 Clearing all GPS via DirectGPS interface');
      
      const result = (window as any).DirectGPS.clearAllGPS();
      
      if (result === 'SUCCESS') {
        console.log('✅ DirectGPS cleared all successfully');
        return true;
      } else {
        console.error('❌ DirectGPS clear all failed:', result);
        return false;
      }
    } else {
      console.error('❌ DirectGPS interface not available for clear all operation');
      return false;
    }
  } catch (error) {
    console.error('❌ Native GPS clear error:', error);
    return false;
  }
};