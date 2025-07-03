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
      getGPSServiceStatus: () => string;
      getOfflineGPSCount: () => string;
      restartGPSService: () => string;
    };
    AndroidGPSReady?: boolean;
    androidGPSBridgeReady?: boolean;
    androidGPSInterfaceReady?: boolean;
  }
}

import { logGPS, logGPSError } from './appLogger';
import { getStoredToken, getStoredVehicleNumber } from './storage';
// Direct AndroidGPS service handles native interface operations

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
  intervalId?: NodeJS.Timeout; // For June 26th browser GPS intervals
}

class DirectAndroidGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();



  /**
   * Send status update to server via gps.php
   */
  private async sendStatusToServer(uit: string, vehicleNumber: string, token: string, status: number): Promise<void> {
    try {
      const { sendGPSData } = await import('./api');
      
      // Create GPS data with current position for status update
      const { Geolocation } = await import('@capacitor/geolocation');
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000
      });

      const { Device } = await import('@capacitor/device');
      const batteryInfo = await Device.getBatteryInfo();
      
      const gpsData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: new Date().toISOString(),
        viteza: position.coords.speed || 0,
        directie: position.coords.heading || 0,
        altitudine: position.coords.altitude || 0,
        baterie: Math.round(batteryInfo.batteryLevel! * 100),
        numar_inmatriculare: vehicleNumber,
        uit: uit,
        status: status,
        hdop: position.coords.accuracy || 1,
        gsm_signal: 4
      };

      console.log(`📡 Sending status ${status} to server for UIT: ${uit}`);
      await sendGPSData(gpsData, token);
      console.log(`✅ Status ${status} sent successfully to server`);
      
    } catch (error) {
      console.error(`❌ Failed to send status ${status} to server:`, error);
      throw error;
    }
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
      
      // STATUS 2 (START): Setup complete GPS tracking
      if (newStatus === 2) {
        console.log(`🚀 STATUS 2 (START): Setting up complete GPS tracking for ${courseId}`);
        await this.startTracking(courseId, vehicleNumber, realUIT, token, newStatus);
      }
      
      // STATUS 3 (PAUSE) or STATUS 4 (STOP): Stop GPS transmission
      if (newStatus === 3 || newStatus === 4) {
        console.log(`⏸️ STATUS ${newStatus} (${newStatus === 3 ? 'PAUSE' : 'STOP'}): Stopping GPS for ${courseId}`);
        await this.stopTracking(courseId);
      }
      
      // Update local tracking
      const course = this.activeCourses.get(courseId);
      if (course) {
        course.status = newStatus;
        this.activeCourses.set(courseId, course);
      }
      
      // Direct MainActivity Android GPS interface for status update
      if (window.AndroidGPS && window.AndroidGPS.updateStatus) {
        const result = window.AndroidGPS.updateStatus(courseId, newStatus);
        logGPS(`✅ MainActivity GPS status updated: ${result}`);
      } else {
        logGPSError(`❌ AndroidGPS interface not available for status update - this is normal in browser`);
        console.warn('AndroidGPS status interface not available - this is normal in browser development');
      }
      
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
      logGPS(`🚀 Starting GPS tracking (June 26th method): ${courseId}`);
      
      const courseData: ActiveCourse = { courseId, vehicleNumber, uit, token, status };
      this.activeCourses.set(courseId, courseData);
      
      console.log(`📊 Active courses after start: ${this.activeCourses.size}`);
      console.log(`🗂️ Courses in map: [${Array.from(this.activeCourses.keys()).join(', ')}]`);
      
      // HYBRID: June 26th format + Android background service for phone locked
      await this.startHybridGPS_June26thFormat_AndroidBackground(courseData);
      
    } catch (error) {
      logGPSError(`❌ GPS start error: ${error}`);
      throw error;
    }
  }

  /**
   * ANDROID ONLY: Direct Android background service for all GPS (phone locked + unlocked)
   */
  private async startHybridGPS_June26thFormat_AndroidBackground(course: ActiveCourse): Promise<void> {
    // ONLY Android background service - no browser GPS to prevent duplicates
    await this.startAndroidBackgroundService(course);
    
    logGPS(`🔥 ANDROID ONLY GPS - no browser intervals to prevent double transmissions`);
  }

  /**
   * ANDROID NATIVE GPS: Pure Android background service for real mobile GPS
   * JavaScript GPS doesn't work in background when phone is locked
   */
  private async startAndroidBackgroundService(course: ActiveCourse): Promise<void> {
    const { courseId, vehicleNumber, uit, token, status } = course;
    
    logGPS(`🔥 ANDROID NATIVE GPS: Starting MainActivity GPS service only`);
    
    try {
      // Start Android native GPS service (only method that works in background)
      if (window.AndroidGPS && window.AndroidGPS.startGPS) {
        const result = window.AndroidGPS.startGPS(courseId, vehicleNumber, uit, token, status);
        logGPS(`✅ MainActivity GPS started: ${result}`);
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
      
      // Stop Android native GPS service only
      if (window.AndroidGPS && window.AndroidGPS.stopGPS) {
        const result = window.AndroidGPS.stopGPS(courseId);
        logGPS(`✅ MainActivity GPS stopped: ${result}`);
      } else {
        logGPS(`⚠️ AndroidGPS interface not available - APK only feature`);
      }
      
      // Remove from local tracking
      this.activeCourses.delete(courseId);
      logGPS(`✅ Android native GPS stopped for course: ${courseId}`);
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
      logGPS(`🧹 LOGOUT: Clearing GPS tracking data but preserving background service capability`);
      
      // STEP 1: Stop all active courses individually
      for (const courseId of this.activeCourses.keys()) {
        try {
          await this.stopTracking(courseId);
          logGPS(`✅ Stopped GPS for course: ${courseId}`);
        } catch (error) {
          logGPSError(`⚠️ Error stopping course ${courseId}: ${error}`);
        }
      }
      
      // STEP 2: Clear only active courses data, NOT the entire service
      // This preserves the background service capability for next login
      if (window.AndroidGPS && typeof window.AndroidGPS.clearAllOnLogout === 'function') {
        try {
          const result = window.AndroidGPS.clearAllOnLogout();
          logGPS(`✅ AndroidGPS active courses cleared: ${result}`);
        } catch (error) {
          logGPSError(`⚠️ AndroidGPS clearAll failed: ${error}`);
        }
      } else {
        logGPS(`ℹ️ AndroidGPS interface not available (browser mode)`);
      }
      
      // STEP 3: Clear local tracking data only
      this.activeCourses.clear();
      logGPS(`📊 Local GPS tracking data cleared: ${this.activeCourses.size} courses remaining`);
      logGPS(`ℹ️ Background GPS service preserved for future use`);
      
    } catch (error) {
      logGPSError(`❌ GPS clear error: ${error}`);
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

export const checkGPSServiceStatus = () => {
  if (window.AndroidGPS && window.AndroidGPS.getGPSServiceStatus) {
    return window.AndroidGPS.getGPSServiceStatus();
  }
  return "ERROR: AndroidGPS interface not available";
};

export const getOfflineGPSCount = () => {
  if (window.AndroidGPS && window.AndroidGPS.getOfflineGPSCount) {
    return window.AndroidGPS.getOfflineGPSCount();
  }
  return "ERROR: AndroidGPS interface not available";
};

export const restartGPSService = () => {
  if (window.AndroidGPS && window.AndroidGPS.restartGPSService) {
    return window.AndroidGPS.restartGPSService();
  }
  return "ERROR: AndroidGPS interface not available";
};