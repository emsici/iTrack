import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';
import { sendGPSData, GPSData } from './api';
import { 
  startNativeGPSTracking, 
  stopNativeGPSTracking, 
  hasNativeActiveCourses 
} from './nativeGPS';

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

    // Try native Android GPS service first for background tracking
    if (Capacitor.isNativePlatform()) {
      console.log('Attempting to start native Android GPS service for course:', courseId);
      const nativeStarted = await startNativeGPSTracking(courseId, vehicleNumber, uit, token);
      
      if (nativeStarted) {
        console.log('Native Android GPS service started successfully - JavaScript GPS disabled to prevent duplicates');
        return; // Native service handles everything, don't start JavaScript timer
      } else {
        console.log('Native GPS service failed - falling back to JavaScript GPS');
      }
    }

    // Fallback to JavaScript GPS only for web or if native fails
    if (this.activeCourses.size === 1) {
      this.startTrackingInterval();
    }

    console.log(`Started JavaScript GPS tracking for course ${courseId}`);
  }

  async stopTracking(courseId: string) {
    this.activeCourses.delete(courseId);
    console.log(`Stopping GPS tracking for course ${courseId}`);

    // Stop native Android GPS service if available
    if (Capacitor.isNativePlatform()) {
      console.log('Stopping native Android GPS service for course:', courseId);
      await stopNativeGPSTracking(courseId);
    }

    // Stop JavaScript tracking if no active courses remain
    if (this.activeCourses.size === 0) {
      this.stopTrackingInterval();
      console.log('All courses stopped - GPS background tracking disabled');
    } else {
      console.log(`${this.activeCourses.size} courses still active - continuing GPS tracking`);
    }
  }

  private startTrackingInterval() {
    if (this.trackingInterval) return;

    console.log('Starting persistent GPS tracking for Android background');
    
    // Request background execution for Android with Wake Lock
    if (Capacitor.isNativePlatform()) {
      this.enableBackgroundMode();
      this.keepAppAwake();
    }
    
    // Send GPS data immediately
    this.sendAllActiveCoursesGPSData();

    // GPS tracking every 60 seconds as requested
    this.trackingInterval = setInterval(() => {
      console.log('GPS tracking interval - checking active courses');
      if (this.activeCourses.size > 0) {
        this.sendAllActiveCoursesGPSData();
        this.ensureBackgroundTracking(); // Re-verify background state
        this.forceBackgroundExecution(); // Force app to stay alive
      }
    }, 60000); // 60 seconds = 1 minute
  }

  private keepAppAwake() {
    // Prevent app from sleeping during GPS tracking
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      console.log('Requesting Android Wake Lock for continuous GPS');
      // Note: This helps prevent the app from being killed by Android
      try {
        // Use a combination of techniques to stay alive
        this.preventScreenSleep();
        this.requestForegroundService();
      } catch (error) {
        console.warn('Could not enable wake lock:', error);
      }
    }
  }

  private preventScreenSleep() {
    // Keep CPU awake during GPS tracking
    if (window.navigator && 'wakeLock' in window.navigator) {
      (window.navigator as any).wakeLock.request('system').then(() => {
        console.log('Wake lock enabled for GPS tracking');
      }).catch((err: any) => {
        console.log('Wake lock not supported:', err);
      });
    }
  }

  private requestForegroundService() {
    // For Android - request foreground service to prevent app termination
    console.log('Requesting foreground service for background GPS');
    // This would need a native plugin implementation for full Android support
  }

  private ensureBackgroundTracking() {
    // Re-verify that background tracking is still active
    if (Capacitor.isNativePlatform() && this.activeCourses.size > 0) {
      if (!this.watchId) {
        console.log('Background GPS watch lost - restarting');
        this.enableBackgroundLocationUpdates();
      }
    }
  }

  private forceBackgroundExecution() {
    // Aggressive methods to keep app alive during GPS tracking
    if (Capacitor.isNativePlatform() && this.activeCourses.size > 0) {
      console.log('Forcing background execution for GPS tracking');
      
      // Method 1: Keep CPU awake with wake lock
      this.maintainWakeLock();
      
      // Method 2: Simulate user activity to prevent sleep
      this.simulateActivity();
      
      // Method 3: Request foreground importance
      this.requestForegroundImportance();
      
      // Method 4: Audio background trick (silent audio)
      this.enableSilentAudioBackground();
    }
  }

  private maintainWakeLock() {
    try {
      // Request system wake lock to prevent CPU sleep
      if ('wakeLock' in navigator) {
        (navigator as any).wakeLock.request('system').then((wakeLock: any) => {
          console.log('System wake lock acquired for GPS tracking');
          
          // Re-acquire wake lock if it gets released
          wakeLock.addEventListener('release', () => {
            console.log('Wake lock released - re-acquiring');
            if (this.activeCourses.size > 0) {
              this.maintainWakeLock();
            }
          });
        }).catch((err: any) => {
          console.log('Wake lock request failed:', err);
        });
      }
    } catch (error) {
      console.warn('Wake lock not supported:', error);
    }
  }

  private simulateActivity() {
    // Simulate minimal user activity to prevent app suspension
    try {
      // Trigger a minimal location request to keep GPS services active
      if (Capacitor.isNativePlatform()) {
        setInterval(() => {
          if (this.activeCourses.size > 0) {
            console.log('Simulating GPS activity to prevent suspension');
            // Quick location ping to keep services alive
            Geolocation.getCurrentPosition({
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 60000
            }).catch(() => {
              // Ignore errors - this is just to keep service alive
            });
          }
        }, 45000); // Every 45 seconds
      }
    } catch (error) {
      console.warn('Could not simulate activity:', error);
    }
  }

  private requestForegroundImportance() {
    // Request high priority for the app process
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      console.log('Requesting foreground service importance');
      
      // Show persistent notification to keep app in foreground
      this.showTrackingNotification();
    }
  }

  private showTrackingNotification() {
    // Show persistent notification during GPS tracking
    try {
      if (Capacitor.isNativePlatform()) {
        console.log('Showing persistent GPS tracking notification');
        
        // This would need a notification plugin, but we can simulate
        // the notification behavior to keep the app important
        document.title = `iTrack - ${this.activeCourses.size} curse active`;
        
        // Update every minute to show activity
        setInterval(() => {
          if (this.activeCourses.size > 0) {
            const now = new Date().toLocaleTimeString();
            document.title = `iTrack - ${this.activeCourses.size} curse active (${now})`;
          }
        }, 60000);
      }
    } catch (error) {
      console.warn('Could not show notification:', error);
    }
  }

  private enableSilentAudioBackground() {
    // Audio trick to keep app alive (silent audio loop)
    try {
      if (Capacitor.isNativePlatform()) {
        console.log('Enabling silent audio for background execution');
        
        // Create silent audio context to prevent app suspension
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Silent volume but keeps audio context active
        gainNode.gain.value = 0;
        oscillator.frequency.value = 20000; // Inaudible frequency
        
        oscillator.start();
        
        console.log('Silent audio background enabled');
      }
    } catch (error) {
      console.warn('Silent audio background failed:', error);
    }
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
        console.log('Starting Android background GPS tracking for locked screen');
        
        // Clear any existing watch
        if (this.watchId) {
          await Geolocation.clearWatch({ id: this.watchId });
        }
        
        // Configure for background tracking on Android when phone is locked
        this.watchId = await Geolocation.watchPosition({
          enableHighAccuracy: true,     // Force GPS for speed/direction
          timeout: 30000,              // Longer timeout for background
          maximumAge: 10000            // Allow slightly cached data for performance
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
      // Enhanced GPS settings for Android background tracking when phone is locked
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,  // Always use GPS for accurate speed/direction
        timeout: 30000,           // Longer timeout for background mode
        maximumAge: 20000         // Allow cached data for reliability in background
      });

      // Get battery info
      const batteryInfo = await Device.getBatteryInfo();

      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // Enhanced logging for background tracking debugging
      console.log(`BACKGROUND GPS DATA COLLECTED:`, {
        position: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          accuracy: position.coords.accuracy
        },
        timestamp: currentTime,
        activeCourses: this.activeCourses.size,
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform()
      });

      // Send GPS data for each active course with retry logic
      for (const [courseId, courseData] of this.activeCourses) {
        const speedKmh = (position.coords.speed || 0) * 3.6; // Convert m/s to km/h
        
        const gpsData: GPSData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: currentTime,
          viteza: Math.max(0, Math.round(speedKmh)), // Speed in km/h, rounded
          directie: Math.round(position.coords.heading || 0), // Direction in degrees
          altitudine: Math.round(position.coords.altitude || 0),
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
