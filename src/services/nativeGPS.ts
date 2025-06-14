import { Capacitor } from '@capacitor/core';

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

// Native Android GPS service interface
class NativeGPSService {
  private plugin: GPSTrackingPlugin | null = null;
  private activeCourses: Set<string> = new Set();

  constructor() {
    if (Capacitor.isNativePlatform()) {
      // Register the native plugin on Android
      try {
        this.plugin = (window as any).Capacitor?.Plugins?.GPSTracking as GPSTrackingPlugin;
        console.log('Native GPS plugin initialized:', this.plugin ? 'SUCCESS' : 'FAILED');
      } catch (error) {
        console.error('Error initializing native GPS plugin:', error);
        this.plugin = null;
      }
    }
  }

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string): Promise<boolean> {
    if (!this.plugin || !Capacitor.isNativePlatform()) {
      console.log('Native GPS service not available - using fallback');
      return false;
    }

    try {
      console.log(`Starting native Android GPS tracking for course ${courseId}`);
      
      const result = await this.plugin.startGPSTracking({
        vehicleNumber,
        courseId,
        uit,
        authToken: token
      });

      if (result.success) {
        this.activeCourses.add(courseId);
        console.log(`Native GPS tracking started successfully: ${result.message}`);
        return true;
      } else {
        console.error(`Failed to start native GPS tracking: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error starting native GPS tracking:', error);
      return false;
    }
  }

  async stopTracking(courseId: string): Promise<boolean> {
    if (!this.plugin || !Capacitor.isNativePlatform()) {
      console.log('Native GPS service not available');
      return false;
    }

    try {
      console.log(`Stopping native Android GPS tracking for course ${courseId}`);
      
      const result = await this.plugin.stopGPSTracking({
        courseId
      });

      if (result.success) {
        this.activeCourses.delete(courseId);
        console.log(`Native GPS tracking stopped successfully: ${result.message}`);
        return true;
      } else {
        console.error(`Failed to stop native GPS tracking: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error stopping native GPS tracking:', error);
      return false;
    }
  }

  async isTrackingActive(): Promise<boolean> {
    if (!this.plugin || !Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const result = await this.plugin.isGPSTrackingActive();
      return result.isActive;
    } catch (error) {
      console.error('Error checking GPS tracking status:', error);
      return false;
    }
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses);
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }
}

// Create singleton instance
const nativeGPSService = new NativeGPSService();

// Export functions
export const startNativeGPSTracking = (courseId: string, vehicleNumber: string, uit: string, token: string) => 
  nativeGPSService.startTracking(courseId, vehicleNumber, uit, token);

export const stopNativeGPSTracking = (courseId: string) => 
  nativeGPSService.stopTracking(courseId);

export const isNativeGPSTrackingActive = () => 
  nativeGPSService.isTrackingActive();

export const getNativeActiveCourses = () => 
  nativeGPSService.getActiveCourses();

export const hasNativeActiveCourses = () => 
  nativeGPSService.hasActiveCourses();