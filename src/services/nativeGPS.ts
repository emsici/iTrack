import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

declare global {
  interface Window {
    SimpleGPSPlugin: SimpleGPSPluginInterface;
  }
}

const SimpleGPSPlugin = Capacitor.isNativePlatform() 
  ? (window as any).SimpleGPSPlugin || (Capacitor as any).Plugins?.SimpleGPSPlugin
  : null;

interface SimpleGPSPluginInterface {
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

// Service for managing native Android GPS foreground service
class NativeGPSService {
  private activeCourses: Set<string> = new Set();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    try {
      // Request GPS permissions first
      await this.requestPermissions();
      
      // Use Simple GPS Service for background tracking
      const result = await SimpleGPSPlugin.startGPSTracking({
        vehicleNumber,
        courseId,
        uit,
        authToken: token,
        status
      });
      
      if (result.success) {
        this.activeCourses.add(courseId);
      } else {
        throw new Error(result.message);
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
      const result = await SimpleGPSPlugin.stopGPSTracking({
        courseId
      });
      
      if (result.success) {
        this.activeCourses.delete(courseId);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to stop GPS tracking:', error);
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
      const result = await SimpleGPSPlugin.isGPSTrackingActive();
      return result.isActive;
    } catch (error) {
      console.error('Error checking tracking status:', error);
      return false;
    }
  }
}

// Export singleton instance
const nativeGPSService = new NativeGPSService();

// Export functions
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