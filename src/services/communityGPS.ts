import { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { registerPlugin } from '@capacitor/core';
import { sendGPSData, type GPSData } from "./api";
import { Device } from '@capacitor/device';
import { Geolocation } from '@capacitor/geolocation';

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
      // Request GPS permissions first
      const hasPermissions = await this.requestLocationPermissions();
      if (!hasPermissions) {
        throw new Error('Location permissions denied');
      }

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

  private async requestLocationPermissions(): Promise<boolean> {
    try {
      console.log('Requesting location permissions...');
      
      // Request basic location permission first
      const permission = await Geolocation.requestPermissions();
      console.log('Basic location permission:', permission);
      
      if (permission.location !== 'granted') {
        alert('Pentru urmărirea GPS, aplicația necesită acces la locație. Vă rugăm să acordați permisiunea în setări.');
        return false;
      }

      // For Android, we need to request background location permission separately
      if ((window as any).DeviceInfo?.platform === 'android') {
        // Show user instruction for background permission
        const userConsent = confirm(`Pentru urmărirea GPS în background (când aplicația este minimizată), este necesar să acordați permisiunea "Allow all the time" pentru locație.

Doriți să continuați? Veți fi redirecționat către setările de permisiuni.`);
        
        if (userConsent) {
          // This will prompt Android's background location permission dialog
          try {
            await BackgroundGeolocation.requestPermissions();
            console.log('Background location permission requested');
          } catch (error) {
            console.log('Background permission request failed, continuing with foreground only');
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
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
      console.log('Status-based GPS tracking active - coordinates sent only on course status changes');
      
      // Set watchId to indicate tracking is "active" but no continuous watching
      this.watchId = 'status-based-tracking';
      
      console.log('GPS background watch configured for status-only tracking');
    } catch (error) {
      console.error('Failed to configure GPS tracking:', error);
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