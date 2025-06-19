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
    console.log(`Stopping GPS tracking for course ${courseId}`);
    
    const courseData = this.activeCourses.get(courseId);
    if (courseData) {
      // Send final status update
      if (this.lastPosition) {
        await this.sendGPSData(courseData, 4); // Status 4 = stopped
      }
      
      this.activeCourses.delete(courseId);
    }
    
    // Stop location watching if no active courses
    if (this.activeCourses.size === 0) {
      this.stopLocationWatch();
      this.stopTransmissionTimer();
    }
  }

  private async requestPermissions(): Promise<void> {
    try {
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted') {
        throw new Error('Permisiunile de localizare sunt necesare pentru urmărirea GPS');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      throw new Error('Nu s-au putut obține permisiunile de localizare');
    }
  }

  private async startLocationWatch(): Promise<void> {
    try {
      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 10000
        },
        (position) => {
          if (position) {
            this.lastPosition = position;
            console.log('GPS position updated:', position.coords.latitude, position.coords.longitude);
          }
        }
      );
    } catch (error) {
      console.error('Failed to start location watch:', error);
    }
  }

  private stopLocationWatch(): void {
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }

  private startTransmissionTimer(): void {
    console.log('Starting GPS transmission timer (60 seconds interval)');
    
    this.transmissionInterval = setInterval(async () => {
      if (this.lastPosition && this.activeCourses.size > 0) {
        console.log(`Transmitting GPS data for ${this.activeCourses.size} active courses`);
        
        // Send GPS data for each active course
        for (const [courseId, courseData] of this.activeCourses) {
          await this.sendGPSData(courseData, courseData.status);
        }
      }
    }, 60000); // 60 seconds
  }

  private stopTransmissionTimer(): void {
    if (this.transmissionInterval) {
      clearInterval(this.transmissionInterval);
      this.transmissionInterval = null;
    }
  }

  private async sendGPSData(courseData: ActiveCourse, status: number): Promise<void> {
    if (!this.lastPosition) return;

    try {
      const batteryLevel = await this.getBatteryLevel();
      
      const gpsData = {
        lat: this.lastPosition.coords.latitude,
        lng: this.lastPosition.coords.longitude,
        timestamp: new Date().toISOString(),
        viteza: this.lastPosition.coords.speed || 0,
        directie: this.lastPosition.coords.heading || 0,
        altitudine: this.lastPosition.coords.altitude || 0,
        baterie: batteryLevel,
        numar_inmatriculare: courseData.vehicleNumber,
        uit: courseData.uit,
        status: status.toString(),
        hdop: this.lastPosition.coords.accuracy?.toString() || '0',
        gsm_signal: '75' // Default GSM signal strength
      };

      const success = await sendGPSData(gpsData, courseData.token);
      
      if (success) {
        console.log(`GPS data sent successfully for UIT: ${courseData.uit}`);
      } else {
        console.error(`Failed to send GPS data for UIT: ${courseData.uit}`);
      }
    } catch (error) {
      console.error('Error sending GPS data:', error);
    }
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      const info = await Device.getBatteryInfo();
      return Math.round((info.batteryLevel || 0) * 100);
    } catch (error) {
      console.error('Failed to get battery level:', error);
      return 85; // Default battery level
    }
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses.keys());
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }

  async isTrackingActive(): Promise<boolean> {
    return this.activeCourses.size > 0 && this.watchId !== null;
  }
}

// Create singleton instance
const gpsService = new RealGPSService();

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