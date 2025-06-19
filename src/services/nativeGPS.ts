// Simple GPS tracking service for reliable Android GPS transmission
// Connects to SimpleGPSService for background coordinate transmission

declare global {
  interface Window {
    SimpleGPS: SimpleGPSInterface;
  }
}

interface SimpleGPSInterface {
  startTracking(options: {
    vehicleNumber: string;
    courseId: string;
    uit: string;
    authToken: string;
    status?: number;
  }): Promise<{ success: boolean; message: string }>;
  
  stopTracking(options: {
    courseId: string;
  }): Promise<{ success: boolean; message: string }>;
  
  isActive(): Promise<{ isActive: boolean }>;
}

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
}

// Simple GPS service for reliable Android GPS tracking
class SimpleGPSTracker {
  private activeCourses: Map<string, ActiveCourse> = new Map();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    console.log(`Starting Simple GPS tracking for course ${courseId}, UIT: ${uit}`);
    
    // Store course data locally
    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token,
      status
    };
    
    this.activeCourses.set(courseId, courseData);
    
    // Use native Android GPS if available
    if (typeof window !== 'undefined' && window.SimpleGPS) {
      try {
        const result = await window.SimpleGPS.startTracking({
          vehicleNumber,
          courseId,
          uit,
          authToken: token,
          status
        });
        
        if (result && result.success) {
          console.log(`Simple GPS tracking started successfully for UIT: ${uit}`);
          console.log(`GPS coordinates will transmit every 60 seconds`);
        } else {
          console.warn(`Simple GPS setup failed: ${result?.message || 'Unknown error'}`);
        }
      } catch (nativeError) {
        console.warn('Simple GPS plugin error:', nativeError);
        console.log('Course tracking continues in app state');
      }
    } else {
      console.log('Running in web environment - course marked as active');
      console.log(`Course ${courseId} with UIT ${uit} ready for GPS tracking`);
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`Stopping Simple GPS tracking for course ${courseId}`);
    
    const courseData = this.activeCourses.get(courseId);
    if (!courseData) {
      console.warn(`No active course found with ID: ${courseId}`);
      return;
    }
    
    // Remove from local tracking
    this.activeCourses.delete(courseId);
    
    // Stop native GPS if available
    if (typeof window !== 'undefined' && window.SimpleGPS) {
      try {
        const result = await window.SimpleGPS.stopTracking({
          courseId
        });
        
        if (result && result.success) {
          console.log(`Simple GPS tracking stopped successfully for course ${courseId}`);
        } else {
          console.warn(`GPS stop failed: ${result?.message || 'Unknown error'}`);
        }
      } catch (nativeError) {
        console.warn('Simple GPS stop error:', nativeError);
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
    if (typeof window !== 'undefined' && window.SimpleGPS) {
      try {
        const result = await window.SimpleGPS.isActive();
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
const simpleGPSTracker = new SimpleGPSTracker();

// Export convenience functions for course management
export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string, status: number = 2) => 
  simpleGPSTracker.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) => 
  simpleGPSTracker.stopTracking(courseId);

export const getActiveCourses = () => 
  simpleGPSTracker.getActiveCourses();

export const hasActiveCourses = () => 
  simpleGPSTracker.hasActiveCourses();

export const isGPSTrackingActive = () => 
  simpleGPSTracker.isTrackingActive();

export default simpleGPSTracker;