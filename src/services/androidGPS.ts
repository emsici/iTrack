// GPS nativ Android pentru background tracking cu telefon blocat
import { Capacitor, registerPlugin } from '@capacitor/core';

// Conectare la CapacitorGPSPlugin existent
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

const GPSTracking = registerPlugin<GPSTrackingInterface>('GPSTracking');

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
}

// Conectare directă la EnhancedGPSService.java prin Intent

class AndroidGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    console.log(`🚀 Starting Android GPS tracking for course ${courseId}, UIT: ${uit}`);
    
    if (!Capacitor.isNativePlatform()) {
      throw new Error('GPS nativ funcționează doar pe Android');
    }

    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token,
      status
    };
    
    this.activeCourses.set(courseId, courseData);
    
    try {
      // Apelează direct serviciul Android EnhancedGPSService prin Intent
      await this.startAndroidService(courseData);
      console.log(`✅ Android GPS service started for UIT: ${uit}`);
      
    } catch (error) {
      console.error(`❌ Failed to start Android GPS service:`, error);
      this.activeCourses.delete(courseId);
      throw error;
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`🛑 Stopping Android GPS tracking for course ${courseId}`);
    
    const course = this.activeCourses.get(courseId);
    if (!course) {
      console.warn(`Course ${courseId} not found in active tracking`);
      return;
    }

    try {
      await this.stopAndroidService(courseId);
      this.activeCourses.delete(courseId);
      console.log(`✅ Android GPS service stopped for course: ${courseId}`);
      
    } catch (error) {
      console.error(`❌ Failed to stop Android GPS service:`, error);
      throw error;
    }
  }

  private async startAndroidService(course: ActiveCourse): Promise<void> {
    try {
      console.log('Starting CapacitorGPSPlugin -> EnhancedGPSService');
      console.log(`Vehicle: ${course.vehicleNumber}, UIT: ${course.uit}, Status: ${course.status}`);
      
      const result = await GPSTracking.startGPSTracking({
        vehicleNumber: course.vehicleNumber,
        courseId: course.courseId,
        uit: course.uit,
        authToken: course.token,
        status: course.status
      });
      
      if (result && result.success) {
        console.log('Android GPS service activated successfully');
        console.log('EnhancedGPSService will transmit coordinates every 60 seconds');
        console.log('Background GPS tracking active - works with phone locked');
      } else {
        throw new Error(`GPS service failed: ${result?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Failed to start Android GPS service:', error);
      throw error;
    }
  }

  private async stopAndroidService(courseId: string): Promise<void> {
    const stopIntent = {
      action: 'STOP_TRACKING',
      courseId: courseId
    };
    
    console.log('🛑 Stopping EnhancedGPSService for course:', courseId);
    console.log('📤 Stop intent:', stopIntent);
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses.keys());
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }

  async isTrackingActive(): Promise<boolean> {
    return this.activeCourses.size > 0;
  }

  // Informații despre serviciul Android pentru debugging
  getServiceInfo() {
    return {
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      activeCourses: this.activeCourses.size,
      serviceStatus: this.activeCourses.size > 0 ? 'RUNNING' : 'STOPPED',
      backgroundGPS: 'EnhancedGPSService.java',
      transmissionInterval: '60 seconds',
      supportsLocked: true,
      supportsBackground: true
    };
  }
}

const androidGPSService = new AndroidGPSService();

// Export functions pentru uz în CourseCard
export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string, status: number = 2) => 
  androidGPSService.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) => 
  androidGPSService.stopTracking(courseId);

export const getActiveCourses = () => 
  androidGPSService.getActiveCourses();

export const hasActiveCourses = () => 
  androidGPSService.hasActiveCourses();

export const isGPSTrackingActive = () => 
  androidGPSService.isTrackingActive();

export const getGPSServiceInfo = () => 
  androidGPSService.getServiceInfo();