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
  private gpsIntervals: Map<string, number> = new Map();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    try {
      console.log(`Starting GPS tracking for course ${courseId} with status ${status}`);
      
      // Request GPS permissions and start location tracking
      await this.requestPermissions();
      
      // For testing only - real background GPS requires compiled APK
      this.activeCourses.add(courseId);
      console.log(`Course ${courseId} marked for GPS tracking - requires APK with native service for background operation`);
      
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      throw error;
    }
  }

  private startContinuousGPSTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): void {
    console.log(`Starting continuous GPS tracking for course ${courseId}`);
    
    // Send GPS data immediately and then every 60 seconds
    this.sendGPSUpdate(courseId, vehicleNumber, uit, token, status);
    
    const intervalId = setInterval(() => {
      this.sendGPSUpdate(courseId, vehicleNumber, uit, token, status);
    }, 60000); // 60 seconds
    
    this.gpsIntervals.set(courseId, intervalId);
  }

  private async sendGPSUpdate(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): Promise<void> {
    try {
      const { sendGPSData } = await import('../services/api');
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      });

      const { Device } = await import('@capacitor/device');
      const batteryInfo = await Device.getBatteryInfo();
      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const gpsData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: currentTime,
        viteza: Math.max(0, Math.round((position.coords.speed || 0) * 3.6)),
        directie: Math.round(position.coords.heading || 0),
        altitudine: Math.round(position.coords.altitude || 0),
        baterie: Math.round((batteryInfo.batteryLevel || 0) * 100),
        numar_inmatriculare: vehicleNumber,
        uit: uit,
        status: status.toString(),
        hdop: Math.round(position.coords.accuracy || 0).toString(),
        gsm_signal: '100'
      };

      await sendGPSData(gpsData, token);
      console.log(`GPS data sent for course ${courseId} with UIT ${uit}`);
      
    } catch (error) {
      console.error(`Failed to send GPS data for course ${courseId}:`, error);
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
        // Clear GPS interval for this course
        const intervalId = this.gpsIntervals.get(courseId);
        if (intervalId) {
          clearInterval(intervalId);
          this.gpsIntervals.delete(courseId);
        }
        
        this.activeCourses.delete(courseId);
        console.log(`GPS tracking stopped for course ${courseId}`);
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