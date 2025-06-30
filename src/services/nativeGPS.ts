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
    // Check if DirectGPS interface is available (Android APK)
    if (typeof (window as any).DirectGPS !== 'undefined') {
      console.log('🚀 Using DirectGPS interface for Android');
      console.log(`Course: ${courseId}, Vehicle: ${vehicleNumber}, UIT: ${uit}, Status: ${status}`);
      
      const result = (window as any).DirectGPS.startGPS(courseId, vehicleNumber, uit, authToken, status);
      
      if (result === 'SUCCESS') {
        console.log('✅ DirectGPS started successfully');
        return true;
      } else {
        console.error('❌ DirectGPS start failed:', result);
        return false;
      }
    }
    
    // Fallback: Try Capacitor GPS plugin (for testing in browser)
    console.log('🚀 Starting native GPS via Capacitor Plugin (fallback)');
    console.log(`Course: ${courseId}, Vehicle: ${vehicleNumber}, UIT: ${uit}, Status: ${status}`);
    
    const result = await GPS.startGPS({
      courseId,
      vehicleNumber,
      uit,
      authToken,
      status
    });
    
    console.log('✅ Capacitor GPS Plugin result:', result);
    return result.success;
  } catch (error) {
    console.error('❌ GPS Plugin error:', error);
    return false;
  }
};

export const stopNativeGPS = async (courseId: string): Promise<boolean> => {
  try {
    console.log('🛑 Stopping native GPS via Capacitor Plugin');
    console.log(`Course: ${courseId}`);
    
    const result = await GPS.stopGPS({ courseId });
    
    console.log('✅ Native GPS stop result:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Native GPS stop error:', error);
    return false;
  }
};

export const updateNativeGPS = async (courseId: string, status: number): Promise<boolean> => {
  try {
    console.log('🔄 Updating native GPS via Capacitor Plugin');
    console.log(`Course: ${courseId}, Status: ${status}`);
    
    const result = await GPS.updateGPS({ courseId, status });
    
    console.log('✅ Native GPS update result:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Native GPS update error:', error);
    return false;
  }
};

export const clearAllNativeGPS = async (): Promise<boolean> => {
  try {
    console.log('🧹 Clearing all native GPS via Capacitor Plugin');
    
    const result = await GPS.clearAllGPS();
    
    console.log('✅ Native GPS clear result:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Native GPS clear error:', error);
    return false;
  }
};