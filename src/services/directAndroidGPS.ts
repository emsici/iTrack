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
// import { sendGPSData } from './api'; // DEZACTIVAT - folosim doar Android GPS direct
// import { Geolocation } from '@capacitor/geolocation'; // DEZACTIVAT - folosim doar Android GPS direct
import { getStoredToken, getStoredVehicleNumber } from './storage';
// import { guaranteedGPSService } from './garanteedGPS'; // DEZACTIVAT - folosim doar Android GPS direct
// import { sharedTimestampService } from './sharedTimestamp'; // DEZACTIVAT - folosim doar Android GPS direct  
// import { simpleNetworkCheck } from './simpleNetworkCheck'; // DEZACTIVAT - folosim doar Android GPS direct
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



  // ELIMINAT sendStatusToServer - era adăugat recent și a stricat transmisia
  // Revenim la varianta originală: DOAR Android GPS direct

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
      
      // REVERT LA VARIANTA CARE MERGEA - fără sendStatusToServer hibrid
      // Trimitem DOAR Android GPS direct, fără coordonate de la browser
      
      // STEP 2: Handle GPS coordinate transmission based on status
      if (newStatus === 3 || newStatus === 4) {
        console.log(`🛑 STEP 2: Oprire GPS pentru ${courseId} - status ${newStatus === 3 ? 'PAUZĂ' : 'STOP'}`);
        
        // IMMEDIATE STOP: Stop tracking BEFORE any more transmissions can happen
        await this.stopTracking(courseId);
        
        // GPS OPRIT pentru status PAUSE/STOP - doar Android GPS direct
        
        console.log(`✅ GPS oprit pentru cursa ${courseId} - status ${newStatus === 3 ? 'PAUZĂ' : 'STOP'}`);
      }
      
      // STEP 3: Handle GPS coordinate transmission for START/RESUME - VARIANTA ORIGINALĂ
      if (newStatus === 2) {
        console.log(`🚀 START/RESUME GPS DIRECT Android - varianta originală`);
        
        // DIRECT Android GPS - pentru START și RESUME (revenire din pauză)
        await this.startTracking(courseId, vehicleNumber, realUIT, token, newStatus);
        
        console.log(`✅ GPS ANDROID PORNIT pentru START/RESUME - varianta care mergea`);
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

  // ELIMINAT toate funcțiile hibride - revenim la varianta simplă care mergea

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
      
      // DIRECT Android GPS - varianta simplă care mergea
      await this.startAndroidBackgroundService(courseData);
      
    } catch (error) {
      logGPSError(`❌ GPS start error: ${error}`);
      throw error;
    }
  }

  /**
   * METODA PRINCIPALA CARE MERGEA: Direct Android GPS din commit 656f7610
   */
  private async startAndroidBackgroundService(course: ActiveCourse): Promise<void> {
    const { courseId, vehicleNumber, uit, token, status } = course;
    
    logGPS(`🎯 ANDROID GPS: Starting direct service - commit 656f7610 care mergea`);
    
    // SIMPLIFICAT: GPS Android pornește direct fără verificări de conectivitate
    
    // EXACT ca în commit-ul care mergea - DOAR Android GPS direct
    if (window.AndroidGPS && window.AndroidGPS.startGPS) {
      const result = window.AndroidGPS.startGPS(courseId, vehicleNumber, uit, token, status);
      logGPS(`✅ Android GPS PORNIT: ${result} - varianta funcțională`);
    } else {
      logGPS(`⚠️ AndroidGPS interface not available - normal în browser development`);
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
      
      // SIMPLIFICAT: Fără GPS garantat - doar Android GPS direct
      
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
      logGPS(`🧹 LOGOUT: Stopping GPS transmissions but KEEPING offline coordinates`);
      logGPS(`💾 IMPORTANT: Offline coordinates preserved for next login to avoid missing route segments`);
      
      // STEP 1: Stop all active courses individually
      for (const courseId of this.activeCourses.keys()) {
        try {
          await this.stopTracking(courseId);
          logGPS(`✅ Stopped GPS for course: ${courseId}`);
        } catch (error) {
          logGPSError(`⚠️ Error stopping course ${courseId}: ${error}`);
        }
      }
      
      // SIMPLIFICAT: Fără GPS garantat - doar Android GPS direct
      
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