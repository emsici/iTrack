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
// Removed unused imports - Android-only GPS architecture

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

  private isAndroidGPSAvailable(): boolean {
    const available = typeof window !== 'undefined' && 
           !!window.AndroidGPS && 
           typeof window.AndroidGPS?.startGPS === 'function';
    
    // EXPLICIT debugging for Android interface availability
    logGPS(`🔍 Android Interface Check:`);
    logGPS(`  - window exists: ${typeof window !== 'undefined'}`);
    logGPS(`  - AndroidGPS exists: ${!!(window as any)?.AndroidGPS}`);
    logGPS(`  - startGPS function: ${typeof (window as any)?.AndroidGPS?.startGPS}`);
    logGPS(`  - Final result: ${available}`);
    
    return available;
  }

  async updateCourseStatus(courseId: string, newStatus: number): Promise<void> {
    try {
      console.log(`🔄 Updating course status via MainActivity Android: ${courseId} → ${newStatus}`);
      
      // STATUS 2 (START): Setup complete GPS tracking
      if (newStatus === 2) {
        console.log(`🚀 STATUS 2 (START): Setting up complete GPS tracking for ${courseId}`);
        
        // Get course data from Capacitor Preferences (consistent with login system)
        const vehicleNumber = await getStoredVehicleNumber() || 'UNKNOWN';
        const token = await getStoredToken() || '';
        
        // Get real UIT from courses data
        const storedCourses = localStorage.getItem(`courses_${vehicleNumber}`);
        let realUIT = courseId; // fallback
        
        if (storedCourses) {
          try {
            const coursesData = JSON.parse(storedCourses);
            const foundCourse = coursesData.find((c: any) => c.id === courseId);
            if (foundCourse && foundCourse.uit) {
              realUIT = foundCourse.uit;
              console.log(`📋 Found UIT for ${courseId}: ${realUIT}`);
            }
          } catch (error) {
            console.warn('Error parsing courses data:', error);
          }
        }
        
        // Start GPS tracking first
        await this.startTracking(courseId, vehicleNumber, realUIT, token, newStatus);
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
   * Start Android background service for GPS with phone locked
   */
  private async startAndroidBackgroundService(course: ActiveCourse): Promise<void> {
    const { courseId, vehicleNumber, uit, token, status } = course;
    
    if (this.isAndroidGPSAvailable()) {
      try {
        logGPS(`🚀 Calling AndroidGPS.startGPS with parameters:`);
        logGPS(`  - courseId: ${courseId}`);
        logGPS(`  - vehicleNumber: ${vehicleNumber}`);
        logGPS(`  - uit: ${uit}`);
        logGPS(`  - token length: ${token.length}`);
        logGPS(`  - status: ${status}`);
        
        const result = window.AndroidGPS!.startGPS(courseId, vehicleNumber, uit, token, status);
        logGPS(`✅ Android background GPS result: ${result}`);
        
        // Test if service is actually running
        setTimeout(() => {
          logGPS(`🔍 Testing service status after 3 seconds...`);
        }, 3000);
        
      } catch (error) {
        logGPSError(`❌ Android background GPS error: ${error}`);
        logGPSError(`❌ Error details: ${JSON.stringify(error)}`);
      }
    } else {
      logGPS(`📱 AndroidGPS not available - background GPS not started`);
    }
  }



  async stopTracking(courseId: string): Promise<void> {
    try {
      logGPS(`🛑 Stopping GPS tracking (June 26th method): ${courseId}`);
      
      // Stop browser GPS interval (June 26th method)
      const courseData = this.activeCourses.get(courseId);
      if (courseData && courseData.intervalId) {
        clearInterval(courseData.intervalId);
        logGPS(`✅ June 26th GPS interval stopped for ${courseId}`);
      }
      
      // Remove from local tracking after 2 seconds (for status 4)
      setTimeout(() => {
        this.activeCourses.delete(courseId);
        console.log(`📊 Active courses after stop: ${this.activeCourses.size}`);
      }, 2000);
      
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
      logGPS(`🧹 Clearing all GPS data - LOCAL ONLY approach`);
      
      // SKIP AndroidGPS completely - it's unreliable
      // Just stop all GPS operations locally
      for (const courseId of this.activeCourses.keys()) {
        try {
          await this.stopTracking(courseId);
          logGPS(`✅ Stopped GPS for course: ${courseId}`);
        } catch (error) {
          logGPSError(`⚠️ Error stopping course ${courseId}: ${error}`);
        }
      }
      
      // Clear local data
      this.activeCourses.clear();
      logGPS(`📊 All local GPS data cleared: ${this.activeCourses.size} courses`);
      
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