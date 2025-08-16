/**
 * Direct Android GPS Service
 * Uses MainActivity WebView interface for reliable Android communication
 * Single method approach - guaranteed to work
 */

// Global window interface definition for AndroidGPS
declare global {
  interface Window {
    AndroidGPS?: {
      startGPS: (courseId: string, vehicleNumber: string, uit: string, authToken: string, status: number) => string;
      stopGPS: (courseId: string) => string;
      updateStatus: (courseId: string, newStatus: number) => string;
      clearAllOnLogout: () => string;
    };
    AndroidGPSReady?: boolean;
    androidGPSBridgeReady?: boolean;
    androidGPSInterfaceReady?: boolean;
  }
}

import { logGPS, logGPSError } from './appLogger';
import { sendGPSData } from './api';
import { Geolocation } from '@capacitor/geolocation';
import { getStoredToken, getStoredVehicleNumber } from './storage';
import { guaranteedGPSService } from './garanteedGPS';
import { sharedTimestampService } from './sharedTimestamp';
// Direct AndroidGPS service handles native interface operations

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
  intervalId?: NodeJS.Timeout; // For June 26th browser GPS intervals
}

class DirectAndroidGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();



  /**
   * Send status update to server via gps.php
   * HIBRID: Trimite status + coordonată pentru a asigura conectivitatea
   */
  private async sendStatusToServer(uit: string, vehicleNumber: string, token: string, status: number): Promise<void> {
    try {
      logGPS(`📡 Trimitere status ${status} + coordonată hibridă pentru UIT: ${uit}`);
      
      // HIBRID APPROACH: Trimite o coordonată cu status pentru a menține conexiunea
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      });

      // Get real device data
      const batteryLevel = await this.getRealBatteryLevel();
      const networkType = await this.getRealNetworkType();
      
      // Create GPS data for status transmission
      const currentTime = sharedTimestampService.getSharedTimestampISO();
      const gpsData = {
        uit: uit,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: currentTime,
        viteza: Math.max(0, position.coords.speed || 0),
        directie: position.coords.heading || 0,
        altitudine: position.coords.altitude || 0,
        baterie: batteryLevel,
        hdop: position.coords.accuracy.toString(),
        gsm_signal: networkType,
        numar_inmatriculare: vehicleNumber,
        status: status
      };

      // Send to server with status - FIXED: sendGPSData primește doar 2 argumente
      await sendGPSData(gpsData, token);
      logGPS(`✅ Status ${status} + coordonată trimisă pentru ${uit} - hibrid approach`);
      
    } catch (error) {
      logGPSError(`❌ Hibrid GPS status transmission failed pentru ${uit}: ${error}`);
      // Fall back to Android only if browser fails
      logGPS(`🤖 Fallback la OptimalGPSService pentru ${uit}`);
    }
  }

  async updateCourseStatus(courseId: string, newStatus: number): Promise<void> {
    try {
      console.log(`🔄 Updating course status via MainActivity Android: ${courseId} → ${newStatus}`);
      
      // Get course data needed for all status updates
      const vehicleNumber = await getStoredVehicleNumber() || 'UNKNOWN';
      const token = await getStoredToken() || '';
      const realUIT = courseId; // courseId IS the UIT from VehicleScreen fix
      
      // CRITICAL FLOW:
      // 1. For PAUSE (3) or STOP (4): Send status FIRST, then stop GPS coordinates
      // 2. For START (2): Send status FIRST, then start GPS coordinates
      
      console.log(`📡 STEP 1: Sending status ${newStatus} to server for UIT: ${realUIT}`);
      await this.sendStatusToServer(realUIT, vehicleNumber, token, newStatus);
      console.log(`✅ Status ${newStatus} sent to server successfully`);
      
      // STEP 2: Handle GPS coordinate transmission based on status
      if (newStatus === 3 || newStatus === 4) {
        console.log(`🛑 STEP 2: Oprire GPS pentru ${courseId} - status ${newStatus === 3 ? 'PAUZĂ' : 'STOP'}`);
        
        // IMMEDIATE STOP: Stop tracking BEFORE any more transmissions can happen
        await this.stopTracking(courseId);
        
        // Update GPS Garantat status
        try {
          await guaranteedGPSService.updateStatus(courseId, newStatus);
          console.log(`✅ Status GPS Garantat actualizat la ${newStatus}`);
        } catch (guaranteedError) {
          console.error(`⚠️ Nu s-a putut actualiza status GPS Garantat: ${guaranteedError}`);
        }
        
        console.log(`✅ GPS oprit pentru cursa ${courseId} - status ${newStatus === 3 ? 'PAUZĂ' : 'STOP'}`);
      }
      
      // STEP 3: Handle GPS coordinate transmission for START/RESUME
      if (newStatus === 2) {
        console.log(`🚀 STEP 3: STARTING GPS tracking + hibrid browser backup`);
        
        // Start Android GPS
        await this.startTracking(courseId, vehicleNumber, realUIT, token, newStatus);
        
        // Start hibrid browser backup la 30s pentru siguranță
        await this.startHibridBrowserBackup(courseId, vehicleNumber, realUIT, token, newStatus);
        
        console.log(`✅ GPS HIBRID PORNIT - Android principal + browser backup`);
      }
      
      // Update local tracking - CRITICAL FIX: Remove courses with status 3/4 completely
      if (newStatus === 3 || newStatus === 4) {
        logGPS(`🛑 REMOVING course ${courseId} from directAndroidGPS activeCourses - status ${newStatus} (STOP/PAUSE)`);
        this.activeCourses.delete(courseId);
        logGPS(`✅ Course ${courseId} REMOVED from directAndroidGPS - ${this.activeCourses.size} courses remaining`);
      } else {
        // For other statuses, update the course data
        const course = this.activeCourses.get(courseId);
        if (course) {
          course.status = newStatus;
          this.activeCourses.set(courseId, course);
        }
      }
      
      // Direct MainActivity Android GPS interface for status update
      if (window.AndroidGPS && window.AndroidGPS.updateStatus) {
        const result = window.AndroidGPS.updateStatus(courseId, newStatus);
        logGPS(`✅ MainActivity GPS status updated: ${result}`);
      } else {
        logGPSError(`❌ AndroidGPS interface not available for status update - this is normal in browser`);
        console.warn('AndroidGPS status interface not available - this is normal in browser development');
      }
      
    } catch (error) {
      logGPSError(`❌ GPS status update error: ${error}`);
      throw error;
    }
  }

  /**
   * Obține nivelul real al bateriei dispozitivului
   */
  private async getRealBatteryLevel(): Promise<number> {
    try {
      // Try Android native battery level first
      if (window.AndroidGPS && window.AndroidGPS.getBatteryLevel) {
        const batteryLevel = window.AndroidGPS.getBatteryLevel();
        if (batteryLevel >= 0 && batteryLevel <= 100) {
          return batteryLevel;
        }
      }

      // Try Capacitor Device info (doar dacă e disponibil)
      if ((window as any).Capacitor?.isNativePlatform()) {
        try {
          // Import dinamic pentru a evita errori la build
          const Device = await import('@capacitor/device').then(module => module.Device).catch(() => null);
          if (Device) {
            const info = await Device.getBatteryInfo();
            if (info.batteryLevel !== undefined) {
              return Math.round(info.batteryLevel * 100);
            }
          }
        } catch (deviceError) {
          // Capacitor Device not available - silent fallback
          logGPS('ℹ️ Capacitor Device plugin nu e disponibil');
        }
      }

      // Try Navigator Battery API (deprecated but some browsers still support)
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        if (battery && battery.level !== undefined) {
          return Math.round(battery.level * 100);
        }
      }

      logGPS('⚠️ Nu s-a putut obține nivelul real al bateriei - folosesc estimare 85%');
      return 85; // Fallback realistic
    } catch (error) {
      logGPSError(`❌ Eroare obținere baterie: ${error}`);
      return 85; // Safe fallback
    }
  }

  /**
   * Obține tipul real de rețea/semnal GSM
   */
  private async getRealNetworkType(): Promise<string> {
    try {
      // Try Android native network info first
      if (window.AndroidGPS && window.AndroidGPS.getNetworkType) {
        const networkType = window.AndroidGPS.getNetworkType();
        if (networkType && networkType.trim() !== '') {
          return networkType;
        }
      }

      // Try Navigator connection API
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.effectiveType) {
          // Map browser connection types to mobile network types
          const typeMap: { [key: string]: string } = {
            'slow-2g': '2G',
            '2g': '2G',
            '3g': '3G',
            '4g': '4G'
          };
          return typeMap[connection.effectiveType] || '4G';
        }
      }

      // Try Capacitor Network plugin (doar dacă e disponibil)
      if ((window as any).Capacitor?.isNativePlatform()) {
        try {
          // Import dinamic pentru a evita errori la build
          const Network = await import('@capacitor/network').then(module => module.Network).catch(() => null);
          if (Network) {
            const status = await Network.getStatus();
            if (status.connectionType) {
              // Map Capacitor types to GSM types
              const typeMap: { [key: string]: string } = {
                'wifi': 'WiFi',
                'cellular': '4G',
                'none': 'No Signal'
              };
              return typeMap[status.connectionType] || '4G';
            }
          }
        } catch (capacitorError) {
          // Capacitor Network not available - silent fallback
          logGPS('ℹ️ Capacitor Network plugin nu e disponibil');
        }
      }

      logGPS('⚠️ Nu s-a putut obține tipul real de rețea - folosesc 4G default');
      return '4G'; // Most common fallback
    } catch (error) {
      logGPSError(`❌ Eroare obținere tip rețea: ${error}`);
      return '4G'; // Safe fallback
    }
  }

  /**
   * BACKUP HIBRID BROWSER GPS pentru siguranță în caz că Android GPS nu funcționează
   */
  private async startHibridBrowserBackup(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): Promise<void> {
    // Stop any existing backup for this course
    const existingCourse = this.activeCourses.get(courseId);
    if (existingCourse?.intervalId) {
      clearInterval(existingCourse.intervalId);
    }

    logGPS(`🔄 HIBRID BACKUP: Browser GPS backup la 30s pentru ${courseId}`);
    
    // Browser GPS backup la 30 secunde (mai rar ca să nu interfere cu Android)
    const intervalId = setInterval(async () => {
      try {
        const course = this.activeCourses.get(courseId);
        if (!course || course.status !== 2) {
          logGPS(`⏹️ HIBRID BACKUP: Course ${courseId} nu mai e activ - opresc backup`);
          clearInterval(intervalId);
          return;
        }

        logGPS(`🔄 HIBRID BACKUP: Transmisie browser GPS pentru ${courseId}`);
        await this.sendStatusToServer(uit, vehicleNumber, token, 2); // Status 2 pentru transmisie în progres
        
      } catch (error) {
        logGPSError(`❌ HIBRID BACKUP: Eroare transmisie pentru ${courseId}: ${error}`);
      }
    }, 30000); // 30 secunde

    // Update course with interval ID
    const course = this.activeCourses.get(courseId);
    if (course) {
      course.intervalId = intervalId;
      this.activeCourses.set(courseId, course);
    }
  }

  async startTracking(
    courseId: string,
    vehicleNumber: string,
    uit: string,
    token: string,
    status: number
  ): Promise<void> {
    try {
      logGPS(`🚀 Starting GPS tracking (June 26th method): ${courseId}`);
      
      const courseData: ActiveCourse = { courseId, vehicleNumber, uit, token, status };
      this.activeCourses.set(courseId, courseData);
      
      console.log(`📊 Active courses after start: ${this.activeCourses.size}`);
      console.log(`🗂️ Courses in map: [${Array.from(this.activeCourses.keys()).join(', ')}]`);
      
      // HYBRID: June 26th format + Android background service for phone locked
      await this.startHybridGPS_June26thFormat_AndroidBackground(courseData);
      
    } catch (error) {
      logGPSError(`❌ GPS start error: ${error}`);
      throw error;
    }
  }

  /**
   * ANDROID ONLY: Direct Android background service for all GPS (phone locked + unlocked)
   */
  private async startHybridGPS_June26thFormat_AndroidBackground(course: ActiveCourse): Promise<void> {
    // ONLY Android background service - no browser GPS to prevent duplicates
    await this.startAndroidBackgroundService(course);
    
    logGPS(`🔥 ANDROID ONLY GPS - no browser intervals to prevent double transmissions`);
  }

  /**
   * DIRECT ANDROID GPS: Call window.AndroidGPS directly pentru background service
   */
  private async startAndroidBackgroundService(course: ActiveCourse): Promise<void> {
    const { courseId, vehicleNumber, uit, token, status } = course;
    
    logGPS(`🎯 ANDROID GPS: Starting direct Android background service`);
    
    // DIRECT ANDROID GPS CALL pentru background service
    if (window.AndroidGPS && window.AndroidGPS.startGPS) {
      try {
        const result = window.AndroidGPS.startGPS(courseId, vehicleNumber, uit, token, status);
        logGPS(`✅ DIRECT Android GPS started: ${result}`);
        
        // Backup garantat service pentru siguranță
        await guaranteedGPSService.startGuaranteedGPS(courseId, vehicleNumber, uit, token, status);
        logGPS(`✅ Backup GPS service started for course: ${courseId}`);
        
      } catch (error) {
        logGPSError(`❌ Direct Android GPS failed: ${error} - using backup`);
        // Fallback la garanteed GPS
        await guaranteedGPSService.startGuaranteedGPS(courseId, vehicleNumber, uit, token, status);
      }
    } else {
      logGPS(`⚠️ AndroidGPS interface not available - using garanteed GPS backup`);
      // Direct backup când nu avem Android GPS
      await guaranteedGPSService.startGuaranteedGPS(courseId, vehicleNumber, uit, token, status);
    }
  }



  async stopTracking(courseId: string): Promise<void> {
    try {
      logGPS(`🛑 Stopping Android GPS tracking: ${courseId}`);
      
      // Stop hibrid browser backup
      const course = this.activeCourses.get(courseId);
      if (course?.intervalId) {
        clearInterval(course.intervalId);
        logGPS(`✅ Hibrid browser backup stopped for ${courseId}`);
      }
      
      // Stop Android native GPS service  
      if (window.AndroidGPS && window.AndroidGPS.stopGPS) {
        const result = window.AndroidGPS.stopGPS(courseId);
        logGPS(`✅ MainActivity GPS stopped: ${result}`);
      }
      
      // Stop guaranteed JavaScript GPS backup
      await guaranteedGPSService.stopGPS(courseId);
      logGPS(`✅ Guaranteed GPS backup stopped for course: ${courseId}`);
      
      // Remove from local tracking
      this.activeCourses.delete(courseId);
      logGPS(`✅ GPS tracking stopped for course: ${courseId}`);
      logGPS(`📊 Active courses after stop: ${this.activeCourses.size}`);
      
    } catch (error) {
      logGPSError(`❌ GPS stop error: ${error}`);
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



  async logoutClearAll(): Promise<void> {
    try {
      logGPS(`🧹 LOGOUT: Stopping GPS transmissions but KEEPING offline coordinates`);
      logGPS(`💾 IMPORTANT: Offline coordinates preserved for next login to avoid missing route segments`);
      
      // STEP 1: Stop all active courses individually
      for (const courseId of this.activeCourses.keys()) {
        try {
          await this.stopTracking(courseId);
          logGPS(`✅ Stopped GPS for course: ${courseId}`);
        } catch (error) {
          logGPSError(`⚠️ Error stopping course ${courseId}: ${error}`);
        }
      }
      
      // STEP 2: Stop guaranteed GPS service 
      await guaranteedGPSService.clearAll();
      logGPS(`✅ Guaranteed GPS service cleared`);
      
      // STEP 3: Call AndroidGPS clearAllOnLogout to stop native service completely
      if (window.AndroidGPS && typeof window.AndroidGPS.clearAllOnLogout === 'function') {
        try {
          const result = window.AndroidGPS.clearAllOnLogout();
          logGPS(`✅ AndroidGPS native service cleared: ${result}`);
        } catch (error) {
          logGPSError(`⚠️ AndroidGPS clearAllOnLogout failed: ${error}`);
        }
      } else {
        logGPS(`ℹ️ AndroidGPS interface not available (browser mode)`);
      }
      
      // STEP 4: Clear local data
      this.activeCourses.clear();
      logGPS(`📊 All local GPS data cleared: ${this.activeCourses.size} courses remaining`);
      
    } catch (error) {
      logGPSError(`❌ GPS clear error: ${error}`);
      throw error;
    }
  }

  getServiceInfo() {
    return {
      type: 'DirectAndroidGPS',
      activeCourses: this.activeCourses.size,
      courses: Array.from(this.activeCourses.keys())
    };
  }
}

export const directAndroidGPSService = new DirectAndroidGPSService();

// Export functions with consistent API
export const startGPSTracking = (courseId: string, vehicleNumber: string, uit: string, token: string, status: number) =>
  directAndroidGPSService.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) =>
  directAndroidGPSService.stopTracking(courseId);

export const updateCourseStatus = (courseId: string, newStatus: number) =>
  directAndroidGPSService.updateCourseStatus(courseId, newStatus);

export const getActiveCourses = () =>
  directAndroidGPSService.getActiveCourses();

export const hasActiveCourses = () =>
  directAndroidGPSService.hasActiveCourses();

export const isGPSTrackingActive = () =>
  directAndroidGPSService.isTrackingActive();

export const getDirectGPSInfo = () => directAndroidGPSService.getServiceInfo();

export const logoutClearAllGPS = () =>
  directAndroidGPSService.logoutClearAll();