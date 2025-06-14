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
        distanceFilter: 0, // Track any movement
        locationUpdateInterval: 60000, // 1 minute
        fastestLocationUpdateInterval: 30000, // Fallback 30 seconds
        
        // Activity Recognition - aggressive settings for continuous tracking
        stopTimeout: 1, // Quick transition to stationary
        activityRecognitionInterval: 30000,
        
        // Application config - ensure background operation
        debug: true, // Enable for troubleshooting
        logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
        stopOnTerminate: false,   // CRITICAL: Continue when app terminates
        startOnBoot: true,        // CRITICAL: Auto-start after reboot
        
        // Background modes - force all background capabilities
        enableHeadless: true,     // CRITICAL: Background operation
        foregroundService: true,  // CRITICAL: Android foreground service
        
        // Android-specific background settings
        allowIdenticalLocations: true,
        
        // Notification to prevent Android from killing service
        notification: {
          title: "iTrack GPS Active",
          text: "Vehicle tracking - do not disable",
          color: "red",
          channelName: "GPS Tracking",
          priority: BackgroundGeolocation.NOTIFICATION_PRIORITY_HIGH,
          sticky: true // Persistent notification
        },
        
        // Disable HTTP auto-sync - we handle it manually
        url: undefined,
        autoSync: false,
        batchSync: false,
        
        // Location authorization
        locationAuthorizationRequest: 'Always'
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
    console.log('Starting background GPS tracking...');
    
    await this.initialize();

    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token
    };

    this.activeCourses.set(courseId, courseData);

    try {
      // Request location permissions first
      console.log('Requesting location permissions...');
      const authorizationStatus = await BackgroundGeolocation.requestPermission();
      console.log('Permission status:', authorizationStatus);

      // Check if we have the required permissions
      if (authorizationStatus === BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS || 
          authorizationStatus === BackgroundGeolocation.AUTHORIZATION_STATUS_WHEN_IN_USE) {
        
        console.log('Location permissions granted');
        
        // Start background geolocation
        console.log('Starting background location service...');
        await BackgroundGeolocation.start();
        
        // Get current state to verify it started
        const state = await BackgroundGeolocation.getState();
        console.log('Background GPS state:', state);
        
        if (state.enabled) {
          console.log(`Background GPS tracking ACTIVE for course: ${courseId}`);
          console.log(`Vehicle: ${vehicleNumber}, UIT: ${uit}`);
          return true;
        } else {
          console.error('Background GPS failed to start - service not enabled');
          this.activeCourses.delete(courseId);
          return false;
        }
        
      } else {
        console.error('Location permissions denied:', authorizationStatus);
        this.activeCourses.delete(courseId);
        return false;
      }
      
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