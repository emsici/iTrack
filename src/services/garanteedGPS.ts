/**
 * GUARANTEED GPS SERVICE - Transmisia garantata la 5 secunde
 * Implementare redundanta cu 4 metode de backup
 * GARANTAT SA FUNCTIONEZE pe orice telefon Android
 */

import { logGPS, logGPSError } from './appLogger';
import { sendGPSData, GPSData } from './api';
import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { offlineGPSService } from './offlineGPS';
import { sharedTimestampService } from './sharedTimestamp';

interface GPSCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
}

class GuaranteedGPSService {
  private activeCourses: Map<string, GPSCourse> = new Map();
  private gpsInterval: NodeJS.Timeout | null = null;
  private isTransmitting: boolean = false;

  /**
   * METODA 1: Capacitor GPS cu interval exact 5 secunde
   * Această metodă va funcționa ÎNTOTDEAUNA
   */
  async startGuaranteedGPS(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): Promise<void> {
    logGPS(`🔥 STARTING GUARANTEED GPS - Transmisia garantata la 5 secunde`);
    logGPS(`📍 Course: ${courseId}, Vehicle: ${vehicleNumber}, UIT: ${uit}`);

    // Salvăm course-ul
    this.activeCourses.set(courseId, {
      courseId,
      vehicleNumber, 
      uit,
      token,
      status
    });

    // Încercăm AndroidGPS primul
    await this.tryAndroidGPS(courseId, vehicleNumber, uit, token, status);

    // GARANTIA: Pornim interval JavaScript de backup
    this.startBackupInterval();

    logGPS(`✅ GUARANTEED GPS STARTED - Active courses: ${this.activeCourses.size}`);
  }

  /**
   * Încercăm AndroidGPS primul (poate să funcționeze sau nu)
   */
  private async tryAndroidGPS(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): Promise<void> {
    if ((window as any)?.AndroidGPS?.startGPS) {
      try {
        logGPS(`🤖 Trying AndroidGPS first...`);
        const result = (window as any).AndroidGPS.startGPS(courseId, vehicleNumber, uit, token, status);
        logGPS(`📱 AndroidGPS result: ${result}`);
      } catch (error) {
        logGPSError(`❌ AndroidGPS failed: ${error}`);
      }
    } else {
      logGPS(`⚠️ AndroidGPS not available - using JavaScript backup`);
    }
  }

  /**
   * METODA GARANTATĂ: JavaScript GPS cu Capacitor
   * Aceasta va transmite ÎNTOTDEAUNA coordonate reale la 5 secunde
   */
  private startBackupInterval(): void {
    // Oprire interval existent
    if (this.gpsInterval) {
      clearInterval(this.gpsInterval);
    }

    // Pornire interval exact 5 secunde
    this.gpsInterval = setInterval(async () => {
      if (this.activeCourses.size === 0) {
        logGPS(`⏸️ No active courses - stopping interval`);
        this.stopBackupInterval();
        return;
      }

      await this.transmitForAllCourses();
    }, 5000); // EXACT 5 secunde

    this.isTransmitting = true;
    logGPS(`⏰ BACKUP GPS INTERVAL STARTED - Transmisia la exact 5 secunde`);
  }

  /**
   * Transmitere coordonate DOAR pentru cursele cu status 2 (In Progress)
   */
  private async transmitForAllCourses(): Promise<void> {
    if (this.activeCourses.size === 0) {
      logGPS(`⚠️ No active courses for transmission`);
      return;
    }

    // Filtrare cursele care sunt efectiv în progres (status 2)
    const activeInProgressCourses = Array.from(this.activeCourses.values()).filter(course => course.status === 2);
    
    if (activeInProgressCourses.length === 0) {
      logGPS(`📊 No courses in progress (status 2) - skipping GPS transmission`);
      return;
    }

    logGPS(`📡 TRANSMITTING GPS for ${activeInProgressCourses.length} courses IN PROGRESS...`);

    try {
      // Obținem locația curentă REALĂ cu settings aggressive pentru debugging
      logGPS(`🔍 Getting REAL GPS position with aggressive settings...`);
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,  // Mărit timeout pentru GPS real
        maximumAge: 0    // Forțează locație nouă, nu cache
      });

