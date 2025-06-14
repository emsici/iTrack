import { registerPlugin } from '@capacitor/core';

interface GPSTrackingPlugin {
  startGPSTracking(options: {
    vehicleNumber: string;
    courseId: string;
    uit: string;
    authToken: string;
  }): Promise<{ success: boolean; message: string }>;
  
  pauseGPSTracking(options: {
    courseId: string;
  }): Promise<{ success: boolean; message: string }>;
  
  resumeGPSTracking(options: {
    courseId: string;
  }): Promise<{ success: boolean; message: string }>;
  
  stopGPSTracking(options: {
    courseId: string;
  }): Promise<{ success: boolean; message: string }>;
  
  isGPSTrackingActive(): Promise<{ isActive: boolean }>;
  
  requestBackgroundPermissions(): Promise<{ success: boolean; message: string }>;
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

  async pauseTracking(courseId: string): Promise<void> {
    try {
      console.log(`Pausing native GPS tracking for course ${courseId} - stops coordinate transmission`);
      
      const result = await GPSTracking.pauseGPSTracking({
        courseId
      });
      
      if (result.success) {
        console.log(`Native GPS tracking paused: ${result.message}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to pause native GPS tracking:', error);
      throw error;
    }
  }

  async resumeTracking(courseId: string): Promise<void> {
    try {
      console.log(`Resuming native GPS tracking for course ${courseId} - resumes coordinate transmission`);
      
      const result = await GPSTracking.resumeGPSTracking({
        courseId
      });
      
      if (result.success) {
        console.log(`Native GPS tracking resumed: ${result.message}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to resume native GPS tracking:', error);
      throw error;
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    try {
      console.log(`Stopping native GPS tracking for course ${courseId} - sends final status and stops`);
      
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

  async requestBackgroundPermissions(): Promise<void> {
    try {
      const result = await GPSTracking.requestBackgroundPermissions();
      console.log('Background permissions requested:', result.message);
    } catch (error) {
      console.error('Failed to request background permissions:', error);
      throw error;
    }
  }
}

// Export singleton instance
const nativeGPSService = new NativeGPSService();

export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string) => 
  nativeGPSService.startTracking(courseId, vehicleNumber, uit, token);

export const pauseGPSTracking = (courseId: string) => 
  nativeGPSService.pauseTracking(courseId);

export const resumeGPSTracking = (courseId: string) => 
  nativeGPSService.resumeTracking(courseId);

export const stopGPSTracking = (courseId: string) => 
  nativeGPSService.stopTracking(courseId);

export const getActiveCourses = () => 
  nativeGPSService.getActiveCourses();

export const hasActiveCourses = () => 
  nativeGPSService.hasActiveCourses();

export const isGPSTrackingActive = () => 
  nativeGPSService.isTrackingActive();

export const requestBackgroundPermissions = () => 
  nativeGPSService.requestBackgroundPermissions();