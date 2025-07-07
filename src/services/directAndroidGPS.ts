/**
 * Simple Android GPS Service - Pure Bridge to OptimalGPSService
 * No JavaScript Map - everything handled in Android native code
 */

// Global window interface definition for AndroidGPS
declare global {
  interface Window {
    AndroidGPS?: {
      startGPS: (courseId: string, vehicleNumber: string, uit: string, authToken: string, status: number) => string;
      stopGPS: (courseId: string) => string;
      updateStatus: (courseId: string, newStatus: number) => string;
      clearAllOnLogout: () => string;
    };
    AndroidGPSReady?: boolean;
    androidGPSBridgeReady?: boolean;
    androidGPSInterfaceReady?: boolean;
  }
}

import { logGPS, logGPSError } from './appLogger';
import { getStoredToken, getStoredVehicleNumber } from './storage';

class SimpleAndroidGPSService {
  /**
   * No local state - just bridge to Android
   */

  /**
   * Send status to server via gps.php (for server-side tracking)
   */
  private async sendStatusToServer(uit: string, vehicleNumber: string, token: string, status: number): Promise<void> {
    console.log(`⚠️ Status ${status} update for UIT ${uit} - handled by OptimalGPSService only`);
    console.log(`✅ Status update delegated to OptimalGPSService to prevent duplicates`);
  }

  async updateCourseStatus(courseId: string, newStatus: number): Promise<void> {
    try {
      console.log(`🔄 Simple Android GPS: ${courseId} → ${newStatus}`);
      
      // Get course data
      const vehicleNumber = await getStoredVehicleNumber() || 'UNKNOWN';
      const token = await getStoredToken() || '';
      const uit = courseId; // courseId IS the UIT
      
      // Send status to server first
      console.log(`📡 Sending status ${newStatus} to server for UIT: ${uit}`);
      await this.sendStatusToServer(uit, vehicleNumber, token, newStatus);
      
      // Always delegate to Android - OptimalGPSService handles START/PAUSE/RESUME/STOP logic
      console.log(`🔍 DEBUGGING: Checking window.AndroidGPS availability...`);
      console.log(`🔍 window.AndroidGPS exists: ${!!window.AndroidGPS}`);
      console.log(`🔍 window.AndroidGPSReady: ${window.AndroidGPSReady}`);
      console.log(`🔍 androidGPSBridgeReady: ${window.androidGPSBridgeReady}`);
      
      if (window.AndroidGPS) {
        console.log(`🔍 AndroidGPS methods available:`);
        console.log(`  - startGPS: ${typeof window.AndroidGPS.startGPS}`);
        console.log(`  - updateStatus: ${typeof window.AndroidGPS.updateStatus}`);
        console.log(`  - stopGPS: ${typeof window.AndroidGPS.stopGPS}`);
        
        let result: string = '';
        
        if (newStatus === 2) {
          // START or RESUME
          console.log(`🚀 CALLING AndroidGPS.startGPS with params: ${courseId}, ${vehicleNumber}, ${uit}, tokenLength: ${token.length}, status: ${newStatus}`);
          result = window.AndroidGPS.startGPS(courseId, vehicleNumber, uit, token, newStatus);
          console.log(`📤 AndroidGPS.startGPS returned: ${result}`);
          logGPS(`✅ Android START/RESUME: ${result}`);
        } else if (newStatus === 3) {
          // PAUSE
          console.log(`⏸️ CALLING AndroidGPS.updateStatus with params: ${courseId}, ${newStatus}`);
          result = window.AndroidGPS.updateStatus(courseId, newStatus);
          console.log(`📤 AndroidGPS.updateStatus returned: ${result}`);
          logGPS(`✅ Android PAUSE: ${result}`);
        } else if (newStatus === 4) {
          // STOP
          console.log(`🛑 CALLING AndroidGPS.stopGPS with params: ${courseId}`);
          result = window.AndroidGPS.stopGPS(courseId);
          console.log(`📤 AndroidGPS.stopGPS returned: ${result}`);
          logGPS(`✅ Android STOP: ${result}`);
        }
      } else {
        console.log(`❌ CRITICAL: window.AndroidGPS is NOT available!`);
        console.log(`🔍 Available window properties:`, Object.keys(window).filter(key => key.includes('Android')));
        logGPS(`⚠️ AndroidGPS not available - APK only`);
      }
      
    } catch (error) {
      logGPSError(`❌ Simple GPS error: ${error}`);
      throw error;
    }
  }

  async logoutClearAll(): Promise<void> {
    try {
      logGPS(`🧹 LOGOUT: Clearing Android GPS service`);
      
      if (window.AndroidGPS && window.AndroidGPS.clearAllOnLogout) {
        const result = window.AndroidGPS.clearAllOnLogout();
        logGPS(`✅ Android GPS cleared: ${result}`);
      } else {
        logGPS(`⚠️ AndroidGPS not available - APK only`);
      }
      
    } catch (error) {
      logGPSError(`❌ Logout error: ${error}`);
      throw error;
    }
  }
}

const simpleAndroidGPSService = new SimpleAndroidGPSService();

// Export simplified functions
export const updateCourseStatus = (courseId: string, newStatus: number) =>
  simpleAndroidGPSService.updateCourseStatus(courseId, newStatus);

export const logoutClearAllGPS = () =>
  simpleAndroidGPSService.logoutClearAll();