/**
 * SISTEM GPS PRIORITAR - Sistem de prioritate pentru transmisia GPS
 * Încearcă metodele în ordine și folosește backup doar dacă prima metodă eșuează
 * Previne transmisiile duplicate și redundanța
 * OPTIMIZAT pentru toate telefoanele Android (A31, A56, etc.)
 */

import { logGPS, logGPSError } from './appLogger';
import { sendGPSData, GPSData } from './api';
import { Geolocation } from '@capacitor/geolocation';
// Removed unused import for better performance
import { sharedTimestampService } from './sharedTimestamp';

interface GPSCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
  activeMethod: 'android' | 'capacitor' | 'javascript' | 'none';
  lastSuccessfulTransmission: string;
}

interface GPSMethod {
  name: string;
  priority: number;
  isAvailable: () => boolean;
  start: (course: GPSCourse) => Promise<boolean>;
  stop: (courseId: string) => Promise<void>;
  transmit: (course: GPSCourse) => Promise<boolean>;
}

class PriorityGPSService {
  private activeCourses: Map<string, GPSCourse> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private transmissionInterval: NodeJS.Timeout | null = null;
  private isTransmitting: boolean = false;

  /**
   * PERFORMANCE: Stop all background intervals to eliminate lag
   */
  private stopAllIntervals(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.transmissionInterval) {
      clearInterval(this.transmissionInterval);
      this.transmissionInterval = null;
    }
    this.isTransmitting = false;
    logGPS(`🛑 ALL GPS intervals stopped for performance`);
  }

  private gpsMethods: GPSMethod[] = [
    {
      name: 'Android Native',
      priority: 1,
      isAvailable: () => !!(window as any)?.AndroidGPS?.startGPS,
      start: async (course: GPSCourse) => {
        try {
          const result = (window as any).AndroidGPS.startGPS(
            course.courseId, 
            course.vehicleNumber, 
            course.uit, 
            course.token, 
            course.status
          );
          logGPS(`✅ GPS nativ Android pornit: ${result}`);
          return true;
        } catch (error) {
          logGPSError(`❌ GPS nativ Android eșuat: ${error}`);
          return false;
        }
      },
      stop: async (courseId: string) => {
        try {
          if ((window as any)?.AndroidGPS?.stopGPS) {
            (window as any).AndroidGPS.stopGPS(courseId);
          }
        } catch (error) {
          logGPSError(`❌ Oprire GPS nativ Android eșuată: ${error}`);
        }
      },
      transmit: async (course: GPSCourse) => {
        // Android Native handles transmission internally
        // We just check if it's still responding
        try {
          if ((window as any)?.AndroidGPS?.isActive) {
            return (window as any).AndroidGPS.isActive(course.courseId);
          }
          return true; // Assume active if we can't check
        } catch {
          return false;
        }
      }
    },
    {
      name: 'Capacitor Plugin',
      priority: 2,
      isAvailable: () => !!(window as any)?.CapacitorGPS,
      start: async (course: GPSCourse) => {
        try {
          const result = await (window as any).CapacitorGPS.startGPS({
            courseId: course.courseId,
            vehicleNumber: course.vehicleNumber,
            uit: course.uit,
            authToken: course.token,
            status: course.status
          });
          logGPS(`✅ GPS Capacitor pornit: ${result}`);
          return result.success || false;
        } catch (error) {
          logGPSError(`❌ GPS Capacitor eșuat: ${error}`);
          return false;
        }
      },
      stop: async (courseId: string) => {
        try {
          if ((window as any)?.CapacitorGPS?.stopGPS) {
            await (window as any).CapacitorGPS.stopGPS({ courseId });
          }
        } catch (error) {
          logGPSError(`❌ Oprire GPS Capacitor eșuată: ${error}`);
        }
      },
      transmit: async (course: GPSCourse) => {
        // Capacitor handles transmission internally
        return true;
      }
    },
    {
      name: 'JavaScript Backup',
      priority: 3,
      isAvailable: () => true, // Always available as fallback
      start: async (course: GPSCourse) => {
        logGPS(`🔥 GPS Backup JavaScript pornit pentru: ${course.courseId}`);
        return true; // JavaScript method is always available
      },
      stop: async (courseId: string) => {
        logGPS(`🛑 GPS Backup JavaScript oprit pentru: ${courseId}`);
      },
      transmit: async (course: GPSCourse) => {
        try {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 1000
          });

          const timestamp = sharedTimestampService.getSharedTimestamp();
          
          const gpsData: GPSData = {
            uit: course.uit,
            vehicleNumber: course.vehicleNumber,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: timestamp,
            accuracy: position.coords.accuracy || 0,
            speed: position.coords.speed || 0,
            bearing: position.coords.heading || 0,
            altitude: position.coords.altitude || 0
          };

          const response = await sendGPSData(gpsData, course.token);
          
          if (response.success) {
            logGPS(`✅ GPS JavaScript transmis cu succes pentru ${course.courseId}`);
            return true;
          } else {
            logGPSError(`❌ Transmisia GPS JavaScript eșuată: ${response.error}`);
            return false;
          }
        } catch (error) {
          logGPSError(`❌ Eroare GPS JavaScript: ${error}`);
          return false;
        }
      }
    }
  ];

  async startGPS(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): Promise<void> {
    logGPS(`🚀 PERFORMANCE GPS: Starting SINGLE optimal GPS method for ${courseId}`);

    // PERFORMANCE FIX: Stop ALL existing intervals first to prevent conflicts
    this.stopAllIntervals();

    const course: GPSCourse = {
      courseId,
      vehicleNumber,
      uit,
      token,
      status,
      activeMethod: 'none',
      lastSuccessfulTransmission: new Date().toISOString()
    };

    // PERFORMANCE OPTIMIZATION: Use ONLY Android Native if available (zero JavaScript overhead)
    const androidMethod = this.gpsMethods.find(m => m.name === 'Android Native');
    let methodStarted = false;
    
    if (androidMethod && androidMethod.isAvailable()) {
      logGPS(`⚡ PERFORMANCE MODE: Using ONLY Android Native GPS (no JS intervals)`);
      const success = await androidMethod.start(course);
      if (success) {
        course.activeMethod = 'android';
        methodStarted = true;
        logGPS(`✅ Android Native GPS active - ZERO UI lag expected`);
      }
    }

    // MINIMAL FALLBACK: Only if Android completely fails
    if (!methodStarted) {
      logGPS(`⚠️ Android GPS failed - using minimal Capacitor fallback`);
      const capacitorMethod = this.gpsMethods.find(m => m.name.includes('Capacitor'));
      if (capacitorMethod && capacitorMethod.isAvailable()) {
        const success = await capacitorMethod.start(course);
        if (success) {
          course.activeMethod = 'capacitor';
          methodStarted = true;
          logGPS(`✅ Capacitor GPS active as fallback`);
        }
      }
    }

    if (!methodStarted) {
      logGPSError(`❌ ALL GPS methods failed for ${courseId}`);
      throw new Error(`No GPS method available`);
    }

    this.activeCourses.set(courseId, course);
    
    // PERFORMANCE: NO background intervals if Android GPS is active
    if (course.activeMethod === 'android') {
      logGPS(`🏎️ ANDROID GPS ACTIVE: Skipping JavaScript intervals for maximum performance`);
    } else {
      // Only start minimal monitoring for fallback methods
      this.startMonitoring();
      this.startTransmissionInterval();
      logGPS(`📊 Fallback monitoring active for non-Android GPS`);
    }

    logGPS(`✅ PERFORMANCE GPS started: ${courseId} using ${course.activeMethod} - lag-free operation`);
  }

  async stopGPS(courseId: string): Promise<void> {
    const course = this.activeCourses.get(courseId);
    if (!course) {
      logGPS(`⚠️ Cursa ${courseId} nu a fost găsită pentru oprire`);
      return;
    }

    logGPS(`🛑 Oprire GPS pentru ${courseId} (metodă: ${course.activeMethod})`);

    // Stop the active method
    const activeMethod = this.gpsMethods.find(m => 
      m.name.toLowerCase().includes(course.activeMethod)
    );
    
    if (activeMethod) {
      await activeMethod.stop(courseId);
    }
    
    // CRITICAL FIX: Also stop GuaranteedGPS backup if it was running
    try {
      const { guaranteedGPSService } = await import('./garanteedGPS');
      await guaranteedGPSService.stopGPS(courseId);
      logGPS(`✅ Backup GPS Garantat oprit pentru cursa ${courseId}`);
    } catch (backupStopError) {
      logGPS(`⚠️ Oprire backup GPS Garantat eșuată (poate nu rulează): ${backupStopError}`);
    }

    this.activeCourses.delete(courseId);

    // Stop intervals if no active courses
    if (this.activeCourses.size === 0) {
      this.stopMonitoring();
      this.stopTransmissionInterval();
    }

    logGPS(`✅ GPS oprit pentru ${courseId}. Curse active: ${this.activeCourses.size}`);
  }

  async updateStatus(courseId: string, newStatus: number): Promise<void> {
    const course = this.activeCourses.get(courseId);
    if (!course) {
      logGPS(`⚠️ Course ${courseId} not found for status update`);
      return;
    }

    logGPS(`🔄 Updating status for ${courseId}: ${course.status} → ${newStatus}`);

    // Handle pause/stop - remove from active courses
    if (newStatus === 3 || newStatus === 4) {
      logGPS(`🛑 GPS PRIORITAR: PAUZĂ/STOP (${newStatus}) - Se elimină cursa ${courseId} din transmisia GPS activă`);
      await this.stopGPS(courseId);
      return;
    }

    // Update status for other cases
    course.status = newStatus;
    this.activeCourses.set(courseId, course);
    
    logGPS(`✅ Status updated for ${courseId}: ${newStatus}`);
  }

  private startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(async () => {
      for (const [courseId, course] of this.activeCourses) {
        await this.monitorCourse(course);
      }
    }, 15000); // Check every 15 seconds

    logGPS(`🔍 Monitorizare GPS pornită - verificare metode la fiecare 15 secunde`);
  }

  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logGPS(`⏹️ Monitorizare GPS oprită`);
    }
  }

  private startTransmissionInterval(): void {
    if (this.transmissionInterval || this.isTransmitting) return;

    this.transmissionInterval = setInterval(async () => {
      if (this.isTransmitting) return; // Prevent overlapping transmissions
      
      this.isTransmitting = true;
      
      try {
        const activeCourses = Array.from(this.activeCourses.values()).filter(course => course.status === 2);
        
        if (activeCourses.length > 0) {
          logGPS(`🔥 CICLU TRANSMISIE GPS PRIORITAR: ${activeCourses.length} curse active (status 2)`);
          
          for (const course of activeCourses) {
            logGPS(`📡 Transmitere GPS Prioritar pentru cursa: ${course.courseId} (UIT: ${course.uit})`);
            await this.transmitForCourse(course);
          }
        } else {
          logGPS(`⏸️ Nicio cursă activă cu status 2 - se sare transmisia GPS Prioritar`);
        }
      } finally {
        this.isTransmitting = false;
      }
    }, 5000); // Transmit every 5 seconds

    logGPS(`📡 Interval transmisie GPS pornit - la fiecare 5 secunde`);
  }

  private stopTransmissionInterval(): void {
    if (this.transmissionInterval) {
      clearInterval(this.transmissionInterval);
      this.transmissionInterval = null;
      this.isTransmitting = false;
      logGPS(`📡 Interval transmisie GPS oprit`);
    }
  }

  private async monitorCourse(course: GPSCourse): Promise<void> {
    const activeMethod = this.gpsMethods.find(m => 
      m.name.toLowerCase().includes(course.activeMethod)
    );
    
    if (!activeMethod) return;

    // Check if current method is still working
    const isWorking = await activeMethod.transmit(course);
    
    if (!isWorking) {
      logGPS(`❌ Metoda GPS ${activeMethod.name} eșuată pentru ${course.courseId}, se încearcă fallback...`);
      
      // Try to switch to next available method
      await this.switchToFallbackMethod(course);
    } else {
      course.lastSuccessfulTransmission = new Date();
    }
  }

  private async switchToFallbackMethod(course: GPSCourse): Promise<void> {
    logGPS(`🔄 Switching to fallback method for ${course.courseId}`);

    // Stop current method
    const currentMethod = this.gpsMethods.find(m => 
      m.name.toLowerCase().includes(course.activeMethod)
    );
    
    if (currentMethod) {
      await currentMethod.stop(course.courseId);
    }

    // Try next available method
    const availableMethods = this.gpsMethods
      .filter(m => m.isAvailable() && !m.name.toLowerCase().includes(course.activeMethod))
      .sort((a, b) => a.priority - b.priority);

    for (const method of availableMethods) {
      const success = await method.start(course);
      if (success) {
        course.activeMethod = method.name.toLowerCase().includes('android') ? 'android' :
                            method.name.toLowerCase().includes('capacitor') ? 'capacitor' : 'javascript';
        
        logGPS(`✅ Switched to fallback method: ${method.name} for ${course.courseId}`);
        this.activeCourses.set(course.courseId, course);
        return;
      }
    }

    logGPSError(`❌ Toate metodele fallback au eșuat pentru ${course.courseId}`);
  }

  private async transmitForCourse(course: GPSCourse): Promise<void> {
    const activeMethod = this.gpsMethods.find(m => 
      m.name.toLowerCase().includes(course.activeMethod)
    );
    
    if (!activeMethod) return;

    try {
      // CRITICAL ANTI-DUPLICATE: Check if GuaranteedGPS already transmitted for this course in this timestamp cycle
      const currentTimestamp = sharedTimestampService.getSharedTimestampISO();
      const timestampKey = `priority_gps_${course.courseId}_${currentTimestamp}`;
      
      if ((window as any)[timestampKey]) {
        logGPS(`⏭️ ANTI-DUPLICAT: GPS Prioritar sare ${course.courseId} - deja transmis de alt serviciu în acest ciclu`);
        return;
      }
      
      // Marchează această transmisie pentru a preveni duplicatele
      (window as any)[timestampKey] = true;
      
      const success = await activeMethod.transmit(course);
      if (success) {
        course.lastSuccessfulTransmission = new Date().toISOString();
        this.activeCourses.set(course.courseId, course);
        logGPS(`✅ GPS Prioritar transmis cu succes pentru ${course.courseId}`);
      }
    } catch (error) {
      logGPSError(`❌ Transmisia GPS Prioritar eșuată pentru ${course.courseId}: ${error}`);
    }
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses.keys());
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }

  async logoutClearAll(): Promise<void> {
    logGPS(`🧹 GPS PRIORITAR: Șterge toate datele GPS și oprește toate transmisiile`);
    
    // Stop all active courses
    const courseIds = Array.from(this.activeCourses.keys());
    for (const courseId of courseIds) {
      await this.stopGPS(courseId);
    }
    
    this.stopMonitoring();
    this.stopTransmissionInterval();
    this.activeCourses.clear();
    
    logGPS(`✅ GPS PRIORITAR: Toate serviciile GPS oprite și curățate`);
  }
}

export const priorityGPSService = new PriorityGPSService();