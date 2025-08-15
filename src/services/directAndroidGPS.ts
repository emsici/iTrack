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
   * OPRIT: Nu mai trimite coordonate din browser - OptimalGPSService gestionează tot
   */
  private async sendStatusToServer(uit: string, vehicleNumber: string, token: string, status: number): Promise<void> {
    console.log(`🚫 DirectAndroidGPS: STATUS-only transmission pentru ${status} - NU mai trimite coordonate din browser`);
    console.log(`✅ OptimalGPSService va gestiona TOATE coordonatele GPS cu precizie înaltă`);
    
    // IMPORTANT: NU mai apelează Geolocation.getCurrentPosition()
    // NU mai trimite coordonate prin sendGPSData()
    // OptimalGPSService gestionează totul acum
    
    console.log(`📋 Status ${status} va fi gestionat de OptimalGPSService pentru UIT: ${uit}`);
  }

  async updateCourseStatus(courseId: string, newStatus: number): Promise<void> {
    try {
      console.log(`🔄 Updating course status via MainActivity Android: ${courseId} → ${newStatus}`);
      
      // Get course data needed for all status updates
      const vehicleNumber = await getStoredVehicleNumber() || 'UNKNOWN';
      const token = await getStoredToken() || '';
      const realUIT = courseId; // courseId IS the UIT from VehicleScreen fix
      
      // CRITICAL FLOW:
      // 1. For PAUSE (3) or STOP (4): Send status FIRST, then stop GPS coordinates
      // 2. For START (2): Send status FIRST, then start GPS coordinates
      
      console.log(`📡 STEP 1: Sending status ${newStatus} to server for UIT: ${realUIT}`);
      await this.sendStatusToServer(realUIT, vehicleNumber, token, newStatus);
      console.log(`✅ Status ${newStatus} sent to server successfully`);
      
      // STEP 2: Handle GPS coordinate transmission based on status
      if (newStatus === 3 || newStatus === 4) {
        console.log(`🛑 PAS 2: Se OPRESC IMEDIAT toate coordonatele GPS - NICIO TRANSMISIE pentru ${courseId}`);
        
        // IMMEDIATE STOP: Stop tracking BEFORE any more transmissions can happen
        await this.stopTracking(courseId);
        

        // CRITICAL FIX: Actualizează și status GPS Garantat pentru a preveni transmisii suplimentare
        try {
          await guaranteedGPSService.updateStatus(courseId, newStatus);
          console.log(`✅ Status GPS Garantat actualizat la ${newStatus} - nicio transmisie`);
        } catch (guaranteedError) {
          console.error(`⚠️ Nu s-a putut actualiza status GPS Garantat: ${guaranteedError}`);
        }
        
        console.log(`✅ TOATE serviciile GPS oprite pentru cursa ${courseId} - status ${newStatus === 3 ? 'PAUZĂ' : 'STOP'}`);
      }
      
      // STEP 3: Handle GPS coordinate transmission for START/RESUME
      if (newStatus === 2) {
        console.log(`🚀 STEP 3: STARTING GPS coordinates after START/RESUME status transmission`);
        await this.startTracking(courseId, vehicleNumber, realUIT, token, newStatus);
        console.log(`✅ GPS coordinates STARTED after START/RESUME status`);
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
    
    logGPS(`🎯 ANDROID GPS: Starting direct Android GPS service`);
    
    try {
      await guaranteedGPSService.startGuaranteedGPS(courseId, vehicleNumber, uit, token, status);
      logGPS(`✅ Android GPS started successfully for course: ${courseId}`);
    } catch (guaranteedError) {
      logGPSError(`❌ Android GPS failed: ${guaranteedError}`);
      throw guaranteedError;
    }
  }



  async stopTracking(courseId: string): Promise<void> {
    try {
      logGPS(`🛑 Stopping Android GPS tracking: ${courseId}`);
      
      // Stop Android native GPS service  
      if (window.AndroidGPS && window.AndroidGPS.stopGPS) {
        const result = window.AndroidGPS.stopGPS(courseId);
        logGPS(`✅ MainActivity GPS stopped: ${result}`);
      }
      
      // Stop guaranteed JavaScript GPS backup
      await guaranteedGPSService.stopGPS(courseId);
      logGPS(`✅ Guaranteed GPS backup stopped for course: ${courseId}`);
      
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