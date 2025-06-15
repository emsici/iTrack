import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

declare global {
  interface Window {
    GPSTracking: GPSTrackingPlugin;
  }
}

const GPSTracking = Capacitor.isNativePlatform() 
  ? (window as any).GPSTracking || (Capacitor as any).Plugins?.GPSTracking
  : null;

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

// Service for managing native Android GPS foreground service
class NativeGPSService {
  private activeCourses: Set<string> = new Set();
  private jsIntervals: Map<string, number> = new Map();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    try {
      console.log(`Starting GPS tracking for course ${courseId} with status ${status}`);
      console.log(`Platform detection: isNativePlatform=${Capacitor.isNativePlatform()}, platform=${Capacitor.getPlatform()}`);
      console.log(`GPSTracking plugin available: ${!!GPSTracking}`);
      
      // Request GPS permissions first
      await this.requestPermissions();
      
      if (GPSTracking && Capacitor.isNativePlatform()) {
        // Use native Android GPS foreground service for real background tracking
        console.log(`Attempting to start native Android GPS service...`);
        const result = await GPSTracking.startGPSTracking({
          vehicleNumber,
          courseId,
          uit,
          authToken: token,
          status
        });
        
        if (result.success) {
          this.activeCourses.add(courseId);
          console.log(`✓ Native Android GPS service started: ${result.message}`);
        } else {
          console.error(`✗ Native GPS service failed: ${result.message}`);
          throw new Error(result.message);
        }
      } else {
        // Fallback for WebView or testing - start JavaScript GPS tracking
        this.activeCourses.add(courseId);
        console.log(`⚠ Starting fallback JavaScript GPS tracking (not background-capable)`);
        this.startJavaScriptGPSTracking(courseId, vehicleNumber, uit, token, status);
      }
      
    } catch (error) {
      console.error('Failed to start native GPS tracking:', error);
      throw error;
    }
  }

  private startJavaScriptGPSTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): void {
    console.log(`Starting JavaScript GPS fallback for course ${courseId}`);
    
    // Send initial GPS data
    this.sendJavaScriptGPSData(courseId, vehicleNumber, uit, token, status);
    
    // Set up interval for testing (will work in foreground only)
    const intervalId = setInterval(() => {
      this.sendJavaScriptGPSData(courseId, vehicleNumber, uit, token, status);
    }, 60000);
    
    // Store interval for cleanup
    (this as any).jsIntervals = (this as any).jsIntervals || new Map();
    (this as any).jsIntervals.set(courseId, intervalId);
  }

  private async sendJavaScriptGPSData(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): Promise<void> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
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

      console.log(`📍 Sending GPS data for course ${courseId}:`, gpsData);
      
      const { sendGPSData } = await import('../services/api');
      await sendGPSData(gpsData, token);
      
      console.log(`✓ GPS data sent successfully for course ${courseId} with UIT ${uit}`);
      
    } catch (error) {
      console.error(`✗ Failed to send GPS data for course ${courseId}:`, error);
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
        // Browser mode - no background tracking to stop
        this.activeCourses.delete(courseId);
        console.log(`Course ${courseId} removed from tracking list`);
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