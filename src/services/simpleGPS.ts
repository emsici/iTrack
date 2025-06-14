import { Geolocation } from '@capacitor/geolocation';
import { sendGPSData, type GPSData } from "./api";

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
}

class SimpleGPSTracker {
  private activeCourses: Map<string, ActiveCourse> = new Map();
  private trackingInterval: NodeJS.Timeout | null = null;
  private lastPosition: { lat: number; lng: number } | null = null;

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string) {
    console.log('Starting simple GPS tracking for course:', courseId);
    
    try {
      // Request permissions
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location !== 'granted') {
        console.error('Location permissions denied');
        return false;
      }

      const courseData: ActiveCourse = {
        courseId,
        vehicleNumber,
        uit,
        token
      };

      this.activeCourses.set(courseId, courseData);
      console.log('Course added to tracking:', { courseId, vehicleNumber, uit });

      // Start interval tracking if not already running
      if (!this.trackingInterval) {
        this.startTrackingInterval();
      }

      return true;
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      return false;
    }
  }

  async stopTracking(courseId: string) {
    console.log('Stopping GPS tracking for course:', courseId);
    this.activeCourses.delete(courseId);

    // Stop interval if no active courses
    if (this.activeCourses.size === 0 && this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      console.log('GPS tracking stopped - no active courses');
    }

    return true;
  }

  private startTrackingInterval() {
    console.log('Starting GPS tracking interval (every 60 seconds)');
    
    this.trackingInterval = setInterval(async () => {
      if (this.activeCourses.size === 0) return;
      
      try {
        console.log('Getting current GPS position...');
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        });

        console.log('GPS position obtained:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed
        });

        // Send GPS data for all active courses
        for (const [courseId, courseData] of this.activeCourses) {
          await this.sendGPSDataForCourse(position.coords, courseData);
        }

        this.lastPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

      } catch (error) {
        console.error('Error getting GPS position:', error);
      }
    }, 60000); // Every 60 seconds
  }

  private async sendGPSDataForCourse(coords: any, courseData: ActiveCourse) {
    try {
      // Calculate direction if we have previous position
      let direction = 0;
      if (this.lastPosition) {
        direction = this.calculateBearing(
          this.lastPosition.lat,
          this.lastPosition.lng,
          coords.latitude,
          coords.longitude
        );
      }

      const gpsData: GPSData = {
        lat: coords.latitude,
        lng: coords.longitude,
        timestamp: new Date().toISOString(),
        viteza: coords.speed ? Math.round(coords.speed * 3.6) : 0, // Convert m/s to km/h
        directie: Math.round(direction),
        altitudine: coords.altitude || 0,
        baterie: await this.getBatteryLevel(),
        numar_inmatriculare: courseData.vehicleNumber,
        uit: courseData.uit,
        status: "active",
        hdop: coords.accuracy?.toString() || "0",
        gsm_signal: "100"
      };

      console.log('Sending GPS data:', {
        courseId: courseData.courseId,
        uit: courseData.uit,
        lat: gpsData.lat,
        lng: gpsData.lng
      });

      const success = await sendGPSData(gpsData, courseData.token);
      
      if (success) {
        console.log(`✅ GPS data sent for course: ${courseData.courseId}`);
      } else {
        console.error(`❌ Failed to send GPS data for course: ${courseData.courseId}`);
      }
    } catch (error) {
      console.error(`Error sending GPS data for course ${courseData.courseId}:`, error);
    }
  }

  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = Math.atan2(y, x);
    
    // Convert to degrees and normalize to 0-360
    return (bearing * 180 / Math.PI + 360) % 360;
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      const { Device } = await import('@capacitor/device');
      const batteryInfo = await Device.getBatteryInfo();
      return Math.round((batteryInfo.batteryLevel || 0) * 100);
    } catch (error) {
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

const simpleGPSTracker = new SimpleGPSTracker();

export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string) => 
  simpleGPSTracker.startTracking(courseId, vehicleNumber, uit, token);
export const stopGPSTracking = (courseId: string) => 
  simpleGPSTracker.stopTracking(courseId);
export const getActiveCourses = () => 
  simpleGPSTracker.getActiveCourses();
export const hasActiveCourses = () => 
  simpleGPSTracker.hasActiveCourses();