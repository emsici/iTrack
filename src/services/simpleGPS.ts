// Implementare GPS simplă și directă folosind Capacitor Geolocation standard
import { Geolocation } from '@capacitor/geolocation';
import { sendGPSData, GPSData } from './api';

interface ActiveTracking {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
  intervalId?: number;
}

class SimpleGPSService {
  private activeTrackings: Map<string, ActiveTracking> = new Map();
  private watchId: string | null = null;

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    console.log(`🚀 Starting simple GPS tracking for course ${courseId}, UIT: ${uit}`);
    
    try {
      // Cerere permisiuni GPS
      const permissions = await Geolocation.requestPermissions();
      console.log('📱 GPS permissions:', permissions);
      
      if (permissions.location !== 'granted') {
        throw new Error('GPS permissions not granted');
      }

      // Adaugă tracking-ul activ
      const tracking: ActiveTracking = {
        courseId,
        vehicleNumber,
        uit,
        token,
        status
      };
      
      this.activeTrackings.set(courseId, tracking);
      
      // Pornește transmisia la fiecare 60 secunde
      tracking.intervalId = window.setInterval(async () => {
        await this.transmitGPSForCourse(tracking);
      }, 60000);
      
      // Transmite imediat prima coordonată
      await this.transmitGPSForCourse(tracking);
      
      console.log(`✅ GPS tracking started for UIT: ${uit}`);
      
    } catch (error) {
      console.error(`❌ Failed to start GPS tracking for ${courseId}:`, error);
      throw error;
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`🛑 Stopping GPS tracking for course ${courseId}`);
    
    const tracking = this.activeTrackings.get(courseId);
    if (tracking && tracking.intervalId) {
      clearInterval(tracking.intervalId);
    }
    
    this.activeTrackings.delete(courseId);
    
    if (this.activeTrackings.size === 0 && this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
      console.log('📍 GPS watch cleared');
    }
  }

  private async transmitGPSForCourse(tracking: ActiveTracking): Promise<void> {
    try {
      console.log(`📡 Getting GPS position for UIT: ${tracking.uit}`);
      
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      });
      
      const coords = position.coords;
      const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
      
      const gpsData: GPSData = {
        lat: coords.latitude,
        lng: coords.longitude,
        timestamp: timestamp,
        viteza: Math.round((coords.speed || 0) * 3.6), // m/s to km/h
        directie: Math.round(coords.heading || 0),
        altitudine: Math.round(coords.altitude || 0),
        baterie: await this.getBatteryLevel(),
        numar_inmatriculare: tracking.vehicleNumber,
        uit: tracking.uit,
        status: tracking.status.toString(),
        hdop: Math.round(coords.accuracy || 0).toString(),
        gsm_signal: '75' // Default good signal
      };
      
      console.log(`📤 Transmitting GPS data for UIT ${tracking.uit}:`, {
        lat: gpsData.lat.toFixed(6),
        lng: gpsData.lng.toFixed(6),
        speed: gpsData.viteza,
        accuracy: gpsData.hdop
      });
      
      const success = await sendGPSData(gpsData, tracking.token);
      
      if (success) {
        console.log(`✅ GPS data transmitted successfully for UIT: ${tracking.uit}`);
      } else {
        console.error(`❌ Failed to transmit GPS data for UIT: ${tracking.uit}`);
      }
      
    } catch (error) {
      console.error(`💥 Error getting/transmitting GPS for UIT ${tracking.uit}:`, error);
    }
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      // Fallback pentru nivel baterie
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
    } catch (error) {
      console.warn('Cannot get battery level:', error);
    }
    return 100; // Default fallback
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeTrackings.keys());
  }

  hasActiveCourses(): boolean {
    return this.activeTrackings.size > 0;
  }

  async isTrackingActive(): Promise<boolean> {
    return this.activeTrackings.size > 0;
  }
}

const simpleGPSService = new SimpleGPSService();

// Export functions pentru uz în CourseCard
export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string, status: number = 2) => 
  simpleGPSService.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) => 
  simpleGPSService.stopTracking(courseId);

export const getActiveCourses = () => 
  simpleGPSService.getActiveCourses();

export const hasActiveCourses = () => 
  simpleGPSService.hasActiveCourses();

export const isGPSTrackingActive = () => 
  simpleGPSService.isTrackingActive();