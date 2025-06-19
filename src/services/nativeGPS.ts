// Enhanced GPS tracking service that works with native Android service
// Handles multiple concurrent courses with individual UIT transmission

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

// Enhanced GPS service that connects to Android background service
class EnhancedGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    console.log(`Starting Enhanced GPS tracking for course ${courseId}, UIT: ${uit}`);
    
    // Store course data
    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token,
      status
    };
    
    this.activeCourses.set(courseId, courseData);
    
    // Check if we're running on Android with native GPS plugin
    if (typeof window !== 'undefined' && window.GPSTracking) {
      try {
        const result = await window.GPSTracking.startGPSTracking({
          vehicleNumber,
          courseId,
          uit,
          authToken: token,
          status
        });
        
        if (result && result.success) {
          console.log(`Enhanced GPS tracking started successfully for UIT: ${uit}`);
          console.log(`GPS will transmit coordinates every 60 seconds for course ${courseId}`);
        } else {
          console.warn(`GPS tracking setup failed: ${result?.message || 'Unknown error'}`);
        }
      } catch (nativeError) {
        console.warn('Native GPS plugin error:', nativeError);
        console.log('Continuing with course tracking in app state');
      }
    } else {
      console.log('Running in web environment - GPS tracking simulated');
      console.log(`Course ${courseId} with UIT ${uit} marked as active`);
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`Stopping Enhanced GPS tracking for course ${courseId}`);
    
    const courseData = this.activeCourses.get(courseId);
    if (!courseData) {
      console.warn(`No active course found with ID: ${courseId}`);
      return;
    }
    
    // Remove from active courses
    this.activeCourses.delete(courseId);
    
    // Stop native GPS tracking if available
    if (typeof window !== 'undefined' && window.GPSTracking) {
      try {
        const result = await window.GPSTracking.stopGPSTracking({
          courseId
        });
        
        if (result && result.success) {
          console.log(`Enhanced GPS tracking stopped successfully for course ${courseId}`);
        } else {
          console.warn(`GPS tracking stop failed: ${result?.message || 'Unknown error'}`);
        }
      } catch (nativeError) {
        console.warn('Native GPS plugin stop error:', nativeError);
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
const enhancedGPSService = new EnhancedGPSService();

// Export convenience functions
export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string, status: number = 2) => 
  enhancedGPSService.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) => 
  enhancedGPSService.stopTracking(courseId);

export const getActiveCourses = () => 
  enhancedGPSService.getActiveCourses();

export const hasActiveCourses = () => 
  enhancedGPSService.hasActiveCourses();

export const isGPSTrackingActive = () => 
  enhancedGPSService.isTrackingActive();

export default enhancedGPSService;