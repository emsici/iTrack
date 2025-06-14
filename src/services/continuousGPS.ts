import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { sendGPSData, type GPSData } from "./api";

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
}

// Continuous GPS service that sends coordinates every minute for active courses
class ContinuousGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();
  private trackingInterval: NodeJS.Timeout | null = null;
  private hasLocationPermission = false;

  async requestLocationPermissions(): Promise<boolean> {
    try {
      console.log('Requesting location permissions...');
      
      const permission = await Geolocation.requestPermissions();
      console.log('Location permission result:', permission);
      
      if (permission.location === 'granted') {
        this.hasLocationPermission = true;
        
        // Show user instruction for background permission
        const message = `Pentru urmărirea GPS în background (când aplicația este minimizată), vă rugăm să acordați permisiunea "Allow all the time" în setările Android.

Deschideți: Setări > Aplicații > iTrack > Permisiuni > Locație > "Allow all the time"`;
        
        alert(message);
        return true;
      } else {
        alert('Pentru urmărirea GPS, aplicația necesită acces la locație. Vă rugăm să acordați permisiunea în setări.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string): Promise<void> {
    if (!this.hasLocationPermission) {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission required');
      }
    }

    console.log(`Starting continuous GPS tracking for course ${courseId}`);
    
    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token
    };

    this.activeCourses.set(courseId, courseData);
    
    // Start interval tracking if not already running
    if (!this.trackingInterval && this.activeCourses.size > 0) {
      this.startContinuousTracking();
    }

    // Send initial GPS data immediately
    await this.sendGPSForCourse(courseData, 2); // Status 2 = active
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`Stopping GPS tracking for course ${courseId}`);
    
    const courseData = this.activeCourses.get(courseId);
    if (courseData) {
      // Send final GPS data with status 4 (stopped)
      await this.sendGPSForCourse(courseData, 4);
      this.activeCourses.delete(courseId);
    }

    // Stop interval if no more active courses
    if (this.activeCourses.size === 0 && this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      console.log('Stopped continuous GPS tracking - no active courses');
    }
  }

  async pauseTracking(courseId: string): Promise<void> {
    console.log(`Pausing GPS tracking for course ${courseId}`);
    
    const courseData = this.activeCourses.get(courseId);
    if (courseData) {
      // Send GPS data with status 3 (paused)
      await this.sendGPSForCourse(courseData, 3);
    }
  }

  async resumeTracking(courseId: string): Promise<void> {
    console.log(`Resuming GPS tracking for course ${courseId}`);
    
    const courseData = this.activeCourses.get(courseId);
    if (courseData) {
      // Send GPS data with status 2 (active again)
      await this.sendGPSForCourse(courseData, 2);
    }
  }

  private startContinuousTracking(): void {
    console.log('Starting continuous GPS tracking every 60 seconds');
    
    this.trackingInterval = setInterval(async () => {
      try {
        console.log(`Sending GPS data for ${this.activeCourses.size} active courses`);
        
        for (const [courseId, courseData] of this.activeCourses) {
          await this.sendGPSForCourse(courseData, 2); // Status 2 = active
        }
      } catch (error) {
        console.error('Error in continuous GPS tracking:', error);
      }
    }, 60000); // 60 seconds = 1 minute
  }

  private async sendGPSForCourse(courseData: ActiveCourse, status: number): Promise<void> {
    try {
      // Get current GPS position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      });

      // Get battery info
      const batteryInfo = await Device.getBatteryInfo();
      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // Prepare GPS data
      const gpsData: GPSData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: currentTime,
        viteza: Math.max(0, Math.round((position.coords.speed || 0) * 3.6)), // km/h
        directie: Math.round(position.coords.heading || 0),
        altitudine: Math.round(position.coords.altitude || 0),
        baterie: Math.round((batteryInfo.batteryLevel || 0) * 100),
        numar_inmatriculare: courseData.vehicleNumber,
        uit: courseData.uit,
        status: status.toString(),
        hdop: Math.round(position.coords.accuracy || 0).toString(),
        gsm_signal: '100'
      };

      console.log(`Sending GPS data for course ${courseData.courseId}:`, {
        lat: gpsData.lat,
        lng: gpsData.lng,
        status: gpsData.status,
        uit: gpsData.uit
      });

      await sendGPSData(gpsData, courseData.token);
      console.log(`GPS data sent successfully for course ${courseData.courseId}`);
    } catch (error) {
      console.error(`Failed to send GPS data for course ${courseData.courseId}:`, error);
    }
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses.keys());
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }
}

// Export singleton instance
const continuousGPSService = new ContinuousGPSService();

export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string) => 
  continuousGPSService.startTracking(courseId, vehicleNumber, uit, token);

export const stopGPSTracking = (courseId: string) => 
  continuousGPSService.stopTracking(courseId);

export const pauseGPSTracking = (courseId: string) => 
  continuousGPSService.pauseTracking(courseId);

export const resumeGPSTracking = (courseId: string) => 
  continuousGPSService.resumeTracking(courseId);

export const getActiveCourses = () => 
  continuousGPSService.getActiveCourses();

export const hasActiveCourses = () => 
  continuousGPSService.hasActiveCourses();