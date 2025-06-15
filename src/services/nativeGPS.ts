import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

interface GPSTrackingPlugin {
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

import { registerPlugin } from '@capacitor/core';

// Register GPS plugin for native Android background service
let GPSTracking: GPSTrackingPlugin | null = null;

try {
  if (Capacitor.isNativePlatform()) {
    GPSTracking = registerPlugin<GPSTrackingPlugin>('GPSTracking');
  }
} catch (error) {
  console.warn('GPSTracking plugin not available in browser - will work in APK');
  GPSTracking = null;
}

// Service for managing native Android GPS foreground service
class NativeGPSService {
  private activeCourses: Set<string> = new Set();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    try {
      console.log(`Starting GPS tracking for course ${courseId} with status ${status}`);
      
      // Request GPS permissions before starting tracking
      await this.requestPermissions();
      
      if (GPSTracking && Capacitor.isNativePlatform()) {
        // Use native Android GPS foreground service
        const result = await GPSTracking.startGPSTracking({
          vehicleNumber,
          courseId,
          uit,
          authToken: token,
          status
        });
        
        if (result.success) {
          this.activeCourses.add(courseId);
          console.log(`Native background GPS tracking started: ${result.message}`);
        } else {
          throw new Error(result.message);
        }
      } else {
        // Browser fallback - course management only
        console.log(`Course ${courseId} prepared for background GPS tracking in APK`);
        this.activeCourses.add(courseId);
      }
      
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      throw error;
    }
  }



  private async requestPermissions(): Promise<void> {
    try {
      console.log('Requesting GPS and background location permissions...');
      
      // Request location permissions
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location === 'denied') {
        throw new Error('Permisiunile GPS sunt necesare pentru urmărirea traseului');
      }
      
      if (permissions.coarseLocation === 'denied') {
        console.warn('Permisiunea pentru locația aproximativă a fost refuzată');
      }
      
      console.log('GPS permissions granted:', permissions);
      
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw new Error('Nu s-au putut obține permisiunile GPS necesare');
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    try {
      console.log(`Stopping native GPS tracking for course ${courseId}`);
      
      if (GPSTracking && Capacitor.isNativePlatform()) {
        const result = await GPSTracking.stopGPSTracking({
          courseId
        });
        
        if (result.success) {
          this.activeCourses.delete(courseId);
          console.log(`Native GPS tracking stopped: ${result.message}`);
        } else {
          throw new Error(result.message);
        }
      } else {
        this.activeCourses.delete(courseId);
        console.log(`GPS tracking stopped for course ${courseId} (web fallback)`);
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
      if (GPSTracking && Capacitor.isNativePlatform()) {
        const result = await GPSTracking.isGPSTrackingActive();
        return result.isActive;
      } else {
        return this.activeCourses.size > 0;
      }
    } catch (error) {
      console.error('Failed to check GPS tracking status:', error);
      return false;
    }
  }
}

// Export singleton instance
const nativeGPSService = new NativeGPSService();

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