import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';
import { sendGPSData, GPSData } from './api';

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
}

class GPSTracker {
  private activeCourses: Map<string, ActiveCourse> = new Map();
  private trackingInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Check if we're in a native environment
      if (Capacitor.isNativePlatform()) {
        // Request permissions for location access on native platforms
        const permissions = await Geolocation.requestPermissions();
        console.log('Location permissions:', permissions);
      } else {
        // For web environment, check if geolocation is available
        if (!navigator.geolocation) {
          console.warn('Geolocation not supported in this browser');
          return;
        }
        console.log('GPS Tracker running in web environment');
      }
      
      this.isInitialized = true;
      console.log('GPS Tracker initialized');
    } catch (error) {
      console.error('Error initializing GPS Tracker:', error);
      // Don't throw error in web environment
      if (Capacitor.isNativePlatform()) {
        throw error;
      }
    }
  }

  async startTracking(courseId: string, vehicleNumber: string, token: string) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const uit = `UIT${Math.random().toString(36).substr(2, 5)}`;
    
    this.activeCourses.set(courseId, {
      courseId,
      vehicleNumber,
      uit,
      token
    });

    // Start tracking if this is the first active course
    if (this.activeCourses.size === 1) {
      this.startTrackingInterval();
    }

    console.log(`Started GPS tracking for course ${courseId}`);
  }

  async stopTracking(courseId: string) {
    this.activeCourses.delete(courseId);

    // Stop tracking if no active courses remain
    if (this.activeCourses.size === 0) {
      this.stopTrackingInterval();
    }

    console.log(`Stopped GPS tracking for course ${courseId}`);
  }

  private startTrackingInterval() {
    if (this.trackingInterval) return;

    console.log('Starting GPS tracking interval');
    
    // Send GPS data immediately
    this.sendAllActiveCoursesGPSData();

    // Then send every minute
    this.trackingInterval = setInterval(() => {
      this.sendAllActiveCoursesGPSData();
    }, 60000); // 60 seconds
  }

  private stopTrackingInterval() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      console.log('Stopped GPS tracking interval');
    }
  }

  private async sendAllActiveCoursesGPSData() {
    if (this.activeCourses.size === 0) return;

    try {
      // Get current position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      // Get battery info
      const batteryInfo = await Device.getBatteryInfo();

      // Send GPS data for each active course
      for (const [courseId, courseData] of this.activeCourses) {
        const gpsData: GPSData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
          viteza: position.coords.speed || 0,
          directie: position.coords.heading || 0,
          altitudine: position.coords.altitude || 0,
          baterie: Math.round((batteryInfo.batteryLevel || 0) * 100),
          numar_inmatriculare: courseData.vehicleNumber,
          uit: courseData.uit,
          status: '2', // Active status
          hdop: position.coords.accuracy?.toString() || '0',
          gsm_signal: '100' // Assume good signal for mobile app
        };

        const success = await sendGPSData(gpsData, courseData.token);
        console.log(`GPS data sent for course ${courseId}:`, success ? 'SUCCESS' : 'FAILED');
      }
    } catch (error) {
      console.error('Error getting position or sending GPS data:', error);
    }
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses.keys());
  }
}

// Create singleton instance
const gpsTracker = new GPSTracker();

// Export functions
export const initializeGPS = () => gpsTracker.initialize();
export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string) => 
  gpsTracker.startTracking(courseId, vehicleNumber, token);
export const stopGPSTracking = (courseId: string) => gpsTracker.stopTracking(courseId);
export const getActiveCourses = () => gpsTracker.getActiveCourses();