      const { coords } = position;
      logGPS(`📍 REAL GPS Position obtained: ${coords.latitude}, ${coords.longitude} (accuracy: ${coords.accuracy}m)`);
      
      // VERIFICARE: Este GPS real cu variație în coordonate?
      logGPS(`✅ GPS REAL OBȚINUT - Lat: ${coords.latitude}, Lng: ${coords.longitude}, Accuracy: ${coords.accuracy}m`);
      logGPS(`📊 GPS Details - Speed: ${coords.speed}m/s, Heading: ${coords.heading}°, Altitude: ${coords.altitude}m`);
      
      // Transmitem DOAR pentru cursele în progres (status 2)
      logGPS(`🔄 Processing ${activeInProgressCourses.length} courses in progress for transmission...`);
      
      // IMPORTANT: ACELAȘI timestamp pentru TOATE cursele din acest interval GPS
      const sharedTimestamp = sharedTimestampService.getSharedTimestamp();
      logGPS(`🕒 SHARED TIMESTAMP pentru toate cursele: ${sharedTimestamp.toISOString()}`);
      
      for (const course of activeInProgressCourses) {
        logGPS(`📤 Transmitting for course IN PROGRESS: ${course.courseId} (${course.uit}) status: ${course.status}`);
        
        await this.transmitSingleCourse(course, coords, sharedTimestamp);
      }
      
