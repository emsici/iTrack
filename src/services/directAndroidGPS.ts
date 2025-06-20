// GPS direct Android prin Capacitor plugin - funcționează în background
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

// DirectGPS Plugin pentru activarea EnhancedGPSService
interface DirectGPSPlugin {
  startTracking(options: {
    courseId: string;
    vehicleNumber: string;
    uit: string;
    authToken: string;
    status: number;
  }): Promise<{ success: boolean; message: string }>;
  
  stopTracking(options: {
    courseId: string;
  }): Promise<{ success: boolean; message: string }>;
}

const DirectGPS = Capacitor.registerPlugin<DirectGPSPlugin>('DirectGPS');

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
}

class DirectAndroidGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    console.log(`Starting direct Android GPS for course ${courseId}, UIT: ${uit}`);
    
    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token,
      status
    };
    
    this.activeCourses.set(courseId, courseData);
    
    try {
      if (Capacitor.isNativePlatform()) {
        // Pentru Android APK - activează serviciul nativ direct
        await this.startAndroidNativeService(courseData);
      } else {
        // Pentru web - doar logging
        console.log('Web environment: Android service would start in APK');
        console.log(`GPS tracking configured for UIT: ${uit}`);
      }
      
    } catch (error) {
      console.error(`Failed to start Android GPS service:`, error);
      this.activeCourses.delete(courseId);
      throw error;
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`Stopping direct Android GPS for course ${courseId}`);
    
    const course = this.activeCourses.get(courseId);
    if (!course) return;

    try {
      if (Capacitor.isNativePlatform()) {
        await this.stopAndroidNativeService(courseId);
      } else {
        console.log('Web environment: Android service would stop in APK');
      }
      
      this.activeCourses.delete(courseId);
      
    } catch (error) {
      console.error(`Failed to stop Android GPS service:`, error);
      throw error;
    }
  }

  private async startAndroidNativeService(course: ActiveCourse): Promise<void> {
    console.log('=== STARTING ANDROID NATIVE GPS SERVICE ===');
    console.log(`Vehicle: ${course.vehicleNumber}`);
    console.log(`UIT: ${course.uit}`);
    console.log(`Status: ${course.status}`);
    
    try {
      // Cerere permisiuni GPS prin Capacitor
      console.log('Requesting GPS permissions...');
      const permissions = await Geolocation.requestPermissions();
      console.log('GPS permissions result:', permissions);
      
      if (permissions.location === 'granted') {
        console.log('GPS permissions granted - starting location tracking');
        
        // Start location tracking pentru a activa serviciul
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
        
        console.log('Current position obtained:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        
        // Activare serviciu Android prin broadcast intent
        await this.activateAndroidGPSService(course);
        
        console.log('EnhancedGPSService activated for UIT:', course.uit);
        console.log('GPS will transmit every 60 seconds to server');
        
      } else {
        throw new Error('GPS permissions not granted');
      }
      
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      throw error;
    }
  }

  private async stopAndroidNativeService(courseId: string): Promise<void> {
    console.log('=== STOPPING ANDROID NATIVE GPS SERVICE ===');
    console.log(`Course: ${courseId}`);
    
    try {
      if (Capacitor.isNativePlatform()) {
        // Oprire prin DirectGPS plugin
        const result = await DirectGPS.stopTracking({
          courseId: courseId
        });
        
        console.log('GPS tracking stopped:', result.message);
      } else {
        console.log('Web environment: GPS would stop in APK');
      }
      
      console.log('GPS tracking stopped for course');
      
    } catch (error) {
      console.error('Failed to stop Android GPS service:', error);
      throw error;
    }
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

  private async activateAndroidGPSService(course: ActiveCourse): Promise<void> {
    console.log('Activating Android GPS service for course:', course.courseId);
    
    if (Capacitor.isNativePlatform()) {
      try {
        console.log('Starting EnhancedGPSService through DirectGPS plugin');
        
        // Activare prin DirectGPS plugin - funcționează în background
        const result = await DirectGPS.startTracking({
          courseId: course.courseId,
          vehicleNumber: course.vehicleNumber,
          uit: course.uit,
          authToken: course.token,
          status: course.status
        });
        
        console.log('GPS tracking started:', result.message);
        console.log('EnhancedGPSService running in background - coordinates transmit every 60s');
        
      } catch (error) {
        console.error('Failed to start DirectGPS plugin:', error);
        throw error;
      }
    } else {
      console.log('Web environment: Testing GPS transmission');
      await this.testGPSTransmission(course);
    }
  }

  private async testGPSTransmission(course: ActiveCourse): Promise<void> {
    try {
      // Test transmisie GPS în mediul web
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      const gpsData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: new Date().toISOString(),
        viteza: Math.round((position.coords.speed || 0) * 3.6), // m/s to km/h
        directie: Math.round(position.coords.heading || 0),
        altitudine: Math.round(position.coords.altitude || 0),
        baterie: 100,
        numar_inmatriculare: course.vehicleNumber,
        uit: course.uit,
        status: course.status.toString(),
        hdop: Math.round(position.coords.accuracy || 999),
        gsm_signal: '100'
      };
      
      console.log('Test GPS data prepared:', gpsData);
      
      // Test HTTP transmission
      const response = await fetch('https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${course.token}`,
          'User-Agent': 'iTrack/2.0 Web-Test'
        },
        body: JSON.stringify(gpsData)
      });
      
      if (response.ok) {
        console.log('GPS test transmission successful!');
        console.log('Response status:', response.status);
      } else {
        console.log('GPS test transmission failed:', response.status, response.statusText);
      }
      
    } catch (error) {
      console.error('GPS test transmission error:', error);
    }
  }



  getServiceInfo() {
    return {
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      activeCourses: this.activeCourses.size,
      implementation: 'Direct Android Intent to EnhancedGPSService',
      pluginUsed: 'NONE - Direct Android service activation',
      backgroundSupport: 'Full native Android background tracking',
      gpsMethod: 'Android LocationManager in EnhancedGPSService.java',
      transmission: 'OkHttp direct from Android service to server'
    };
  }
}

const directAndroidGPSService = new DirectAndroidGPSService();

export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string, status: number = 2) => 
  directAndroidGPSService.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) => 
  directAndroidGPSService.stopTracking(courseId);

export const getActiveCourses = () => 
  directAndroidGPSService.getActiveCourses();

export const hasActiveCourses = () => 
  directAndroidGPSService.hasActiveCourses();

export const isGPSTrackingActive = () => 
  directAndroidGPSService.isTrackingActive();

export const getDirectGPSInfo = () => 
  directAndroidGPSService.getServiceInfo();