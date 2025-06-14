import { registerPlugin } from '@capacitor/core';

interface SimpleGPSPlugin {
  startGPSTracking(options: {
    vehicleNumber: string;
    courseId: string;
    uit: string;
    authToken: string;
    status?: number;
  }): Promise<{ success: boolean; message: string }>;
  
  stopGPSTracking(options: {
    courseId: string;
  }): Promise<{ success: boolean; message: string }>;
  
  isGPSTrackingActive(): Promise<{ isActive: boolean }>;
}

const SimpleGPS = registerPlugin<SimpleGPSPlugin>('SimpleGPS');

// Simple GPS service for reliable background tracking
class SimpleGPSService {
  private activeCourses: Set<string> = new Set();

  async startTracking(courseId: string, vehicleNumber: string, token: string, uit: string, status: number = 2): Promise<void> {
    try {
      console.log(`Starting simple GPS tracking for course ${courseId} with UIT ${uit}`);
      
      const result = await SimpleGPS.startGPSTracking({
        courseId,
        vehicleNumber,
        uit,
        authToken: token,
        status
      });

      if (result.success) {
        this.activeCourses.add(courseId);
        console.log(`GPS tracking started successfully for course ${courseId}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error(`Failed to start GPS tracking for course ${courseId}:`, error);
      throw error;
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    try {
      console.log(`Stopping simple GPS tracking for course ${courseId}`);
      
      const result = await SimpleGPS.stopGPSTracking({
        courseId
      });

      if (result.success) {
        this.activeCourses.delete(courseId);
        console.log(`GPS tracking stopped successfully for course ${courseId}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error(`Failed to stop GPS tracking for course ${courseId}:`, error);
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
      const result = await SimpleGPS.isGPSTrackingActive();
      return result.isActive;
    } catch (error) {
      console.error('Failed to check GPS tracking status:', error);
      return false;
    }
  }
}

// Global instance
const simpleGPSService = new SimpleGPSService();

// Export functions for easy use
export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string, status: number = 2) => 
  simpleGPSService.startTracking(courseId, vehicleNumber, token, uit, status);

export const stopGPSTracking = (courseId: string) => 
  simpleGPSService.stopTracking(courseId);

export const getActiveCourses = () => 
  simpleGPSService.getActiveCourses();

export const hasActiveCourses = () => 
  simpleGPSService.hasActiveCourses();

export const isGPSTrackingActive = () => 
  simpleGPSService.isTrackingActive();

export default simpleGPSService;