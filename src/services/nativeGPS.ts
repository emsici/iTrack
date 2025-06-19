// Native GPS tracking service for Android APK
// Connects directly to GPSTrackingPlugin and EnhancedGPSService

declare global {
  interface Window {
    GPSTracking: GPSTrackingInterface;
  }
}

interface GPSTrackingInterface {
  startGPSTracking(options: {
    vehicleNumber: string;
    courseId: string;
    uit: string;
    authToken: string;
    status?: number;
  }): Promise<{ success: boolean; message: string }>;
  
  stopGPSTracking(options: {
    courseId: string;
  }): Promise<{ success: boolean; message: string }>;
  
  isGPSTrackingActive(): Promise<{ isActive: boolean }>;
}

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
}

// GPS service that connects to native Android EnhancedGPSService
class NativeGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    console.log(`Starting GPS tracking for course ${courseId}, UIT: ${uit}`);
    
    // Store course data
    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token,
      status
    };
    
    this.activeCourses.set(courseId, courseData);
    
    // Detailed plugin diagnostics for APK debugging
    console.log(`Plugin Diagnostics:`);
    console.log(`- Window object exists: ${typeof window !== 'undefined'}`);
    console.log(`- GPSTracking plugin available: ${!!(window as any)?.GPSTracking}`);
    console.log(`- Plugin methods: ${Object.keys((window as any)?.GPSTracking || {})}`);
    console.log(`- User agent: ${navigator.userAgent}`);
    console.log(`- Platform: ${(window as any)?.Capacitor?.platform || 'unknown'}`);
    
    // Connect to native Android GPS plugin
    if (typeof window !== 'undefined' && (window as any).GPSTracking) {
      try {
        console.log(`Calling native GPS plugin with parameters:`);
        console.log(`- Vehicle: ${vehicleNumber}`);
        console.log(`- Course: ${courseId}`);
        console.log(`- UIT: ${uit}`);
        console.log(`- Status: ${status}`);
        
        const result = await (window as any).GPSTracking.startGPSTracking({
          vehicleNumber,
          courseId,
          uit,
          authToken: token,
          status
        });
        
        console.log(`Native GPS plugin response:`, result);
        
        if (result && result.success) {
          console.log(`GPS tracking started successfully for UIT: ${uit}`);
          console.log(`EnhancedGPSService will transmit coordinates every 60 seconds`);
        } else {
          console.error(`GPS tracking setup failed: ${result?.message || 'Unknown error'}`);
          console.error(`Full response:`, result);
        }
      } catch (nativeError: any) {
        console.error('GPS plugin error:', nativeError);
        console.error('Error details:', {
          name: nativeError?.name,
          message: nativeError?.message,
          stack: nativeError?.stack
        });
      }
    } else {
      console.warn('GPS plugin not available - diagnostics:');
      console.warn(`- Window: ${typeof window}`);
      console.warn(`- GPSTracking: ${typeof (window as any)?.GPSTracking}`);
      console.warn(`- Available plugins: ${Object.keys((window as any)?.Capacitor?.Plugins || {})}`);
      console.log(`Course ${courseId} with UIT ${uit} marked as active (web mode)`);
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`Stopping GPS tracking for course ${courseId}`);
    
    const courseData = this.activeCourses.get(courseId);
    if (!courseData) {
      console.warn(`No active course found with ID: ${courseId}`);
      return;
    }
    
    // Remove from active courses
    this.activeCourses.delete(courseId);
    
    // Stop native GPS tracking
    if (typeof window !== 'undefined' && window.GPSTracking) {
      try {
        const result = await window.GPSTracking.stopGPSTracking({
          courseId
        });
        
        if (result && result.success) {
          console.log(`GPS tracking stopped successfully for course ${courseId}`);
        } else {
          console.warn(`GPS tracking stop failed: ${result?.message || 'Unknown error'}`);
        }
      } catch (nativeError) {
        console.warn('GPS plugin stop error:', nativeError);
      }
    } else {
      console.log(`Course ${courseId} removed from active tracking`);
    }
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses.keys());
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }

  async isTrackingActive(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.GPSTracking) {
      try {
        const result = await window.GPSTracking.isGPSTrackingActive();
        return result.isActive;
      } catch (error) {
        console.warn('Error checking GPS tracking status:', error);
        return false;
      }
    }
    return this.hasActiveCourses();
  }
}

// Create single instance
const nativeGPSService = new NativeGPSService();

// Export convenience functions
export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string, status: number = 2) => 
  nativeGPSService.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) => 
  nativeGPSService.stopTracking(courseId);

export const getActiveCourses = () => 
  nativeGPSService.getActiveCourses();

export const hasActiveCourses = () => 
  nativeGPSService.hasActiveCourses();

export const isGPSTrackingActive = () => 
  nativeGPSService.isTrackingActive();

export default nativeGPSService;