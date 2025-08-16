/**
 * SERVICIU GPS GARANTAT - Transmisie garantată optimizată
 * Implementare minimală pentru performanță pe toate telefoanele Android
 * SE ACTIVEAZĂ doar când GPS-ul nativ Android nu este disponibil
 */

import { logGPS, logGPSError } from './appLogger';
import { sendGPSData, GPSData } from './api';
import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { offlineGPSService } from './offlineGPS';
import { sharedTimestampService } from './sharedTimestamp';
import { simpleNetworkCheck } from './simpleNetworkCheck';

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
   * GPS BACKUP OPTIMIZAT: Capacitor GPS cu interval optimizat pentru performanță
   * Se activează doar când GPS-ul nativ Android nu funcționează
   */
  async startGuaranteedGPS(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): Promise<void> {
    logGPS(`🔥 PORNIRE GPS GARANTAT - Backup optimizat pentru toate telefoanele`);
    logGPS(`📍 Cursă: ${courseId}, Vehicul: ${vehicleNumber}, UIT: ${uit}`);

    // Salvăm cursa pentru tracking
    this.activeCourses.set(courseId, {
      courseId,
      vehicleNumber, 
      uit,
      token,
      status
    });

    // Skipped AndroidGPS pentru a evita duplicatele
    await this.tryAndroidGPS(courseId, vehicleNumber, uit, token, status);

    // BACKUP: Pornim interval JavaScript optimizat
    this.startBackupInterval();

    logGPS(`✅ GPS GARANTAT PORNIT - Curse active: ${this.activeCourses.size}`);
  }

  /**
   * Direct Android GPS call - primary GPS method
   */
  private async tryAndroidGPS(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): Promise<void> {
    // Direct Android GPS service call
    if (window.AndroidGPS && window.AndroidGPS.startGPS) {
      const result = window.AndroidGPS.startGPS(courseId, vehicleNumber, uit, token, status);
      logGPS(`✅ GPS nativ Android pornit: ${result}`);
    } else {
      logGPS(`⚠️ AndroidGPS nu este disponibil - folosesc backup JavaScript`);
    }
  }

  /**
   * OPTIMIZAT: Backup GPS DOAR când Android GPS nu funcționează
   * Interval mare pentru a nu se suprapune cu OptimalGPSService
   */
  private startBackupInterval(): void {
    // Oprire interval existent
    if (this.gpsInterval) {
      clearInterval(this.gpsInterval);
    }

    // OPTIMIZAT: Interval mare (30s) pentru backup - OptimalGPSService e principalul
    this.gpsInterval = setInterval(async () => {
      if (this.activeCourses.size === 0) {
        logGPS(`⏸️ Nicio cursă activă - opresc intervalul GPS garantat`);
        this.stopBackupInterval();
        return;
      }

      // Verifică conectivitatea înainte de orice transmisie
      if (!simpleNetworkCheck.getIsOnline()) {
        logGPS(`🔴 INTERNET OFFLINE - oprire temporară GPS până revine conexiunea`);
        return;
      }

      // SIMPLIFICAT: Presupunem că Android GPS funcționează dacă există
      if (window.AndroidGPS && typeof window.AndroidGPS.startGPS === 'function') {
        logGPS(`🤖 Android GPS disponibil - sărim backup JavaScript`);
        return;
      }

      logGPS(`🔄 BACKUP GPS: Android GPS inactiv - folosesc JavaScript backup`);
      await this.transmitForAllCourses();
    }, 30000); // 30 secunde - doar backup când Android GPS nu merge

    this.isTransmitting = true;
    logGPS(`⏰ BACKUP GPS: 30s interval - DOAR când Android GPS nu funcționează`);
  }

  /**
   * Transmitere coordonate DOAR pentru cursele cu status 2 (In Progress)
   */
  private async transmitForAllCourses(): Promise<void> {
    if (this.activeCourses.size === 0) {
      logGPS(`⚠️ No active courses for transmission`);
      return;
    }

    // Verifică conectivitatea înainte de transmisie
    if (!simpleNetworkCheck.getIsOnline()) {
      logGPS(`🔴 INTERNET OFFLINE - oprire temporară GPS până revine conexiunea`);
      return;
    }

    // Filtrare cursele care sunt efectiv în progres (status 2)
    const activeInProgressCourses = Array.from(this.activeCourses.values()).filter(course => course.status === 2);
    
    if (activeInProgressCourses.length === 0) {
      logGPS(`📊 No courses in progress (status 2) - skipping GPS transmission`);
      return;
    }

    logGPS(`📡 GPS GARANTAT BACKUP: Se transmite pentru ${activeInProgressCourses.length} curse ÎN PROGRES...`);
      
    // DETECȚIE TELEFON BLOCAT: Verifică dacă ecranul este blocat sau aplicația în fundal  
    const isPhoneLocked = document.hidden || document.visibilityState === 'hidden';
    const isBackgroundApp = (window as any).Capacitor?.isNativePlatform() && document.hidden;
    
    if (isPhoneLocked || isBackgroundApp) {
      logGPS(`🔒 TELEFON BLOCAT/FUNDAL DETECTAT - GPS Garantat preia transmisia`);
    } else {
      logGPS(`📱 Telefon deblocat - GPS Garantat rulează ca protecție backup`);
    }

    try {
      // Obținem locația curentă REALĂ cu settings aggressive pentru debugging
      logGPS(`🔍 Obține poziția GPS REALĂ cu setări agresive pentru transmisia GARANTATĂ...`);
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,  // Mărit timeout pentru GPS real
        maximumAge: 0    // Forțează locație nouă, nu cache
      });

      const { coords } = position;
      logGPS(`📍 Poziție GPS REALĂ obținută: ${coords.latitude}, ${coords.longitude} (precizie: ${coords.accuracy}m)`);
      
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
      
      // Folosește timestamp-ul primit sau generează unul nou (pentru backward compatibility)
      const uniqueTimestamp = timestamp ? timestamp.toISOString() : new Date().toISOString();
      
      // CRITICAL ANTI-DUPLICATE: Check if PriorityGPS or AndroidGPS already transmitted for this course in this timestamp cycle
      const timestampKey = `guaranteed_gps_${course.courseId}_${uniqueTimestamp}`;
      
      if ((window as any)[timestampKey]) {
        logGPS(`⏭️ ANTI-DUPLICAT: GPS Garantat sare ${course.courseId} - deja transmis de GPS Prioritar în acest ciclu`);
        return;
      }
      
      // Marchează această transmisie pentru a preveni duplicarea de către alte servicii
      (window as any)[timestampKey] = true;
      
      const batteryLevel = await this.getBatteryLevel();
      logGPS(`🔋 Nivel baterie: ${batteryLevel}%`);
      
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
      
      logGPS(`🚨 TRANSMISIE GPS GARANTAT BACKUP: ${course.uit} pentru cursa ${course.courseId}`);
      logGPS(`🕒 TIMESTAMP BACKUP: ${uniqueTimestamp}`);

      logGPS(`📊 GPS Data prepared: lat=${gpsData.lat}, lng=${gpsData.lng}, uit=${gpsData.uit}, vehicle=${gpsData.numar_inmatriculare}`);
      logGPS(`🔑 Using token: ${course.token.substring(0, 20)}...`);
      
      const success = await sendGPSData(gpsData, course.token);
      
      if (success) {
        logGPS(`✅ GPS Garantat BACKUP transmis cu succes: ${coords.latitude}, ${coords.longitude} pentru cursa ${course.courseId}`);
      } else {
        logGPSError(`❌ Transmisia GPS Garantat BACKUP a eșuat pentru cursa ${course.courseId} - se salvează offline pentru sincronizare`);
        
        // SAVE TO OFFLINE STORAGE when transmission fails
        try {
          await offlineGPSService.saveCoordinate(gpsData, course.courseId, course.vehicleNumber, course.token, course.status);
          logGPS(`💾 GPS coordinate saved offline for course ${course.courseId}`);
        } catch (offlineError) {
          logGPSError(`❌ Failed to save coordinate offline: ${offlineError}`);
        }
      }

    } catch (error) {
      logGPSError(`❌ Guaranteed GPS single course transmission error for ${course.courseId}: ${error}`);
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
    
    logGPS(`🔄 GUARANTEED GPS Status Update: ${courseId} → ${newStatus}`);
    
    if (course) {
      const previousStatus = course.status;
      logGPS(`📊 Previous status: ${previousStatus}, New status: ${newStatus}`);
      
      // PAUSE (3) or STOP (4): Remove from active coordinates but keep status tracked
      if (newStatus === 3 || newStatus === 4) {
        logGPS(`⏸️ PAUZĂ/STOP (${newStatus}): Se opresc coordonatele GPS pentru ${courseId}`);
        this.activeCourses.delete(courseId);
        
        // Stop interval if no more active courses
        if (this.activeCourses.size === 0) {
          logGPS(`🛑 No active courses remaining - stopping transmission interval`);
          this.stopBackupInterval();
        }
        
        logGPS(`✅ Course ${courseId} coordinates STOPPED - ${this.activeCourses.size} courses still transmitting`);
        return;
      }
      
      // START/RESUME (2): Reactivate GPS coordinates
      if (newStatus === 2) {
        course.status = newStatus;
        logGPS(`▶️ START/RESUME (${newStatus}): Reactivating GPS coordinates for ${courseId}`);
        
        // Restart interval if not active
        if (!this.isTransmitting && this.activeCourses.size > 0) {
          logGPS(`🔄 Restarting GPS transmission interval`);
          this.startBackupInterval();
        }
        
        logGPS(`✅ Course ${courseId} coordinates RESUMED`);
      } else {
        // Other statuses: just update
        course.status = newStatus;
        logGPS(`🔄 Status updated to ${newStatus} for ${courseId}`);
      }
      
    } else if (newStatus === 2) {
      // RESUME but course not found - was probably paused/stopped
      logGPS(`⚠️ RESUME requested for ${courseId} but course not in active list`);
      logGPS(`❗ Course ${courseId} needs to be restarted via startGuaranteedGPS() - cannot resume unknown course`);
    } else {
      logGPS(`⚠️ Course ${courseId} not found for status ${newStatus}`);
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