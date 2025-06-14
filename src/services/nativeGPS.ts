import { registerPlugin } from '@capacitor/core';

interface GPSTrackingPlugin {
  startGPSTracking(options: {
    vehicleNumber: string;
    courseId: string;
    uit: string;
    authToken: string;
  }): Promise<{ success: boolean; message: string }>;
  
  stopGPSTracking(options: {
    courseId: string;
  }): Promise<{ success: boolean; message: string }>;
  
  isGPSTrackingActive(): Promise<{ isActive: boolean }>;
}

const GPSTracking = registerPlugin<GPSTrackingPlugin>('GPSTracking');

// Service for managing native Android GPS foreground service
class NativeGPSService {
  private activeCourses: Set<string> = new Set();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string): Promise<void> {
    try {
      console.log(`Starting native GPS tracking for course ${courseId}`);
      
      const result = await GPSTracking.startGPSTracking({
        vehicleNumber,
        courseId,
        uit,
        authToken: token
      });
      
      if (result.success) {
        this.activeCourses.add(courseId);
        console.log(`Native GPS tracking started: ${result.message}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to start native GPS tracking:', error);
      throw error;
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    try {
      console.log(`Stopping native GPS tracking for course ${courseId}`);
      
      const result = await GPSTracking.stopGPSTracking({
        courseId
      });
      
      if (result.success) {
        this.activeCourses.delete(courseId);
        console.log(`Native GPS tracking stopped: ${result.message}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to stop native GPS tracking:', error);
      throw error;
    }
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses);
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }

  async isTrackingActive(): Promise<boolean> {
    try {
      const result = await GPSTracking.isGPSTrackingActive();
      return result.isActive;
    } catch (error) {
      console.error('Failed to check GPS tracking status:', error);
      return false;
    }
  }
}

// Export singleton instance
const nativeGPSService = new NativeGPSService();

export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string) => 
  nativeGPSService.startTracking(courseId, vehicleNumber, uit, token);

export const stopGPSTracking = (courseId: string) => 
  nativeGPSService.stopTracking(courseId);

export const getActiveCourses = () => 
  nativeGPSService.getActiveCourses();

export const hasActiveCourses = () => 
  nativeGPSService.hasActiveCourses();

export const isGPSTrackingActive = () => 
  nativeGPSService.isTrackingActive();