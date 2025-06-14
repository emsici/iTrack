import { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { registerPlugin } from '@capacitor/core';
import { sendGPSData, type GPSData } from "./api";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
}

class CommunityGPSTracker {
  private activeCourses: Map<string, ActiveCourse> = new Map();
  private watchId: string | null = null;
  private lastPosition: { lat: number; lng: number } | null = null;

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string) {
    console.log('Starting community background GPS tracking for course:', courseId);
    
    try {
      const courseData: ActiveCourse = {
        courseId,
        vehicleNumber,
        uit,
        token
      };

      this.activeCourses.set(courseId, courseData);
      console.log('Course added to community tracking:', { courseId, vehicleNumber, uit });

      // Start background location tracking if not already started
      if (!this.watchId) {
        await this.startBackgroundWatch();
      }

      return true;
    } catch (error) {
      console.error('Failed to start community GPS tracking:', error);
      this.activeCourses.delete(courseId);
      return false;
    }
  }

  async stopTracking(courseId: string) {
    console.log('Stopping community GPS tracking for course:', courseId);
    this.activeCourses.delete(courseId);

    // Stop background tracking if no active courses
    if (this.activeCourses.size === 0 && this.watchId) {
      await this.stopBackgroundWatch();
    }

    return true;
  }

  private async startBackgroundWatch() {
    try {
      console.log('Starting @capacitor-community/background-geolocation watcher...');
      
      this.watchId = await BackgroundGeolocation.addWatcher(
        {
          // Background notification
          backgroundMessage: "🚚 iTrack urmărește vehiculul în fundal",
          backgroundTitle: "iTrack GPS Activ",
          
          // Request permissions
          requestPermissions: true,
          
          // Tracking settings
          stale: false,
          distanceFilter: 0 // Track any movement
        },
        (location, error) => {
          if (error) {
            console.error('Community background GPS error:', error);
            return;
          }

          if (location) {
            this.onLocationReceived(location);
          }
        }
      );

      console.log('Community background GPS watcher started with ID:', this.watchId);
    } catch (error) {
      console.error('Failed to start community background watch:', error);
      throw error;
    }
  }

  private async stopBackgroundWatch() {
    if (this.watchId) {
      try {
        await BackgroundGeolocation.removeWatcher({ id: this.watchId });
        console.log('Community background GPS watcher stopped');
        this.watchId = null;
      } catch (error) {
        console.error('Error stopping community background watch:', error);
      }
    }
  }

  private async onLocationReceived(location: any) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🟢 [${timestamp}] Community GPS location received:`, {
      lat: location.latitude,
      lng: location.longitude,
      speed: location.speed,
      accuracy: location.accuracy,
      activeCourses: this.activeCourses.size
    });

    // Send GPS data for all active courses
    for (const [courseId, courseData] of this.activeCourses) {
      console.log(`📤 Sending community GPS data for course ${courseId}...`);
      await this.sendGPSDataForCourse(location, courseData);
    }

    this.lastPosition = {
      lat: location.latitude,
      lng: location.longitude
    };
  }

  private async sendGPSDataForCourse(location: any, courseData: ActiveCourse) {
    try {
      // Calculate direction if we have previous position
      let direction = 0;
      if (this.lastPosition) {
        direction = this.calculateBearing(
          this.lastPosition.lat,
          this.lastPosition.lng,
          location.latitude,
          location.longitude
        );
      }

      const gpsData: GPSData = {
        lat: location.latitude,
        lng: location.longitude,
        timestamp: new Date().toISOString(),
        viteza: location.speed ? Math.round(location.speed * 3.6) : 0, // Convert m/s to km/h
        directie: Math.round(direction),
        altitudine: location.altitude || 0,
        baterie: await this.getBatteryLevel(),
        numar_inmatriculare: courseData.vehicleNumber,
        uit: courseData.uit,
        status: "active",
        hdop: location.accuracy?.toString() || "0",
        gsm_signal: "100"
      };

      console.log('Sending community GPS data with UIT:', {
        courseId: courseData.courseId,
        uit: courseData.uit,
        vehicleNumber: courseData.vehicleNumber
      });

      const success = await sendGPSData(gpsData, courseData.token);
      
      if (success) {
        console.log(`✅ Community GPS data sent for course: ${courseData.courseId}`);
      } else {
        console.error(`❌ Failed to send community GPS data for course: ${courseData.courseId}`);
      }
    } catch (error) {
      console.error(`Error sending community GPS data for course ${courseData.courseId}:`, error);
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

const communityGPSTracker = new CommunityGPSTracker();

export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string) => 
  communityGPSTracker.startTracking(courseId, vehicleNumber, uit, token);
export const stopGPSTracking = (courseId: string) => 
  communityGPSTracker.stopTracking(courseId);
export const getActiveCourses = () => 
  communityGPSTracker.getActiveCourses();
export const hasActiveCourses = () => 
  communityGPSTracker.hasActiveCourses();