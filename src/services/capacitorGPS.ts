/**
 * Capacitor GPS Plugin Interface
 * Modern replacement for AndroidGPS WebView interface
 * Uses Capacitor Plugin architecture for reliable Android communication
 */

import { registerPlugin } from '@capacitor/core';
import { logGPS, logGPSError } from './appLogger';

// GPS Plugin interface definition
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

  updateStatus(options: {
    courseId: string;
    newStatus: number;
  }): Promise<{ success: boolean; message: string }>;

  clearAll(): Promise<{ success: boolean; message: string }>;
}

// Register the native GPS plugin
const GPSPluginNative = registerPlugin<GPSPlugin>('GPSPlugin');

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
}

class CapacitorGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();

  async startGPSTracking(
    courseId: string,
    vehicleNumber: string,
    uit: string,
    token: string,
    status: number
  ): Promise<void> {
    try {
      logGPS(`🚀 Starting GPS tracking via Capacitor Plugin: ${courseId}`);
      
      const courseData: ActiveCourse = { courseId, vehicleNumber, uit, token, status };
      this.activeCourses.set(courseId, courseData);
      
      console.log(`📊 Active courses after start: ${this.activeCourses.size}`);
      console.log(`🗂️ Courses in map: [${Array.from(this.activeCourses.keys()).join(', ')}]`);
      
      const result = await GPSPluginNative.startGPS({
        courseId,
        vehicleNumber,
        uit,
        authToken: token,
        status
      });
      
      if (result.success) {
        logGPS(`✅ Capacitor GPS started successfully: ${result.message}`);
      } else {
        logGPSError(`❌ Capacitor GPS start failed: ${result.message}`);
      }
      
    } catch (error) {
      logGPSError(`❌ Capacitor GPS start error: ${error}`);
      throw error;
    }
  }

  async stopGPSTracking(courseId: string): Promise<void> {
    try {
      logGPS(`🛑 Stopping GPS tracking via Capacitor Plugin: ${courseId}`);
      
      const result = await GPSPluginNative.stopGPS({ courseId });
      
      if (result.success) {
        logGPS(`✅ Capacitor GPS stopped successfully: ${result.message}`);
        
        // Remove from active courses after 2 seconds (to allow final transmission)
        setTimeout(() => {
          this.activeCourses.delete(courseId);
          console.log(`🗑️ Course ${courseId} removed from active courses`);
          console.log(`📊 Active courses after stop: ${this.activeCourses.size}`);
        }, 2000);
      } else {
        logGPSError(`❌ Capacitor GPS stop failed: ${result.message}`);
      }
      
    } catch (error) {
      logGPSError(`❌ Capacitor GPS stop error: ${error}`);
      throw error;
    }
  }

  async updateCourseStatus(courseId: string, newStatus: number): Promise<void> {
    try {
      console.log(`🔄 Updating course status via Capacitor Plugin: ${courseId} → ${newStatus}`);
      
      // Update local tracking
      const course = this.activeCourses.get(courseId);
      if (course) {
        course.status = newStatus;
        this.activeCourses.set(courseId, course);
      }
      
      const result = await GPSPluginNative.updateStatus({
        courseId,
        newStatus
      });
      
      if (result.success) {
        logGPS(`✅ Capacitor GPS status updated successfully: ${result.message}`);
      } else {
        logGPSError(`❌ Capacitor GPS status update failed: ${result.message}`);
      }
      
    } catch (error) {
      logGPSError(`❌ Capacitor GPS status update error: ${error}`);
      throw error;
    }
  }

  async clearAllGPS(): Promise<void> {
    try {
      logGPS(`🧹 Clearing all GPS data via Capacitor Plugin`);
      
      const result = await GPSPluginNative.clearAll();
      
      if (result.success) {
        this.activeCourses.clear();
        logGPS(`✅ Capacitor GPS cleared successfully: ${result.message}`);
      } else {
        logGPSError(`❌ Capacitor GPS clear failed: ${result.message}`);
      }
      
    } catch (error) {
      logGPSError(`❌ Capacitor GPS clear error: ${error}`);
      throw error;
    }
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses.keys());
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }

  isTrackingActive(): boolean {
    return this.activeCourses.size > 0;
  }

  getServiceInfo() {
    return {
      type: 'Capacitor GPS Plugin',
      activeCourses: this.activeCourses.size,
      courses: Array.from(this.activeCourses.keys())
    };
  }
}

// Create singleton instance
export const capacitorGPSService = new CapacitorGPSService();

// Export convenient functions
export const startGPSTracking = (courseId: string, vehicleNumber: string, uit: string, token: string, status: number) =>
  capacitorGPSService.startGPSTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) =>
  capacitorGPSService.stopGPSTracking(courseId);

export const updateCourseStatus = (courseId: string, newStatus: number) =>
  capacitorGPSService.updateCourseStatus(courseId, newStatus);

export const getActiveCourses = () =>
  capacitorGPSService.getActiveCourses();

export const hasActiveCourses = () =>
  capacitorGPSService.hasActiveCourses();

export const isGPSTrackingActive = () =>
  capacitorGPSService.isTrackingActive();

export const getCapacitorGPSInfo = () =>
  capacitorGPSService.getServiceInfo();

export const clearAllGPS = () =>
  capacitorGPSService.clearAllGPS();