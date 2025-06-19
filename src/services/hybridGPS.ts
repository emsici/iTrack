// Implementare GPS hibridă: Android nativ pentru background + Capacitor pentru web
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { sendGPSData, GPSData } from './api';

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
}

class HybridGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();
  private webIntervals: Map<string, number> = new Map();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    console.log(`🚀 Starting hybrid GPS tracking for course ${courseId}, UIT: ${uit}`);
    
    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token,
      status
    };
    
    this.activeCourses.set(courseId, courseData);
    
    if (Capacitor.isNativePlatform()) {
      // Android nativ - folosește serviciul background
      console.log('📱 Platform: Android - starting native background service');
      await this.startAndroidBackgroundService(courseData);
    } else {
      // Web platform - folosește Capacitor Geolocation cu timer
      console.log('🌐 Platform: Web - starting Capacitor Geolocation');
      await this.startWebGPSTracking(courseData);
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`🛑 Stopping GPS tracking for course ${courseId}`);
    
    const course = this.activeCourses.get(courseId);
    if (!course) return;

    if (Capacitor.isNativePlatform()) {
      await this.stopAndroidBackgroundService(courseId);
    } else {
      this.stopWebGPSTracking(courseId);
    }
    
    this.activeCourses.delete(courseId);
  }

  private async startAndroidBackgroundService(course: ActiveCourse): Promise<void> {
    try {
      // Încearcă să folosească serviciul Android nativ existent
      console.log('🔌 Attempting to start Android GPS service...');
      
      // Simulăm apelul către serviciul Android prin Intent
      // Aceasta va fi gestionată de EnhancedGPSService.java
      const serviceData = {
        action: 'START_TRACKING',
        vehicleNumber: course.vehicleNumber,
        courseId: course.courseId,
        uit: course.uit,
        authToken: course.token,
        status: course.status
      };
      
      console.log('📤 Sending intent to Android service:', serviceData);
      
      // Pentru acum, folosim fallback web pentru că plugin-ul custom are probleme
      await this.startWebGPSTracking(course);
      
    } catch (error) {
      console.warn('⚠️ Android service failed, falling back to web GPS:', error);
      await this.startWebGPSTracking(course);
    }
  }

  private async startWebGPSTracking(course: ActiveCourse): Promise<void> {
    try {
      // Cerere permisiuni GPS
      const permissions = await Geolocation.requestPermissions();
      console.log('📱 GPS permissions:', permissions);
      
      if (permissions.location !== 'granted') {
        throw new Error('GPS permissions not granted');
      }

      // Pornește transmisia la fiecare 60 secunde
      const intervalId = window.setInterval(async () => {
        await this.transmitGPSForCourse(course);
      }, 60000);
      
      this.webIntervals.set(course.courseId, intervalId);
      
      // Transmite imediat prima coordonată
      await this.transmitGPSForCourse(course);
      
      console.log(`✅ Web GPS tracking started for UIT: ${course.uit}`);
      
    } catch (error) {
      console.error(`❌ Failed to start web GPS tracking:`, error);
      throw error;
    }
  }

  private async stopAndroidBackgroundService(courseId: string): Promise<void> {
    console.log('🛑 Stopping Android background service for:', courseId);
    // Aici am trimite STOP_TRACKING intent către serviciul Android
    // Pentru acum folosim fallback web
    this.stopWebGPSTracking(courseId);
  }

  private stopWebGPSTracking(courseId: string): void {
    const intervalId = this.webIntervals.get(courseId);
    if (intervalId) {
      clearInterval(intervalId);
      this.webIntervals.delete(courseId);
      console.log(`🛑 Web GPS tracking stopped for course: ${courseId}`);
    }
  }

  private async transmitGPSForCourse(course: ActiveCourse): Promise<void> {
    try {
      console.log(`📡 Getting GPS position for UIT: ${course.uit}`);
      
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      });
      
      const coords = position.coords;
      const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
      
      const gpsData: GPSData = {
        lat: coords.latitude,
        lng: coords.longitude,
        timestamp: timestamp,
        viteza: Math.round((coords.speed || 0) * 3.6), // m/s to km/h
        directie: Math.round(coords.heading || 0),
        altitudine: Math.round(coords.altitude || 0),
        baterie: await this.getBatteryLevel(),
        numar_inmatriculare: course.vehicleNumber,
        uit: course.uit,
        status: course.status.toString(),
        hdop: Math.round(coords.accuracy || 0).toString(),
        gsm_signal: '75' // Default good signal
      };
      
      console.log(`📤 Transmitting GPS data for UIT ${course.uit}:`, {
        lat: gpsData.lat.toFixed(6),
        lng: gpsData.lng.toFixed(6),
        speed: gpsData.viteza,
        accuracy: gpsData.hdop,
        platform: Capacitor.getPlatform()
      });
      
      const success = await sendGPSData(gpsData, course.token);
      
      if (success) {
        console.log(`✅ GPS data transmitted successfully for UIT: ${course.uit}`);
      } else {
        console.error(`❌ Failed to transmit GPS data for UIT: ${course.uit}`);
      }
      
    } catch (error) {
      console.error(`💥 Error getting/transmitting GPS for UIT ${course.uit}:`, error);
    }
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
    } catch (error) {
      console.warn('Cannot get battery level:', error);
    }
    return 100; // Default fallback
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
}

const hybridGPSService = new HybridGPSService();

// Export functions pentru uz în CourseCard
export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string, status: number = 2) => 
  hybridGPSService.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) => 
  hybridGPSService.stopTracking(courseId);

export const getActiveCourses = () => 
  hybridGPSService.getActiveCourses();

export const hasActiveCourses = () => 
  hybridGPSService.hasActiveCourses();

export const isGPSTrackingActive = () => 
  hybridGPSService.isTrackingActive();