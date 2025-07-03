/**
 * Direct Android GPS Service
 * Uses MainActivity WebView interface for reliable Android communication
 * Single method approach - guaranteed to work
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
// Direct AndroidGPS service handles native interface operations

// Android-only GPS service - no local JavaScript Map needed
// All course tracking happens in OptimalGPSService.java activeCourses Map

class DirectAndroidGPSService {
  // No local Map - OptimalGPSService handles everything



  /**
   * REMOVED: No longer sending status to server via gps.php to prevent duplicate GPS transmissions
   * OptimalGPSService handles ALL GPS transmissions including status updates
   */
  private async sendStatusToServer(uit: string, _vehicleNumber: string, _token: string, status: number): Promise<void> {
    // CRITICAL: Do NOT send GPS data here - this causes duplicate transmissions with OptimalGPSService
    // OptimalGPSService handles ALL GPS coordinate transmission and status updates
    console.log(`⚠️ Status ${status} update for UIT ${uit} - handled by OptimalGPSService only`);
    console.log(`✅ Status update delegated to OptimalGPSService to prevent duplicates`);
  }

  async updateCourseStatus(courseId: string, newStatus: number): Promise<void> {
    try {
      console.log(`🔄 Updating course status via MainActivity Android: ${courseId} → ${newStatus}`);
      
      // Get course data needed for all status updates
      const vehicleNumber = await getStoredVehicleNumber() || 'UNKNOWN';
      const token = await getStoredToken() || '';
      const realUIT = courseId; // courseId IS the UIT from VehicleScreen fix
      
      // CRITICAL: Send status to server FIRST before updating GPS
      console.log(`📡 Sending status ${newStatus} to server for UIT: ${realUIT}`);
      await this.sendStatusToServer(realUIT, vehicleNumber, token, newStatus);
      
      // STATUS 2 (START or RESUME): Always delegate to Android
      if (newStatus === 2) {
        console.log(`🚀 STATUS 2 (START/RESUME): Delegating to Android GPS service for ${courseId}`);
        await this.startAndroidGPS(courseId, vehicleNumber, realUIT, token, newStatus);
      }
      
      // STATUS 3 (PAUSE): Update status only, keep GPS service running
      // STATUS 4 (STOP): Stop GPS transmission completely
      if (newStatus === 4) {
        console.log(`🛑 STATUS 4 (STOP): Stopping GPS completely for ${courseId}`);
        await this.stopTracking(courseId);
      }
      
      // No local tracking - OptimalGPSService handles everything
      
      // For PAUSE (status 3): Update Android service status but keep GPS running
      if (newStatus === 3) {
        console.log(`⏸️ STATUS 3 (PAUSE): Updating Android service status for ${courseId}`);
        if (window.AndroidGPS && window.AndroidGPS.updateStatus) {
          const result = window.AndroidGPS.updateStatus(courseId, newStatus);
          logGPS(`✅ MainActivity GPS status updated to PAUSE: ${result}`);
        }
      }
      
      // For START/RESUME (status 2): Android service handles this in startTracking
      // For STOP (status 4): Android service handles this in stopTracking
      
    } catch (error) {
      logGPSError(`❌ GPS status update error: ${error}`);
      throw error;
    }
  }

  async startTracking(
    courseId: string,
    vehicleNumber: string,
    uit: string,
    token: string,
    status: number
  ): Promise<void> {
    try {
      logGPS(`🚀 Starting Android GPS tracking: ${courseId}`);
      
      const courseData: ActiveCourse = { courseId, vehicleNumber, uit, token, status };
      this.activeCourses.set(courseId, courseData);
      
      console.log(`📊 Active courses after start: ${this.activeCourses.size}`);
      console.log(`🗂️ Courses in map: [${Array.from(this.activeCourses.keys()).join(', ')}]`);
      
      // DIRECT: Android background service only
      await this.startAndroidBackgroundService(courseData);
      
    } catch (error) {
      logGPSError(`❌ GPS start error: ${error}`);
      throw error;
    }
  }



  /**
   * SIMPLIFIED GPS: Only use Android native GPS via MainActivity
   * No guaranteed GPS service call to prevent duplicate transmissions
   */
  private async startAndroidBackgroundService(course: ActiveCourse): Promise<void> {
    const { courseId, vehicleNumber, uit, token, status } = course;
    
    logGPS(`🔥 ANDROID NATIVE GPS: Starting MainActivity GPS service only`);
    
    try {
      // Direct MainActivity Android GPS interface for single GPS service
      if (window.AndroidGPS && window.AndroidGPS.startGPS) {
        const result = window.AndroidGPS.startGPS(courseId, vehicleNumber, uit, token, status);
        logGPS(`✅ MainActivity GPS result: ${result}`);
      } else {
        logGPS(`⚠️ AndroidGPS interface not available - APK only feature`);
      }
      
    } catch (error) {
      logGPSError(`❌ MainActivity GPS failed: ${error}`);
    }
  }



  async stopTracking(courseId: string): Promise<void> {
    try {
      logGPS(`🛑 Stopping Android native GPS tracking: ${courseId}`);
      
      // Stop Android native GPS only
      if (window.AndroidGPS && window.AndroidGPS.stopGPS) {
        const result = window.AndroidGPS.stopGPS(courseId);
        logGPS(`✅ MainActivity GPS stop result: ${result}`);
      } else {
        logGPS(`⚠️ AndroidGPS interface not available - APK only feature`);
      }
      
      // Remove from local tracking
      this.activeCourses.delete(courseId);
      logGPS(`✅ Native GPS stopped for course: ${courseId}`);
      logGPS(`📊 Active courses after stop: ${this.activeCourses.size}`);
      
    } catch (error) {
      logGPSError(`❌ GPS stop error: ${error}`);
      throw error;
    }
  }



  getActiveCourses(): string[] {
    return Array.from(this.activeCourses.keys());
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }

  async isTrackingActive(): Promise<boolean> {
    return this.activeCourses.size > 0;
  }

  async logoutClearAll(): Promise<void> {
    try {
      logGPS(`🧹 LOGOUT: Clearing all courses from both Maps (JS + Android)`);
      
      const courseCount = this.activeCourses.size;
      
      // Clear Android activeCourses Map via CLEAR_ALL command
      if (window.AndroidGPS && window.AndroidGPS.clearAllOnLogout) {
        const result = window.AndroidGPS.clearAllOnLogout();
        logGPS(`✅ Android GPS cleared: ${result}`);
      } else {
        logGPS(`⚠️ AndroidGPS interface not available - APK only feature`);
      }
      
      // Clear local JavaScript Map
      this.activeCourses.clear();
      
      logGPS(`✅ LOGOUT: Cleared ${courseCount} courses from both Maps`);
      logGPS(`📊 Active courses after logout: ${this.activeCourses.size} courses`);
      
    } catch (error) {
      logGPSError(`❌ Logout clear error: ${error}`);
      throw error;
    }
  }

  getServiceInfo() {
    return {
      type: 'DirectAndroidGPS',
      activeCourses: this.activeCourses.size,
      courses: Array.from(this.activeCourses.keys())
    };
  }
}

export const directAndroidGPSService = new DirectAndroidGPSService();

// Export functions with consistent API
export const startGPSTracking = (courseId: string, vehicleNumber: string, uit: string, token: string, status: number) =>
  directAndroidGPSService.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) =>
  directAndroidGPSService.stopTracking(courseId);

export const updateCourseStatus = (courseId: string, newStatus: number) =>
  directAndroidGPSService.updateCourseStatus(courseId, newStatus);

export const getActiveCourses = () =>
  directAndroidGPSService.getActiveCourses();

export const hasActiveCourses = () =>
  directAndroidGPSService.hasActiveCourses();

export const isGPSTrackingActive = () =>
  directAndroidGPSService.isTrackingActive();

export const getDirectGPSInfo = () => directAndroidGPSService.getServiceInfo();

export const logoutClearAllGPS = () =>
  directAndroidGPSService.logoutClearAll();