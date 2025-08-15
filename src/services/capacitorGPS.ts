/**
 * Alternative Capacitor Plugin GPS Service
 * Uses proper Capacitor plugin architecture instead of WebView bridge
 * Guarantees interface availability without timing issues
 */

import { registerPlugin } from '@capacitor/core';
import { logGPS, logGPSError } from './appLogger';

interface AndroidGPSPlugin {
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
}

const AndroidGPS = registerPlugin<AndroidGPSPlugin>('AndroidGPSPlugin');

class CapacitorGPSService {
  private activeCourses: Set<string> = new Set();

  async startGPS(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): Promise<void> {
    try {
      logGPS(`🚀 Starting Capacitor GPS Plugin for course: ${courseId}`);
      logGPS(`  - vehicleNumber: ${vehicleNumber}`);
      logGPS(`  - uit: ${uit}`);
      logGPS(`  - status: ${status}`);
      
      const result = await AndroidGPS.startGPS({
        courseId,
        vehicleNumber,
        uit,
        authToken: token,
        status
      });
      
      if (result.success) {
        this.activeCourses.add(courseId);
        logGPS(`✅ Capacitor GPS started successfully: ${result.message}`);
      } else {
        logGPSError(`❌ Capacitor GPS failed: ${result.message}`);
      }
      
    } catch (error) {
      logGPSError(`❌ Capacitor GPS error: ${error}`);
      throw error;
    }
  }

  async stopGPS(courseId: string): Promise<void> {
    try {
      logGPS(`🛑 Stopping Capacitor GPS for course: ${courseId}`);
      
      const result = await AndroidGPS.stopGPS({ courseId });
      
      if (result.success) {
        this.activeCourses.delete(courseId);
        logGPS(`✅ Capacitor GPS stopped: ${result.message}`);
      } else {
        logGPSError(`❌ Capacitor GPS stop failed: ${result.message}`);
      }
      
    } catch (error) {
      logGPSError(`❌ Capacitor GPS stop error: ${error}`);
    }
  }

  async updateStatus(courseId: string, newStatus: number): Promise<void> {
    try {
      logGPS(`🔄 Updating Capacitor GPS status: ${courseId} → ${newStatus}`);
      
      // CRITICAL FIX: Remove from activeCourses for status 3/4 to stop GPS
      if (newStatus === 3 || newStatus === 4) {
        logGPS(`🛑 REMOVING course ${courseId} from Capacitor GPS - status ${newStatus} (STOP/PAUSE)`);
        this.activeCourses.delete(courseId);
        logGPS(`✅ Course ${courseId} REMOVED from Capacitor GPS - ${this.activeCourses.size} courses remaining`);
      }
      
      const result = await AndroidGPS.updateStatus({ courseId, newStatus });
      
      if (result.success) {
        logGPS(`✅ Capacitor GPS status updated: ${result.message}`);
      } else {
        logGPSError(`❌ Capacitor GPS status update failed: ${result.message}`);
      }
      
    } catch (error) {
      logGPSError(`❌ Capacitor GPS status error: ${error}`);
    }
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses);
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }

  async clearAll(): Promise<void> {
    logGPS(`🧹 Clearing all Capacitor GPS courses`);
    
    for (const courseId of this.activeCourses) {
      await this.stopGPS(courseId);
    }
    
    this.activeCourses.clear();
    logGPS(`✅ All Capacitor GPS courses cleared`);
  }
}

export const capacitorGPSService = new CapacitorGPSService();

// Export convenient functions
export const startCapacitorGPS = (courseId: string, vehicleNumber: string, uit: string, token: string, status: number) =>
  capacitorGPSService.startGPS(courseId, vehicleNumber, uit, token, status);

export const stopCapacitorGPS = (courseId: string) =>
  capacitorGPSService.stopGPS(courseId);

export const updateCapacitorGPSStatus = (courseId: string, newStatus: number) =>
  capacitorGPSService.updateStatus(courseId, newStatus);

export const getCapacitorActiveCourses = () =>
  capacitorGPSService.getActiveCourses();

export const hasCapacitorActiveCourses = () =>
  capacitorGPSService.hasActiveCourses();

export const clearAllCapacitorGPS = () =>
  capacitorGPSService.clearAll();