import BackgroundGeolocation from '@transistorsoft/capacitor-background-geolocation';
import { sendGPSData } from './api';

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
}

class BackgroundGPSTracker {
  private activeCourses: Map<string, ActiveCourse> = new Map();
  private isConfigured = false;

  async initialize() {
    if (this.isConfigured) return;

    try {
      // Configure background geolocation
      await BackgroundGeolocation.ready({
        // Geolocation Config
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: 10,
        locationUpdateInterval: 60000, // 1 minute
        fastestLocationUpdateInterval: 30000,
        
        // Activity Recognition
        stopTimeout: 1,
        
        // Application config
        debug: false, // Disable debug sounds in production
        logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
        stopOnTerminate: false,   // Continue tracking when app terminates
        startOnBoot: true,        // Start tracking after device reboot
        
        // HTTP / Persistence config
        url: 'https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php',
        batchSync: false,       // Send immediately
        autoSync: true,         // Auto send to server
        
        // Android specific
        enableHeadless: true,   // Continue in background
        foregroundService: true,
        notification: {
          title: "iTrack GPS Active",
          text: "Vehicle tracking in progress"
        }
      });

      // Location event listener
      BackgroundGeolocation.onLocation(this.onLocationReceived.bind(this), this.onLocationError.bind(this));
      
      // Motion activity events
      BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this));
      
      this.isConfigured = true;
      console.log('Background GPS initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize background GPS:', error);
      throw error;
    }
  }

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string) {
    await this.initialize();

    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token
    };

    this.activeCourses.set(courseId, courseData);

    try {
      // Update HTTP config with auth token
      await BackgroundGeolocation.setConfig({
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          vehicleNumber,
          courseId,
          uit
        }
      });

      // Start background geolocation
      await BackgroundGeolocation.start();
      
      console.log(`Background GPS tracking started for course: ${courseId}`);
      return true;
      
    } catch (error) {
      console.error('Failed to start background GPS tracking:', error);
      this.activeCourses.delete(courseId);
      return false;
    }
  }

  async stopTracking(courseId: string) {
    this.activeCourses.delete(courseId);

    // If no active courses, stop tracking
    if (this.activeCourses.size === 0) {
      try {
        await BackgroundGeolocation.stop();
        console.log('Background GPS tracking stopped');
      } catch (error) {
        console.error('Failed to stop background GPS tracking:', error);
      }
    }
  }

  private async onLocationReceived(location: any) {
    console.log('Background location received:', location);

    // Send location for all active courses
    for (const [courseId, courseData] of this.activeCourses) {
      try {
        const gpsData = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          timestamp: new Date(location.timestamp).toISOString().slice(0, 19).replace('T', ' '),
          viteza: Math.round((location.coords.speed || 0) * 3.6), // m/s to km/h
          directie: Math.round(location.coords.heading || 0),
          altitudine: Math.round(location.coords.altitude || 0),
          baterie: Math.round((location.battery?.level || 1) * 100),
          numar_inmatriculare: courseData.vehicleNumber,
          uit: courseData.uit,
          status: "2", // Active status
          hdop: String(Math.round(location.coords.accuracy || 0)),
          gsm_signal: "75" // Default signal strength
        };

        const success = await sendGPSData(gpsData, courseData.token);
        if (success) {
          console.log(`GPS data sent successfully for course: ${courseId}`);
        } else {
          console.error(`Failed to send GPS data for course: ${courseId}`);
        }
        
      } catch (error) {
        console.error(`Error sending GPS data for course ${courseId}:`, error);
      }
    }
  }

  private onLocationError(error: any) {
    console.error('Background GPS error:', error);
  }

  private onMotionChange(event: any) {
    console.log('Motion change detected:', event.isMoving ? 'moving' : 'stationary');
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses.keys());
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }
}

// Export singleton instance
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