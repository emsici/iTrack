/**
 * DIRECT GPS PLUGIN: No WebView dependency - uses Capacitor Plugin + Broadcast
 * Reliable GPS control that works even when WebView is suspended in background
 */

export interface DirectGPSPlugin {
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

// Simple wrapper functions for direct use
export const startNativeGPS = async (
  courseId: string,
  vehicleNumber: string,
  uit: string,
  authToken: string,
  status: number
): Promise<boolean> => {
  try {
    // ANDROID APK ONLY: Use DirectGPS Capacitor Plugin (no WebView dependency)
    console.log('🚀 Using DirectGPS Capacitor Plugin for reliable background GPS');
    console.log(`Course: ${courseId}, Vehicle: ${vehicleNumber}, UIT: ${uit}, Status: ${status}`);
    
    const { Capacitor, registerPlugin } = await import('@capacitor/core');
    
    if (Capacitor.isNativePlatform()) {
      // Register DirectGPS plugin
      const DirectGPS = registerPlugin<DirectGPSPlugin>('DirectGPS');
      
      const result = await DirectGPS.startGPS({
        courseId: courseId,
        vehicleNumber: vehicleNumber,
        uit: uit,
        authToken: authToken,
        status: status
      });
      
      if (result.success) {
        console.log('✅ DirectGPS Plugin started successfully:', result.message);
        return true;
      } else {
        console.error('❌ DirectGPS Plugin start failed:', result.message);
        return false;
      }
    } else {
      // BROWSER/DEVELOPMENT: Plugin not available
      console.error('❌ DirectGPS Plugin not available - app requires Android APK installation');
      console.error('🏗️ This application is designed exclusively for Android APK deployment');
      return false;
    }
  } catch (error) {
    console.error('❌ GPS Plugin error:', error);
    return false;
  }
};

export const stopNativeGPS = async (courseId: string): Promise<boolean> => {
  try {
    console.log('🛑 Stopping GPS for course via DirectGPS Plugin:', courseId);
    
    const { Capacitor, registerPlugin } = await import('@capacitor/core');
    
    if (Capacitor.isNativePlatform()) {
      const DirectGPS = registerPlugin<DirectGPSPlugin>('DirectGPS');
      
      const result = await DirectGPS.stopGPS({
        courseId: courseId
      });
      
      if (result.success) {
        console.log('✅ DirectGPS Plugin stopped successfully:', result.message);
        return true;
      } else {
        console.error('❌ DirectGPS Plugin stop failed:', result.message);
        return false;
      }
    } else {
      console.error('❌ DirectGPS Plugin not available for stop operation');
      return false;
    }
  } catch (error) {
    console.error('❌ Native GPS Plugin stop error:', error);
    return false;
  }
};

export const updateNativeGPS = async (courseId: string, status: number): Promise<boolean> => {
  try {
    console.log('🔄 Updating GPS via DirectGPS Plugin for course:', courseId, 'status:', status);
    
    const { Capacitor, registerPlugin } = await import('@capacitor/core');
    
    if (Capacitor.isNativePlatform()) {
      const DirectGPS = registerPlugin<DirectGPSPlugin>('DirectGPS');
      
      const result = await DirectGPS.updateGPS({
        courseId: courseId,
        status: status
      });
      
      if (result.success) {
        console.log('✅ DirectGPS Plugin updated successfully:', result.message);
        return true;
      } else {
        console.error('❌ DirectGPS Plugin update failed:', result.message);
        return false;
      }
    } else {
      console.error('❌ DirectGPS Plugin not available for update operation');
      return false;
    }
  } catch (error) {
    console.error('❌ Native GPS Plugin update error:', error);
    return false;
  }
};

export const clearAllNativeGPS = async (): Promise<boolean> => {
  try {
    console.log('🧹 Clearing all GPS via DirectGPS Plugin');
    
    const { Capacitor, registerPlugin } = await import('@capacitor/core');
    
    if (Capacitor.isNativePlatform()) {
      const DirectGPS = registerPlugin<DirectGPSPlugin>('DirectGPS');
      
      const result = await DirectGPS.clearAllGPS();
      
      if (result.success) {
        console.log('✅ DirectGPS Plugin cleared all successfully:', result.message);
        return true;
      } else {
        console.error('❌ DirectGPS Plugin clear all failed:', result.message);
        return false;
      }
    } else {
      console.error('❌ DirectGPS Plugin not available for clear all operation');
      return false;
    }
  } catch (error) {
    console.error('❌ Native GPS Plugin clear all error:', error);
    return false;
  }
};