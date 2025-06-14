// Professional background GPS with @transistorsoft/capacitor-background-geolocation
// FREE for DEBUG builds, requires license for RELEASE builds
import BackgroundGeolocation from '@transistorsoft/capacitor-background-geolocation';
import { sendGPSData, type GPSData } from './api';

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
}

class BackgroundGPSTracker {
  private activeCourses: Map<string, ActiveCourse> = new Map();
  private isConfigured = false;
  private lastPosition: { lat: number; lng: number } | null = null;

  async initialize() {
    if (this.isConfigured) return;

    try {
      console.log('Initializing professional background GPS...');
      
      // Configure background geolocation with aggressive settings for continuous tracking
      await BackgroundGeolocation.ready({
        // Geolocation Config
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: 0, // Track any movement
        locationUpdateInterval: 60000, // Every 60 seconds
        fastestLocationUpdateInterval: 30000, // Fallback every 30 seconds
        
        // Use pre-granted permissions from AndroidManifest
        disableLocationAuthorizationAlert: true,
        locationAuthorizationRequest: 'Always',
        
        // Application config - CRITICAL for background operation
        debug: false, // Disable debug sounds
        logLevel: BackgroundGeolocation.LOG_LEVEL_ERROR,
        stopOnTerminate: false,   // CRITICAL: Continue when app terminates
        startOnBoot: true,        // CRITICAL: Auto-start after reboot
        
        // Background modes - force all background capabilities
        enableHeadless: true,     // CRITICAL: Background operation
        foregroundService: true,  // CRITICAL: Android foreground service
        
        // Android-specific settings for robust background operation
        allowIdenticalLocations: true,
        disableElasticity: true, // Disable location smoothing for accuracy
        
        // Disable problematic features that require additional permissions
        enableTimestampMeta: false,
        disableStopDetection: true,
        
        // Persistent notification to prevent service termination
        notification: {
          title: "iTrack GPS Activ",
          text: "Urmărire vehicul în curs",
          color: "red",
          channelName: "GPS Tracking",
          priority: BackgroundGeolocation.NOTIFICATION_PRIORITY_HIGH,
          sticky: true // Cannot be dismissed
        },
        
        // Disable HTTP auto-sync - we handle manually
        url: undefined,
        autoSync: false,
        batchSync: false,
        
        // Location authorization
        locationAuthorizationRequest: 'Always'
      });

      // Location event listener
      BackgroundGeolocation.onLocation(this.onLocationReceived.bind(this), this.onLocationError.bind(this));
      
      // Motion change listener
      BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this));
      
      // Heartbeat listener for stationary periods
      BackgroundGeolocation.onHeartbeat(this.onHeartbeat.bind(this));

      this.isConfigured = true;
      console.log('Professional background GPS initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize background GPS:', error);
      throw error;
    }
  }

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string) {
    console.log('Starting professional background GPS tracking...');
    
    await this.initialize();

    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token
    };

    this.activeCourses.set(courseId, courseData);

    try {
      // Request location permissions
      const authorizationStatus = await BackgroundGeolocation.requestPermission();
      console.log('Location permission status:', authorizationStatus);

      if (authorizationStatus === BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS || 
          authorizationStatus === BackgroundGeolocation.AUTHORIZATION_STATUS_WHEN_IN_USE) {
        
        // Start background geolocation service
        await BackgroundGeolocation.start();
        
        // Verify service started
        const state = await BackgroundGeolocation.getState();
        console.log('Background GPS state:', {
          enabled: state.enabled,
          isMoving: state.isMoving,
          trackingMode: state.trackingMode
        });
        
        if (state.enabled) {
          console.log(`Professional background GPS ACTIVE for course: ${courseId}`);
          console.log(`Vehicle: ${vehicleNumber}, UIT: ${uit}`);
          return true;
        } else {
          console.error('Background GPS service failed to start');
          this.activeCourses.delete(courseId);
          return false;
        }
        
      } else {
        console.error('Location permissions denied');
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

    // Stop service if no active courses
    if (this.activeCourses.size === 0) {
      try {
        await BackgroundGeolocation.stop();
        console.log('Background GPS service stopped');
      } catch (error) {
        console.error('Error stopping background GPS:', error);
      }
    }

    console.log(`Background GPS tracking stopped for course: ${courseId}`);
    return true;
  }

  private async onLocationReceived(location: any) {
    console.log('Background GPS location received:', {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      speed: location.coords.speed,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp
    });

    // Send GPS data for all active courses
    for (const [courseId, courseData] of this.activeCourses) {
      await this.sendGPSDataForCourse(location.coords, courseData);
    }

    this.lastPosition = {
      lat: location.coords.latitude,
      lng: location.coords.longitude
    };
  }

  private onLocationError(error: any) {
    console.error('Background GPS location error:', error);
  }

  private onMotionChange(event: any) {
    console.log('Motion change detected:', {
      isMoving: event.isMoving,
      location: event.location
    });
    
    if (event.location) {
      this.onLocationReceived(event.location);
    }
  }

  private onHeartbeat(event: any) {
    console.log('Background GPS heartbeat:', event);
    
    if (event.location) {
      this.onLocationReceived(event.location);
    }
  }

  private async sendGPSDataForCourse(coordinates: any, courseData: ActiveCourse) {
    try {
      // Calculate direction if we have previous position
      let direction = 0;
      if (this.lastPosition) {
        direction = this.calculateBearing(
          this.lastPosition.lat,
          this.lastPosition.lng,
          coordinates.latitude,
          coordinates.longitude
        );
      }

      const gpsData: GPSData = {
        lat: coordinates.latitude,
        lng: coordinates.longitude,
        timestamp: new Date().toISOString(),
        viteza: coordinates.speed ? Math.round(coordinates.speed * 3.6) : 0, // Convert m/s to km/h
        directie: Math.round(direction),
        altitudine: coordinates.altitude || 0,
        baterie: await this.getBatteryLevel(),
        numar_inmatriculare: courseData.vehicleNumber,
        uit: courseData.uit,
        status: "active",
        hdop: coordinates.accuracy?.toString() || "0",
        gsm_signal: "100" // Default good signal
      };

      const success = await sendGPSData(gpsData, courseData.token);
      
      if (success) {
        console.log(`GPS data sent successfully for course: ${courseData.courseId}`, {
          lat: gpsData.lat,
          lng: gpsData.lng,
          speed: gpsData.viteza,
          direction: gpsData.directie
        });
      } else {
        console.error(`Failed to send GPS data for course: ${courseData.courseId}`);
      }

    } catch (error) {
      console.error('Error sending GPS data:', error);
    }
  }

  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
      return 100; // Default to full battery if not available
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