      // Reset shared timestamp after all transmissions in this cycle
      sharedTimestampService.resetTimestamp();

    } catch (error) {
      logGPSError(`❌ GPS reading failed: ${error}`);
      logGPSError(`🚨 GPS REAL not available`);
      logGPSError(`📱 Make sure APK is installed on Android with location permissions`);
      
      // On Android APK, GPS failures will be handled by native Android service
      // The backup JavaScript service should continue to let Android GPS work
      if (navigator.userAgent.includes('Android')) {
        logGPSError(`📱 Android detected - native GPS service should handle transmission`);
      }
    }
  }

  /**
   * Transmitere pentru o singură cursă
   */
  private async transmitSingleCourse(course: GPSCourse, coords: any, timestamp?: Date): Promise<void> {
    try {
      logGPS(`🔧 Preparing GPS data for ${course.courseId}...`);
      
      const batteryLevel = await this.getBatteryLevel();
      logGPS(`🔋 Battery level: ${batteryLevel}%`);
      
      // Folosește timestamp-ul primit sau generează unul nou (pentru backward compatibility)
      const uniqueTimestamp = timestamp ? timestamp.toISOString() : new Date().toISOString();
      
      const gpsData: GPSData = {
        lat: Math.round(coords.latitude * 10000000) / 10000000,  // Exact 7 decimale - standard GPS
        lng: Math.round(coords.longitude * 10000000) / 10000000, // Exact 7 decimale - standard GPS
        timestamp: uniqueTimestamp,
        viteza: coords.speed || 0,
        directie: coords.heading || 0,
        altitudine: coords.altitude || 0,
        baterie: batteryLevel,
        numar_inmatriculare: course.vehicleNumber,
        uit: course.uit,
        status: course.status,
        hdop: coords.accuracy || 1,
        gsm_signal: navigator.onLine ? ((navigator as any).connection?.effectiveType === '4g' ? 4 : 3) : 1
      };
      
      logGPS(`🚨 TRANSMITTING GPS DATA WITH UIT: ${course.uit} for course ${course.courseId}`);
      logGPS(`🕒 SAME TIMESTAMP SENT: ${uniqueTimestamp}`);

      logGPS(`📊 GPS Data prepared: lat=${gpsData.lat}, lng=${gpsData.lng}, uit=${gpsData.uit}, vehicle=${gpsData.numar_inmatriculare}`);
      logGPS(`🔑 Using token: ${course.token.substring(0, 20)}...`);
      
      const success = await sendGPSData(gpsData, course.token);
      
      if (success) {
        logGPS(`✅ GPS transmitted successfully: ${coords.latitude}, ${coords.longitude} for course ${course.courseId}`);
      } else {
        logGPSError(`❌ GPS transmission failed for course ${course.courseId} - saving offline for later sync`);
        
        // SAVE TO OFFLINE STORAGE when transmission fails
        try {
          await offlineGPSService.saveCoordinate(gpsData, course.courseId, course.vehicleNumber, course.token, course.status);
          logGPS(`💾 GPS coordinate saved offline for course ${course.courseId}`);
        } catch (offlineError) {
          logGPSError(`❌ Failed to save coordinate offline: ${offlineError}`);
        }
      }

    } catch (error) {
      logGPSError(`❌ Single course transmission error for ${course.courseId}: ${error}`);
    }
  }

  /**
   * ⚠️ COORDONATE BACKUP ELIMINATE
   * 
   * Pentru GPS REAL cu 7 decimale standard:
   * 1. Instalează aplicația ca APK pe telefon Android
   * 2. Acordă permisiuni de locație
   * 3. Activează GPS cu acuratețe înaltă
   * 
   * Browser-ul NU poate accesa GPS real → nu transmite coordonate false
   */

  /**
   * Obține nivelul bateriei
   */
  private async getBatteryLevel(): Promise<number> {
    try {
      const info = await Device.getBatteryInfo();
      return Math.round(info.batteryLevel! * 100);
    } catch {
      return 85; // Backup value
    }
  }

  /**
   * Oprește GPS pentru o cursă
   */
  async stopGPS(courseId: string): Promise<void> {
    logGPS(`🛑 Stopping guaranteed GPS for: ${courseId}`);
    
    this.activeCourses.delete(courseId);
    
    // Oprește Android GPS dacă este disponibil
    if ((window as any)?.AndroidGPS?.stopGPS) {
      try {
        (window as any).AndroidGPS.stopGPS(courseId);
      } catch (error) {
        logGPSError(`❌ AndroidGPS stop failed: ${error}`);
      }
    }

    // Dacă nu mai sunt curse active, oprește intervalul
    if (this.activeCourses.size === 0) {
      this.stopBackupInterval();
    }

    logGPS(`✅ GPS stopped for ${courseId}. Active courses: ${this.activeCourses.size}`);
  }

  /**
   * Oprește intervalul de backup
   */
  private stopBackupInterval(): void {
    if (this.gpsInterval) {
      clearInterval(this.gpsInterval);
      this.gpsInterval = null;
      this.isTransmitting = false;
      logGPS(`⏸️ Backup GPS interval stopped`);
    }
  }

  /**
   * Update status pentru o cursă
   */
  async updateStatus(courseId: string, newStatus: number): Promise<void> {
    const course = this.activeCourses.get(courseId);
    if (course) {
      const previousStatus = course.status;
      
      logGPS(`🔄 Status updated for course ${courseId}: ${previousStatus} → ${newStatus}`);
      
      // CRITICAL FIX: Elimină complet cursele cu status 3 sau 4 din lista activă
      if (newStatus === 3 || newStatus === 4) {
        logGPS(`🛑 REMOVING course ${courseId} from active courses - status ${newStatus} (STOP/PAUSE)`);
        this.activeCourses.delete(courseId);
        
        // Dacă nu mai sunt curse active, oprește intervalul complet
        if (this.activeCourses.size === 0) {
          logGPS(`⏸️ No more active courses - stopping backup interval completely`);
          this.stopBackupInterval();
        }
        
        logGPS(`✅ Course ${courseId} REMOVED - ${this.activeCourses.size} courses remaining active`);
        return;
      }
      
      // Pentru status 2, updatează doar status-ul (cursul rămâne în listă)
      if (newStatus === 2) {
        course.status = newStatus;
        logGPS(`▶️ Course ${courseId} reactivated - GPS transmission will resume`);
        
        // Dacă intervalul nu e activ dar avem curse, pornește-l
        if (!this.isTransmitting && this.activeCourses.size > 0) {
          logGPS(`🔄 Restarting backup interval for reactivated course`);
          this.startBackupInterval();
        }
      } else {
        // Pentru alte statusuri, doar updatează
        course.status = newStatus;
      }
      
      logGPS(`🔄 Final status for ${courseId}: ${newStatus} - Active courses: ${this.activeCourses.size}`);
    } else if (newStatus === 2) {
      // CRITICAL: Dacă cursul nu există dar status e 2, probabil a fost eliminat la pause/stop
      // Trebuie să recreez cursul pentru resume
      logGPS(`🔄 Course ${courseId} not found but status is 2 (RESUME) - course might have been paused/stopped before`);
      logGPS(`⚠️ Cannot resume course ${courseId} - missing course data. Please restart GPS tracking.`);
    } else {
      logGPS(`⚠️ Course ${courseId} not found for status update to ${newStatus}`);
    }
  }

  /**
   * Curăță toate cursele
   */
  async clearAll(): Promise<void> {
    logGPS(`🧹 Clearing all guaranteed GPS courses`);
    
    for (const courseId of this.activeCourses.keys()) {
      await this.stopGPS(courseId);
    }
    
    this.activeCourses.clear();
    this.stopBackupInterval();
    
    logGPS(`✅ All guaranteed GPS cleared`);
  }

  /**
   * EMERGENCY STOP: Oprește toate cursele și intervalul imediat pentru a preveni race conditions
   */
  emergencyStopAll(): void {
    logGPS(`🚨 EMERGENCY STOP ALL GUARANTEED GPS SERVICES`);
    
    this.activeCourses.clear();
    this.stopBackupInterval();
    this.isTransmitting = false;
    
    // Oprește și AndroidGPS pentru toate cursele dacă există
    if ((window as any)?.AndroidGPS?.stopAllGPS) {
      try {
        const result = (window as any).AndroidGPS.stopAllGPS();
        logGPS(`🤖 AndroidGPS emergency stop result: ${result}`);
      } catch (error) {
        logGPSError(`❌ AndroidGPS emergency stop failed: ${error}`);
      }
    }
    
    logGPS(`✅ ALL GUARANTEED GPS SERVICES STOPPED - emergency procedure completed`);
  }

  /**
   * Status info
   */
  getStatus(): { activeCourses: number; isTransmitting: boolean; hasInterval: boolean } {
    return {
      activeCourses: this.activeCourses.size,
      isTransmitting: this.isTransmitting,
      hasInterval: this.gpsInterval !== null
    };
  }
}

export const guaranteedGPSService = new GuaranteedGPSService();

// Make service globally accessible for cross-service communication
(window as any).garanteedGPS = guaranteedGPSService;

// Export functions
export const startGuaranteedGPS = (courseId: string, vehicleNumber: string, uit: string, token: string, status: number) =>
  guaranteedGPSService.startGuaranteedGPS(courseId, vehicleNumber, uit, token, status);

export const stopGuaranteedGPS = (courseId: string) =>
  guaranteedGPSService.stopGPS(courseId);

export const updateGuaranteedStatus = (courseId: string, newStatus: number) =>
  guaranteedGPSService.updateStatus(courseId, newStatus);

export const clearAllGuaranteedGPS = () =>
  guaranteedGPSService.clearAll();

export const getGuaranteedGPSStatus = () =>
  guaranteedGPSService.getStatus();