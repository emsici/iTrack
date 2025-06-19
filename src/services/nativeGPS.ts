// Native GPS tracking service for Android APK
// Connects directly to GPSTrackingPlugin and EnhancedGPSService

import { registerPlugin } from '@capacitor/core';

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

const GPSTracking = registerPlugin<GPSTrackingInterface>('GPSTracking');

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
}

// GPS service that connects to native Android EnhancedGPSService
class NativeGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    console.log(`Starting GPS tracking for course ${courseId}, UIT: ${uit}`);
    
    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token,
      status
    };
    
    this.activeCourses.set(courseId, courseData);
    
    // Detailed plugin diagnostics for APK debugging
    console.log(`Plugin Diagnostics:`);
    console.log(`- Capacitor available: ${!!(window as any)?.Capacitor}`);
    console.log(`- Platform: ${(window as any)?.Capacitor?.platform || 'unknown'}`);
    console.log(`- Available plugins: ${Object.keys((window as any)?.Capacitor?.Plugins || {})}`);
    console.log(`- User agent: ${navigator.userAgent}`);
    console.log(`- GPSTracking registered: ${typeof GPSTracking !== 'undefined'}`);
    
    try {
      console.log(`Calling Capacitor GPS plugin with parameters:`);
      console.log(`- Vehicle: ${vehicleNumber}`);
      console.log(`- Course: ${courseId}`);
      console.log(`- UIT: ${uit}`);
      console.log(`- Status: ${status}`);
      
      const result = await GPSTracking.startGPSTracking({
        vehicleNumber,
        courseId,
        uit,
        authToken: token,
        status
      });
      
      console.log(`Capacitor GPS plugin response:`, result);
      
      if (result && result.success) {
        console.log(`GPS tracking started successfully for UIT: ${uit}`);
        console.log(`EnhancedGPSService will transmit coordinates every 60 seconds`);
      } else {
        console.warn(`GPS tracking failed for UIT: ${uit}`, result);
      }
    } catch (error) {
      console.error(`GPS plugin error for UIT: ${uit}:`, error);
      console.error('Plugin not available on this platform');
      throw error;
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`Stopping GPS tracking for course ${courseId}`);
    
    try {
      const result = await GPSTracking.stopGPSTracking({
        courseId
      });
      
      console.log(`GPS stop result:`, result);
      this.activeCourses.delete(courseId);
    } catch (error) {
      console.error(`Error stopping GPS tracking for ${courseId}:`, error);
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
    try {
      const result = await GPSTracking.isGPSTrackingActive();
      return result.isActive;
    } catch (error) {
      console.error('Error checking GPS tracking status:', error);
      return false;
    }
  }
}

const nativeGPSService = new NativeGPSService();

// Public API for course management
export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string, status: number = 2) => 
  nativeGPSService.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) => 
  nativeGPSService.stopTracking(courseId);

export const getActiveCourses = () => 
  nativeGPSService.getActiveCourses();

export const hasActiveCourses = () => 
  nativeGPSService.hasActiveCourses();

export const isGPSTrackingActive = () => 
  nativeGPSService.isTrackingActive();