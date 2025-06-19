import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    GPSTracking: GPSTrackingInterface;
  }
}

// GPS Tracking Plugin Interface
interface GPSTrackingInterface {
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

// Get the native GPS plugin
const GPSTracking = Capacitor.isNativePlatform() 
  ? (window as any).GPSTracking || (Capacitor as any).Plugins?.GPSTracking
  : {
      startGPSTracking: async () => ({ success: true, message: 'Mock GPS started for web' }),
      stopGPSTracking: async () => ({ success: true, message: 'Mock GPS stopped for web' }),
      isGPSTrackingActive: async () => ({ isActive: false })
    };

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
}

// Native GPS service that connects to Android background service
class NativeGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    console.log(`Starting native GPS tracking for course ${courseId}, UIT: ${uit}`);
    
    try {
      // Store course data
      const courseData: ActiveCourse = {
        courseId,
        vehicleNumber,
        uit,
        token,
        status
      };
      
      this.activeCourses.set(courseId, courseData);
      
      // Start native Android GPS service
      if (!GPSTracking || !GPSTracking.startGPSTracking) {
        console.warn('Native GPS plugin not available - using web fallback');
        throw new Error('GPS plugin not available on this platform');
      }
      
      const result = await GPSTracking.startGPSTracking({
        vehicleNumber,
        courseId,
        uit,
        authToken: token,
        status
      });
      
      if (result.success) {
        console.log(`Native GPS tracking started successfully for UIT: ${uit}`);
      } else {
        throw new Error(result.message || 'Failed to start GPS tracking');
      }
      
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      this.activeCourses.delete(courseId);
      throw error;
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`Stopping native GPS tracking for course ${courseId}`);
    
    try {
      // Remove from local tracking
      this.activeCourses.delete(courseId);
      
      // Stop native Android GPS service
      if (!GPSTracking || !GPSTracking.stopGPSTracking) {
        console.warn('Native GPS plugin not available');
        return;
      }
      
      const result = await GPSTracking.stopGPSTracking({
        courseId
      });
      
      if (result.success) {
        console.log(`Native GPS tracking stopped successfully for course: ${courseId}`);
      } else {
        console.warn('Failed to stop GPS tracking:', result.message);
      }
      
    } catch (error) {
      console.error('Failed to stop GPS tracking:', error);
    }
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses.keys());
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }

  async isTrackingActive(): Promise<boolean> {
    try {
      if (!GPSTracking || !GPSTracking.isGPSTrackingActive) {
        return false;
      }
      
      const result = await GPSTracking.isGPSTrackingActive();
      return result.isActive;
    } catch (error) {
      console.error('Failed to check GPS tracking status:', error);
      return false;
    }
  }
}

// Create singleton instance
const gpsService = new NativeGPSService();

// Export functions that use the singleton
export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string, status: number = 2) => 
  gpsService.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) => 
  gpsService.stopTracking(courseId);

export const getActiveCourses = () => 
  gpsService.getActiveCourses();

export const hasActiveCourses = () => 
  gpsService.hasActiveCourses();

export const isGPSTrackingActive = () => 
  gpsService.isTrackingActive();