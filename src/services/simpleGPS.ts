import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
}

class SimpleGPSTracker {
  private activeCourses: Map<string, ActiveCourse> = new Map();
  private watchId: string | null = null;
  private transmissionInterval: number | null = null;
  private lastPosition: any = null;

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2) {
    console.log(`Starting GPS tracking for course ${courseId}, UIT: ${uit}`);
    
    try {
      // Request permissions first
      await this.requestPermissions();
      
      // Store course data
      const courseData: ActiveCourse = {
        courseId,
        vehicleNumber,
        uit,
        token,
        status
      };
      
      this.activeCourses.set(courseId, courseData);
      
      // Start location watching if not already started
      if (!this.watchId) {
        await this.startLocationWatch();
      }
      
      // Start transmission timer if not already started
      if (!this.transmissionInterval) {
        this.startTransmissionTimer();
      }
      
      console.log(`GPS tracking started for UIT: ${uit}`);
      
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      throw new Error('Nu s-au putut obține permisiunile GPS necesare');
    }
  }

  async stopTracking(courseId: string) {
    console.log(`Stopping GPS tracking for course ${courseId}`);
    
    const courseData = this.activeCourses.get(courseId);
    if (courseData) {
      // Send final status update
      if (this.lastPosition) {
        await this.sendGPSData(courseData, 4); // Status 4 = stopped
      }
      
      this.activeCourses.delete(courseId);
      console.log(`GPS tracking stopped for UIT: ${courseData.uit}`);
    }
    
    // Stop watching if no active courses
    if (this.activeCourses.size === 0) {
      this.stopLocationWatch();
      this.stopTransmissionTimer();
    }
  }

  private async requestPermissions(): Promise<void> {
    try {
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location === 'denied') {
        throw new Error('Permisiunile GPS sunt necesare pentru urmărirea traseului');
      }
      
      console.log('GPS permissions granted');
      
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw new Error('Nu s-au putut obține permisiunile GPS necesare');
    }
  }

  private async startLocationWatch(): Promise<void> {
    try {
      this.watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000
      }, (position, err) => {
        if (err) {
          console.error('GPS position error:', err);
          return;
        }
        
        if (position) {
          this.lastPosition = position;
          console.log(`GPS position updated: ${position.coords.latitude}, ${position.coords.longitude}`);
        }
      });
      
      console.log('GPS location watching started');
      
    } catch (error) {
      console.error('Failed to start location watching:', error);
      throw error;
    }
  }

  private stopLocationWatch(): void {
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
      console.log('GPS location watching stopped');
    }
  }

  private startTransmissionTimer(): void {
    this.transmissionInterval = window.setInterval(async () => {
      if (this.lastPosition && this.activeCourses.size > 0) {
        // Send GPS data for each active course
        for (const courseData of this.activeCourses.values()) {
          try {
            await this.sendGPSData(courseData, courseData.status);
          } catch (error) {
            console.error(`Failed to send GPS data for UIT ${courseData.uit}:`, error);
          }
        }
      } else {
        console.log('No GPS position or active courses for transmission');
      }
    }, 60000); // Every 60 seconds
    
    console.log('GPS transmission timer started');
  }

  private stopTransmissionTimer(): void {
    if (this.transmissionInterval) {
      clearInterval(this.transmissionInterval);
      this.transmissionInterval = null;
      console.log('GPS transmission timer stopped');
    }
  }

  private async sendGPSData(courseData: ActiveCourse, status: number): Promise<void> {
    if (!this.lastPosition) {
      console.warn(`No GPS position available for UIT: ${courseData.uit}`);
      return;
    }

    try {
      const position = this.lastPosition.coords;
      
      const gpsData = {
        lat: position.latitude,
        lng: position.longitude,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        viteza: Math.round((position.speed || 0) * 3.6), // km/h
        directie: Math.round(position.heading || 0),
        altitudine: Math.round(position.altitude || 0),
        baterie: await this.getBatteryLevel(),
        numar_inmatriculare: courseData.vehicleNumber,
        uit: courseData.uit,
        status: status,
        hdop: Math.round(position.accuracy || 0),
        gsm_signal: "85"
      };

      const response = await fetch('https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${courseData.token}`
        },
        body: JSON.stringify(gpsData)
      });

      if (response.ok) {
        console.log(`GPS data sent successfully for UIT: ${courseData.uit}`);
      } else {
        console.warn(`GPS transmission failed with code: ${response.status} for UIT: ${courseData.uit}`);
      }
    } catch (error) {
      console.error(`Error sending GPS data for UIT ${courseData.uit}:`, error);
    }
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      if (Capacitor.isNativePlatform()) {
        // On native platforms, you would use Device plugin to get battery level
        return 100; // Default value for now
      }
      
      // On web, try to use Battery API if available
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
      
      return 100; // Default value
    } catch (error) {
      console.error('Error getting battery level:', error);
      return 100;
    }
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses.keys());
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }
}

// Create singleton instance
const gpsTracker = new SimpleGPSTracker();

// Export functions for use in components
export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string, status: number = 2) => 
  gpsTracker.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) => 
  gpsTracker.stopTracking(courseId);

export const getActiveCourses = () => 
  gpsTracker.getActiveCourses();

export const hasActiveCourses = () => 
  gpsTracker.hasActiveCourses();