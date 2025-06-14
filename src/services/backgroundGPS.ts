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

class BackgroundGPSTracker {
  private activeCourses: Map<string, ActiveCourse> = new Map();
  private isInitialized = false;
  private lastPosition: { lat: number; lng: number } | null = null;
  private locationWatchId: string | null = null;

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Initializing @capacitor-community/background-geolocation...');
      
      // Request permissions first
      const { Geolocation } = await import('@capacitor/geolocation');
      const permissions = await Geolocation.requestPermissions();
      console.log('Location permissions:', permissions);

      if (permissions.location !== 'granted') {
        throw new Error('Location permissions denied');
      }

      this.isInitialized = true;
      console.log('Background GPS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize background GPS:', error);
      throw error;
    }
  }

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string) {
    console.log('Starting background GPS tracking for course:', courseId);
    
    try {
      // Initialize if needed
      await this.initialize();
      
      const courseData: ActiveCourse = {
        courseId,
        vehicleNumber,
        uit,
        token
      };

      this.activeCourses.set(courseId, courseData);
      console.log('Course added to active tracking:', { courseId, vehicleNumber, uit });

      // Start location tracking if not already started
      if (!this.locationWatchId) {
        await this.startLocationWatch();
      }

      return true;
    } catch (error) {
      console.error('Failed to start background GPS tracking:', error);
      this.activeCourses.delete(courseId);
      return false;
    }
  }

  async stopTracking(courseId: string) {
    console.log('Stopping GPS tracking for course:', courseId);
    this.activeCourses.delete(courseId);

    // Stop location watching if no active courses
    if (this.activeCourses.size === 0 && this.locationWatchId) {
      await this.stopLocationWatch();
    }

    return true;
  }

  private async startLocationWatch() {
    try {
      console.log('Starting location watch with @capacitor-community/background-geolocation...');
      
      // Add watcher for location updates
      this.locationWatchId = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: "🚚 iTrack urmărește vehiculul în fundal",
          backgroundTitle: "iTrack GPS Activ",
          requestPermissions: true,
          stale: false,
          distanceFilter: 0 // Track any movement
        },
        (location, error) => {
          if (error) {
            console.error('Background GPS error:', error);
            return;
          }

          if (location) {
            this.onLocationReceived(location);
          }
        }
      );

      console.log('Location watch started with ID:', this.locationWatchId);
    } catch (error) {
      console.error('Failed to start location watch:', error);
      throw error;
    }
  }

  private async stopLocationWatch() {
    if (this.locationWatchId) {
      try {
        await BackgroundGeolocation.removeWatcher({ id: this.locationWatchId });
        console.log('Location watch stopped');
        this.locationWatchId = null;
      } catch (error) {
        console.error('Error stopping location watch:', error);
      }
    }
  }

  private async onLocationReceived(location: any) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🟢 [${timestamp}] GPS location received:`, {
      lat: location.latitude,
      lng: location.longitude,
      speed: location.speed,
      accuracy: location.accuracy,
      activeCourses: this.activeCourses.size
    });

    // Send GPS data for all active courses
    for (const [courseId, courseData] of this.activeCourses) {
      console.log(`📤 Sending GPS data for course ${courseId}...`);
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

      console.log('Sending GPS data with UIT:', {
        courseId: courseData.courseId,
        uit: courseData.uit,
        vehicleNumber: courseData.vehicleNumber
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

const backgroundGPSTracker = new BackgroundGPSTracker();

export const initializeBackgroundGPS = () => backgroundGPSTracker.initialize();
export const startBackgroundGPSTracking = (courseId: string, vehicleNumber: string, uit: string, token: string) => 
  backgroundGPSTracker.startTracking(courseId, vehicleNumber, uit, token);
export const stopBackgroundGPSTracking = (courseId: string) => 
  backgroundGPSTracker.stopTracking(courseId);
export const getBackgroundActiveCourses = () => 
  backgroundGPSTracker.getActiveCourses();
export const hasBackgroundActiveCourses = () => 
  backgroundGPSTracker.hasActiveCourses();