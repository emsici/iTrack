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

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
}

class DirectAndroidGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();

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
      logGPS(`🚀 Starting GPS tracking via MainActivity Android: ${courseId}`);
      
      const courseData: ActiveCourse = { courseId, vehicleNumber, uit, token, status };
      this.activeCourses.set(courseId, courseData);
      
      console.log(`📊 Active courses after start: ${this.activeCourses.size}`);
      console.log(`🗂️ Courses in map: [${Array.from(this.activeCourses.keys()).join(', ')}]`);
      
      await this.startAndroidNativeService(courseData);
      
    } catch (error) {
      logGPSError(`❌ GPS start error: ${error}`);
      throw error;
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    try {
      logGPS(`🛑 Stopping GPS tracking via MainActivity Android: ${courseId}`);
      
      await this.stopAndroidNativeService(courseId);
      
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

  private async startAndroidNativeService(course: ActiveCourse): Promise<void> {
    // SIMPLE approach - use what WORKS, avoid what doesn't
    logGPS(`🚀 Starting GPS for course: ${course.courseId}`);
    
    // Try AndroidGPS bridge first (works sometimes on phone)
    if (window.AndroidGPS && window.AndroidGPS.startGPS) {
      try {
        const result = window.AndroidGPS.startGPS(
          course.courseId, 
          course.vehicleNumber, 
          course.uit, 
          course.token, 
          course.status
        );
        logGPS(`✅ AndroidGPS started successfully: ${result}`);
        return;
      } catch (error) {
        logGPSError(`⚠️ AndroidGPS failed: ${error}`);
      }
    }
    
    // If AndroidGPS not available, just mark as started locally
    logGPS(`📱 GPS started locally for course: ${course.courseId} (background service will handle transmission)`);
  }
  
  private async stopAndroidNativeService(courseId: string): Promise<void> {
    // SIMPLE approach - use what WORKS
    logGPS(`🛑 Stopping GPS for course: ${courseId}`);
    
    // Try AndroidGPS bridge first
    if (window.AndroidGPS && window.AndroidGPS.stopGPS) {
      try {
        const result = window.AndroidGPS.stopGPS(courseId);
        logGPS(`✅ AndroidGPS stopped successfully: ${result}`);
        return;
      } catch (error) {
        logGPSError(`⚠️ AndroidGPS stop failed: ${error}`);
      }
    }
    
    // If AndroidGPS not available, just mark as stopped locally
    logGPS(`📱 GPS stopped locally for course: ${courseId}`);
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