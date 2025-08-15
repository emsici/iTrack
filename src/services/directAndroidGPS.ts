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
import { sendGPSData } from './api';
import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { getStoredToken, getStoredVehicleNumber } from './storage';
import { offlineGPSService } from './offlineGPS';
import { guaranteedGPSService } from './garanteedGPS';
import { sharedTimestampService } from './sharedTimestamp';
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
      // Create GPS data with current position for status update - FORCE REAL GPS
      console.log(`🔍 DirectAndroidGPS: Getting REAL position for status ${status}...`);
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,  // Forțează GPS de înaltă precizie
        timeout: 15000,            // Timeout extins pentru GPS real
        maximumAge: 0              // Nu folosi cache - locație nouă
      });
      
      // VERIFICARE GPS REAL
      if (position.coords.accuracy && position.coords.accuracy > 100) {
        console.warn(`⚠️ GPS accuracy poor: ${position.coords.accuracy}m - dar transmitem oricum (GPS real)`);
      }
      console.log(`📍 DirectAndroidGPS: REAL GPS Position - Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}, Accuracy: ${position.coords.accuracy}m`);

      const batteryInfo = await Device.getBatteryInfo();
      
      const timestamp = sharedTimestampService.getSharedTimestampISO();
      
      const gpsData = {
        lat: Math.round(position.coords.latitude * 10000000) / 10000000,  // Exact 7 decimale - standard GPS
        lng: Math.round(position.coords.longitude * 10000000) / 10000000, // Exact 7 decimale - standard GPS
        timestamp: timestamp,
        viteza: position.coords.speed || 0,
        directie: position.coords.heading || 0,
        altitudine: position.coords.altitude || 0,
        baterie: Math.round(batteryInfo.batteryLevel! * 100),
        numar_inmatriculare: vehicleNumber,
        uit: uit,
        status: status,
        hdop: position.coords.accuracy || 1,
        gsm_signal: navigator.onLine ? ((navigator as any).connection?.effectiveType === '4g' ? 4 : 3) : 1
      };

      console.log(`📡 Sending status ${status} to server for UIT: ${uit}`);
      console.log(`🕒 DirectAndroidGPS SHARED TIMESTAMP: ${timestamp} (${new Date(timestamp).getTime()})`);
      const success = await sendGPSData(gpsData, token);
      
      if (success) {
        console.log(`✅ Status ${status} sent successfully to server`);
      } else {
        console.log(`❌ Status ${status} failed - saving offline for later sync`);
        
        // SAVE TO OFFLINE STORAGE when transmission fails
        try {
          await offlineGPSService.saveCoordinate(gpsData, uit, vehicleNumber, token, status);
          console.log(`💾 Status coordinate saved offline - UIT: ${uit}`);
        } catch (offlineError) {
          console.error(`❌ Failed to save status coordinate offline: ${offlineError}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed to send status ${status} to server:`, error);
      console.error(`🚨 GPS REAL not available in browser - install APK on Android`);
      console.error(`📱 Current environment: ${navigator.userAgent.includes('Android') ? 'Android Browser' : 'Desktop Browser'}`);
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
      
      // IMPORTANT: Stop all other GPS services before status transmission to prevent concurrent transmissions
      if (newStatus === 3 || newStatus === 4) {
        console.log(`🛑 PRE-STOPPING all GPS services before ${newStatus === 3 ? 'PAUSE' : 'STOP'} transmission to prevent race conditions`);
        await this.stopTracking(courseId);
        
        // EMERGENCY STOP: Stop all guaranteed GPS services to prevent race conditions
        if ((window as any).garanteedGPS) {
          try {
            (window as any).garanteedGPS.emergencyStopAll();
            console.log(`🛑 EMERGENCY STOP: All GaranteedGPS services stopped to prevent concurrent transmissions`);
          } catch (e) {
            console.log(`⚠️ Could not emergency stop garanteedGPS: ${e}`);
          }
        }
        
        // Small delay to ensure other services have stopped
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await this.sendStatusToServer(realUIT, vehicleNumber, token, newStatus);
      
      // STATUS 2 (START): Setup complete GPS tracking
      if (newStatus === 2) {
        console.log(`🚀 STATUS 2 (START): Setting up complete GPS tracking for ${courseId}`);
        await this.startTracking(courseId, vehicleNumber, realUIT, token, newStatus);
      }
      
      // STATUS 3 (PAUSE) or STATUS 4 (STOP): Ensure GPS transmission is completely stopped
      if (newStatus === 3 || newStatus === 4) {
        console.log(`⏸️ STATUS ${newStatus} (${newStatus === 3 ? 'PAUSE' : 'STOP'}): Final GPS stop confirmation for ${courseId}`);
        // Already stopped above - this is just for logging consistency
      }
      
      // Update local tracking - CRITICAL FIX: Remove courses with status 3/4 completely
      if (newStatus === 3 || newStatus === 4) {
        logGPS(`🛑 REMOVING course ${courseId} from directAndroidGPS activeCourses - status ${newStatus} (STOP/PAUSE)`);
        this.activeCourses.delete(courseId);
        logGPS(`✅ Course ${courseId} REMOVED from directAndroidGPS - ${this.activeCourses.size} courses remaining`);
      } else {
        // For other statuses, update the course data
        const course = this.activeCourses.get(courseId);
        if (course) {
          course.status = newStatus;
          this.activeCourses.set(courseId, course);
        }
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
   * PRIORITY GPS: Smart method selection with fallback - no duplicate transmissions
   * Uses priority system: Android Native → Capacitor → JavaScript backup
   */
  private async startAndroidBackgroundService(course: ActiveCourse): Promise<void> {
    const { courseId, vehicleNumber, uit, token, status } = course;
    
    logGPS(`🎯 PRIORITY GPS: Starting intelligent GPS with method prioritization`);
    
    try {
      // Import and use Priority GPS Service
      const { priorityGPSService } = await import('./priorityGPS');
      await priorityGPSService.startGPS(courseId, vehicleNumber, uit, token, status);
      
      logGPS(`✅ Priority GPS started successfully for course: ${courseId}`);
      
    } catch (error) {
      // Fallback to guaranteed GPS if priority system fails
      logGPSError(`❌ Priority GPS failed, falling back to guaranteed GPS: ${error}`);
      
      try {
        await guaranteedGPSService.startGuaranteedGPS(courseId, vehicleNumber, uit, token, status);
        logGPS(`✅ Fallback to Guaranteed GPS successful for course: ${courseId}`);
      } catch (fallbackError) {
        logGPSError(`❌ Both Priority and Guaranteed GPS failed: ${fallbackError}`);
        throw fallbackError;
      }
    }
  }



  async stopTracking(courseId: string): Promise<void> {
    try {
      logGPS(`🛑 Stopping PRIORITY GPS tracking: ${courseId}`);
      
      try {
        // 1. Stop Priority GPS Service (handles all methods intelligently)
        const { priorityGPSService } = await import('./priorityGPS');
        await priorityGPSService.stopGPS(courseId);
        logGPS(`✅ Priority GPS stopped for course: ${courseId}`);
      } catch (priorityError) {
        // Fallback to manual stopping
        logGPSError(`❌ Priority GPS stop failed, using manual cleanup: ${priorityError}`);
        
        // Stop Android native GPS service  
        if (window.AndroidGPS && window.AndroidGPS.stopGPS) {
          const result = window.AndroidGPS.stopGPS(courseId);
          logGPS(`✅ MainActivity GPS stopped: ${result}`);
        }
        
        // Stop guaranteed JavaScript GPS backup
        await guaranteedGPSService.stopGPS(courseId);
        logGPS(`✅ Guaranteed GPS backup stopped for course: ${courseId}`);
      }
      
      // Remove from local tracking
      this.activeCourses.delete(courseId);
      logGPS(`✅ GPS tracking stopped for course: ${courseId}`);
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
      logGPS(`🧹 LOGOUT: Clearing all GPS data and stopping all transmissions`);
      
      // STEP 1: Stop all active courses individually
      for (const courseId of this.activeCourses.keys()) {
        try {
          await this.stopTracking(courseId);
          logGPS(`✅ Stopped GPS for course: ${courseId}`);
        } catch (error) {
          logGPSError(`⚠️ Error stopping course ${courseId}: ${error}`);
        }
      }
      
      // STEP 2: Stop guaranteed GPS service 
      await guaranteedGPSService.clearAll();
      logGPS(`✅ Guaranteed GPS service cleared`);
      
      // STEP 3: Call AndroidGPS clearAllOnLogout to stop native service completely
      if (window.AndroidGPS && typeof window.AndroidGPS.clearAllOnLogout === 'function') {
        try {
          const result = window.AndroidGPS.clearAllOnLogout();
          logGPS(`✅ AndroidGPS native service cleared: ${result}`);
        } catch (error) {
          logGPSError(`⚠️ AndroidGPS clearAllOnLogout failed: ${error}`);
        }
      } else {
        logGPS(`ℹ️ AndroidGPS interface not available (browser mode)`);
      }
      
      // STEP 4: Clear local data
      this.activeCourses.clear();
      logGPS(`📊 All local GPS data cleared: ${this.activeCourses.size} courses remaining`);
      
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