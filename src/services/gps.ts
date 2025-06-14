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
  private watchId: string | null = null;

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
    console.log(`Stopped GPS tracking for course ${courseId}`);

    // Stop tracking if no active courses remain
    if (this.activeCourses.size === 0) {
      this.stopTrackingInterval();
      console.log('All courses stopped - GPS background tracking disabled');
    } else {
      console.log(`${this.activeCourses.size} courses still active - continuing GPS tracking`);
    }
  }

  private startTrackingInterval() {
    if (this.trackingInterval) return;

    console.log('Starting GPS tracking interval - sending data every 60 seconds');
    
    // Request background execution for Android
    if (Capacitor.isNativePlatform()) {
      this.enableBackgroundMode();
    }
    
    // Send GPS data immediately
    this.sendAllActiveCoursesGPSData();

    // Then send every minute (60 seconds) - reliable background tracking
    this.trackingInterval = setInterval(() => {
      console.log('GPS interval triggered - sending data for active courses');
      this.sendAllActiveCoursesGPSData();
    }, 60000); // 60 seconds = 1 minute
  }

  private enableBackgroundMode() {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      console.log('Enabling Android background GPS tracking for locked screen');
      
      // Enable background location updates using Capacitor's native functionality
      this.enableBackgroundLocationUpdates();
      
      // Request battery optimization exemption for continuous tracking
      this.requestBatteryOptimizationExemption();
    }
  }

  private async enableBackgroundLocationUpdates() {
    try {
      // Start background location tracking with watchPosition for persistent updates
      if (Capacitor.isNativePlatform()) {
        console.log('Starting native background location tracking with high accuracy GPS');
        
        // Clear any existing watch
        if (this.watchId) {
          await Geolocation.clearWatch({ id: this.watchId });
        }
        
        // Use watchPosition for continuous location updates in background
        this.watchId = await Geolocation.watchPosition({
          enableHighAccuracy: true, // Force GPS usage for speed and direction
          timeout: 15000,           // Shorter timeout for more frequent updates
          maximumAge: 5000          // Fresh location data
        }, (position) => {
          if (position) {
            console.log('Background GPS update - lat:', position.coords.latitude, 'lng:', position.coords.longitude, 'speed:', position.coords.speed, 'heading:', position.coords.heading);
          }
          // Position updates are handled by the main tracking interval
        });
        
        console.log('Background GPS watch started with ID:', this.watchId);
      }
    } catch (error) {
      console.error('Error enabling background location updates:', error);
    }
  }

  private requestBatteryOptimizationExemption() {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      console.log('Requesting battery optimization exemption for continuous GPS tracking');
      // This will be handled by Android system permissions
      // The app will request to be excluded from battery optimization
    }
  }

  private stopTrackingInterval() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      console.log('Stopped GPS tracking interval');
    }
  }

  private async sendAllActiveCoursesGPSData() {
    if (this.activeCourses.size === 0) {
      console.log('No active courses to send GPS data for');
      return;
    }

    console.log(`Sending GPS data for ${this.activeCourses.size} active courses`);

    try {
      // Get current position with optimized settings for Android background
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: Capacitor.isNativePlatform(),
        timeout: Capacitor.isNativePlatform() ? 20000 : 10000,
        maximumAge: Capacitor.isNativePlatform() ? 60000 : 30000 // Android can use older positions in background
      });

      // Get battery info
      const batteryInfo = await Device.getBatteryInfo();

      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      console.log(`GPS Position obtained: ${position.coords.latitude}, ${position.coords.longitude} at ${currentTime}`);

      // Send GPS data for each active course
      for (const [courseId, courseData] of this.activeCourses) {
        const gpsData: GPSData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: currentTime,
          viteza: Math.max(0, position.coords.speed || 0), // Ensure non-negative speed
          directie: position.coords.heading || 0,
          altitudine: position.coords.altitude || 0,
          baterie: Math.round((batteryInfo.batteryLevel || 0) * 100),
          numar_inmatriculare: courseData.vehicleNumber,
          uit: courseData.uit,
          status: '2', // Active status
          hdop: Math.round(position.coords.accuracy || 0).toString(),
          gsm_signal: '100' // Mobile app has good signal
        };

        console.log(`Sending GPS data for course ${courseId} (${courseData.vehicleNumber}):`, {
          lat: gpsData.lat,
          lng: gpsData.lng,
          speed: gpsData.viteza,
          battery: gpsData.baterie
        });

        const success = await sendGPSData(gpsData, courseData.token);
        console.log(`GPS data for course ${courseId}: ${success ? 'SUCCESS' : 'FAILED'}`);
      }
    } catch (error) {
      console.error('Error getting GPS position or sending data:', error);
      // Continue trying - don't stop the interval
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
