/**
 * PRIORITY GPS SYSTEM - Sistem de prioritate pentru transmisia GPS
 * Încearcă metodele în ordine și folosește backup doar dacă prima metodă eșuează
 * Previne transmisiile duplicate și redundanța
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
          logGPS(`✅ Android Native GPS started: ${result}`);
          return true;
        } catch (error) {
          logGPSError(`❌ Android Native GPS failed: ${error}`);
          return false;
        }
      },
      stop: async (courseId: string) => {
        try {
          if ((window as any)?.AndroidGPS?.stopGPS) {
            (window as any).AndroidGPS.stopGPS(courseId);
          }
        } catch (error) {
          logGPSError(`❌ Android Native GPS stop failed: ${error}`);
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
          logGPS(`✅ Capacitor GPS started: ${result}`);
          return result.success || false;
        } catch (error) {
          logGPSError(`❌ Capacitor GPS failed: ${error}`);
          return false;
        }
      },
      stop: async (courseId: string) => {
        try {
          if ((window as any)?.CapacitorGPS?.stopGPS) {
            await (window as any).CapacitorGPS.stopGPS({ courseId });
          }
        } catch (error) {
          logGPSError(`❌ Capacitor GPS stop failed: ${error}`);
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
        logGPS(`🔥 JavaScript Backup GPS started for: ${course.courseId}`);
        return true; // JavaScript method is always available
      },
      stop: async (courseId: string) => {
        logGPS(`🛑 JavaScript Backup GPS stopped for: ${courseId}`);
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
            logGPS(`✅ JavaScript GPS transmitted successfully for ${course.courseId}`);
            return true;
          } else {
            logGPSError(`❌ JavaScript GPS transmission failed: ${response.error}`);
            return false;
          }
        } catch (error) {
          logGPSError(`❌ JavaScript GPS error: ${error}`);
          return false;
        }
      }
    }
  ];

  async startGPS(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): Promise<void> {
    logGPS(`🎯 PRIORITY GPS: Starting GPS with intelligent method selection for ${courseId}`);

    const course: GPSCourse = {
      courseId,
      vehicleNumber,
      uit,
      token,
      status,
      activeMethod: 'none',
      lastSuccessfulTransmission: new Date().toISOString()
    };

    // Try methods in priority order
    let methodStarted = false;
    for (const method of this.gpsMethods.sort((a, b) => a.priority - b.priority)) {
      if (method.isAvailable()) {
        logGPS(`🔄 Trying GPS method: ${method.name} (Priority ${method.priority})`);
        
        const success = await method.start(course);
        if (success) {
          course.activeMethod = method.name.toLowerCase().includes('android') ? 'android' :
                              method.name.toLowerCase().includes('capacitor') ? 'capacitor' : 'javascript';
          
          logGPS(`✅ GPS method selected: ${method.name} for course ${courseId}`);
          methodStarted = true;
          break;
        } else {
          logGPS(`❌ GPS method ${method.name} failed, trying next...`);
        }
      } else {
        logGPS(`⏭️ GPS method ${method.name} not available, skipping...`);
      }
    }

    if (!methodStarted) {
      logGPSError(`❌ No GPS methods available for course ${courseId}, falling back to guaranteed GPS`);
      
      // CRITICAL FIX: If no priority method worked, use guaranteed GPS as ultimate fallback
      try {
        const { guaranteedGPSService } = await import('./garanteedGPS');
        await guaranteedGPSService.startGuaranteedGPS(courseId, vehicleNumber, uit, token, status);
        
        course.activeMethod = 'javascript';
        methodStarted = true;
        logGPS(`✅ Fallback to GuaranteedGPS successful for course ${courseId}`);
      } catch (guaranteedError) {
        logGPSError(`❌ Even GuaranteedGPS failed: ${guaranteedError}`);
        throw new Error(`All GPS methods failed including guaranteed backup`);
      }
    }

    this.activeCourses.set(courseId, course);
    
    // CRITICAL FIX: For Android Native GPS, also start GuaranteedGPS as backup
    // This ensures transmission continues when phone is locked
    if (course.activeMethod === 'android') {
      try {
        logGPS(`🔒 PHONE LOCK PROTECTION: Starting GuaranteedGPS backup for Android method`);
        const { guaranteedGPSService } = await import('./garanteedGPS');
        await guaranteedGPSService.startGuaranteedGPS(courseId, vehicleNumber, uit, token, status);
        logGPS(`✅ GuaranteedGPS backup started for Android method - phone lock protected`);
      } catch (backupError) {
        logGPSError(`⚠️ Failed to start GuaranteedGPS backup: ${backupError}`);
      }
    }
    
    // Start monitoring and transmission intervals
    this.startMonitoring();
    this.startTransmissionInterval();

    logGPS(`✅ PRIORITY GPS started for ${courseId} using ${course.activeMethod} method with backup protection`);
  }

  async stopGPS(courseId: string): Promise<void> {
    const course = this.activeCourses.get(courseId);
    if (!course) {
      logGPS(`⚠️ Course ${courseId} not found for stop`);
      return;
    }

    logGPS(`🛑 Stopping GPS for ${courseId} (method: ${course.activeMethod})`);

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
      logGPS(`✅ GuaranteedGPS backup stopped for course ${courseId}`);
    } catch (backupStopError) {
      logGPS(`⚠️ GuaranteedGPS backup stop failed (maybe not running): ${backupStopError}`);
    }

    this.activeCourses.delete(courseId);

    // Stop intervals if no active courses
    if (this.activeCourses.size === 0) {
      this.stopMonitoring();
      this.stopTransmissionInterval();
    }

    logGPS(`✅ GPS stopped for ${courseId}. Active courses: ${this.activeCourses.size}`);
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

    logGPS(`🔍 GPS monitoring started - checking methods every 15 seconds`);
  }

  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logGPS(`⏹️ GPS monitoring stopped`);
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
          logGPS(`🔥 PRIORITY GPS TRANSMISSION CYCLE: ${activeCourses.length} active courses (status 2)`);
          
          for (const course of activeCourses) {
            logGPS(`📡 Transmitting Priority GPS for course: ${course.courseId} (UIT: ${course.uit})`);
            await this.transmitForCourse(course);
          }
        } else {
          logGPS(`⏸️ No active courses with status 2 - skipping Priority GPS transmission`);
        }
      } finally {
        this.isTransmitting = false;
      }
    }, 5000); // Transmit every 5 seconds

    logGPS(`📡 GPS transmission interval started - every 5 seconds`);
  }

  private stopTransmissionInterval(): void {
    if (this.transmissionInterval) {
      clearInterval(this.transmissionInterval);
      this.transmissionInterval = null;
      this.isTransmitting = false;
      logGPS(`📡 GPS transmission interval stopped`);
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
      logGPS(`❌ GPS method ${activeMethod.name} failed for ${course.courseId}, trying fallback...`);
      
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

    logGPSError(`❌ All fallback methods failed for ${course.courseId}`);
  }

  private async transmitForCourse(course: GPSCourse): Promise<void> {
    const activeMethod = this.gpsMethods.find(m => 
      m.name.toLowerCase().includes(course.activeMethod)
    );
    
    if (!activeMethod) return;

    try {
      const success = await activeMethod.transmit(course);
      if (success) {
        course.lastSuccessfulTransmission = new Date().toISOString();
        this.activeCourses.set(course.courseId, course);
      }
    } catch (error) {
      logGPSError(`❌ Transmission failed for ${course.courseId}: ${error}`);
    }
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses.keys());
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }

  async logoutClearAll(): Promise<void> {
    logGPS(`🧹 PRIORITY GPS: Clearing all GPS data and stopping all transmissions`);
    
    // Stop all active courses
    const courseIds = Array.from(this.activeCourses.keys());
    for (const courseId of courseIds) {
      await this.stopGPS(courseId);
    }
    
    this.stopMonitoring();
    this.stopTransmissionInterval();
    this.activeCourses.clear();
    
    logGPS(`✅ PRIORITY GPS: All GPS services stopped and cleared`);
  }
}

export const priorityGPSService = new PriorityGPSService();