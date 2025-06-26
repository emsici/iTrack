// GPS direct Android prin Capacitor plugin - funcționează în background
// Uses CapacitorHttp for HTTP + AndroidGPS for native background service
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from '@capacitor/core';
import { GPSData, sendGPSData, API_BASE_URL } from './api';
import { getStoredToken, getStoredVehicleNumber } from './storage';
// Offline GPS functionality handled by Android service




// DirectGPS Plugin pentru activarea EnhancedGPSService
// Legacy interface - replaced by SimpleGPSService

// DirectGPS plugin replaced by SimpleGPSService

interface ActiveCourse {
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
}

class DirectAndroidGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();

  async updateCourseStatus(courseId: string, newStatus: number): Promise<void> {
    console.log(`=== UPDATING STATUS: ${courseId} → ${newStatus} ===`);
    console.log(`Active courses in map: [${Array.from(this.activeCourses.keys()).join(', ')}]`);
    console.log(`Total active courses: ${this.activeCourses.size}`);
    
    let course = this.activeCourses.get(courseId);
    if (!course) {
      console.log(`⚠️ Course ${courseId} not found in activeCourses Map`);
      console.log(`Available courses: [${Array.from(this.activeCourses.keys()).join(', ')}]`);
      
      // Pentru PAUSE/STOP fără START anterior, creează entry minimal
      if (newStatus === 3 || newStatus === 4) {
        console.log(`🔧 Creating minimal course entry for ${courseId} with status ${newStatus}`);
        
        // Folosește datele din localStorage sau valori default
        const vehicleNumber = localStorage.getItem('vehicleNumber') || 'UNKNOWN';
        const token = localStorage.getItem('authToken') || '';
        
        // CRITICAL FIX: Get real UIT from courses data instead of assuming courseId = UIT
        const storedCourses = localStorage.getItem(`courses_${vehicleNumber}`);
        let realUIT = courseId; // fallback to courseId
        
        if (storedCourses) {
          try {
            const coursesData = JSON.parse(storedCourses);
            const foundCourse = coursesData.find((c: any) => c.id === courseId);
            if (foundCourse && foundCourse.uit) {
              realUIT = foundCourse.uit;
              console.log(`✅ Found real UIT ${realUIT} for courseId ${courseId}`);
            } else {
              console.log(`⚠️ Using courseId ${courseId} as UIT fallback`);
            }
          } catch (error) {
            console.log(`⚠️ Error parsing courses, using courseId as UIT:`, error);
          }
        }
        
        course = {
          courseId,
          vehicleNumber,
          uit: realUIT, // Use real UIT from courses data
          token,
          status: newStatus
        };
        
        console.log(`🔧 Minimal course entry: courseId=${courseId}, UIT=${realUIT}, token=${token.substring(0, 10)}...`);
        
        this.activeCourses.set(courseId, course);
        console.log(`✅ Minimal course entry created: ${courseId}`);
      } else {
        throw new Error(`Course ${courseId} not found in active courses - call startGPSTracking first`);
      }
    }

    const oldStatus = course.status;
    course.status = newStatus;

    try {
      // 1. FIRST: Update status on server
      console.log(`📡 Updating course status on server: ${courseId} → ${newStatus}`);
      
      // Update server status prin CapacitorHttp
      // Get ALL data from real sensors
      let sensorData = {
        lat: 45.7649,
        lng: 21.2291,
        viteza: 0,
        directie: 0,
        altitudine: 0,
        baterie: 85,
        hdop: 1.2,
        gsm_signal: 4
      };

      try {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 5000
            });
          });
          
          sensorData.lat = position.coords.latitude;
          sensorData.lng = position.coords.longitude;
          
          if (position.coords.speed !== null) {
            sensorData.viteza = Math.round(position.coords.speed * 3.6);
          }
          
          if (position.coords.heading !== null) {
            sensorData.directie = Math.round(position.coords.heading);
          }
          
          if (position.coords.altitude !== null) {
            sensorData.altitudine = Math.round(position.coords.altitude);
          }
          
          if (position.coords.accuracy !== null) {
            sensorData.hdop = Math.max(1.0, position.coords.accuracy / 10);
          }
        }
      } catch (error) {
        console.log('Sensor error, using current values:', error);
      }

      // Real battery
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          sensorData.baterie = Math.round(battery.level * 100);
        } else if ('battery' in navigator) {
          const battery = (navigator as any).battery;
          sensorData.baterie = Math.round(battery.level * 100);
        }
      } catch (error) {
        // Keep current value
      }

      // Real network signal
      try {
        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
          if (connection.effectiveType === '4g') sensorData.gsm_signal = 4;
          else if (connection.effectiveType === '3g') sensorData.gsm_signal = 3;
          else if (connection.effectiveType === '2g') sensorData.gsm_signal = 2;
          else sensorData.gsm_signal = 1;
        }
      } catch (error) {
        // Keep current value
      }

      const gpsData = {
        numar_inmatriculare: course.vehicleNumber,
        uit: course.uit, // This should be UIT, not JWT token
        status: newStatus,
        lat: sensorData.lat,
        lng: sensorData.lng,
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
        viteza: sensorData.viteza,
        directie: sensorData.directie,
        altitudine: sensorData.altitudine,
        baterie: sensorData.baterie,
        hdop: sensorData.hdop,
        gsm_signal: sensorData.gsm_signal
      };
      
      // DEBUGGING: Verify UIT vs JWT token
      console.log('=== UIT vs TOKEN DEBUG ===');
      console.log('course.uit:', course.uit);
      console.log('course.token:', course.token);
      console.log('UIT starts with:', course.uit ? course.uit.substring(0, 10) : 'NULL');
      console.log('Token starts with:', course.token ? course.token.substring(0, 10) : 'NULL');
      
      if (course.uit && course.uit.startsWith('eyJ')) {
        console.error('❌ CRITICAL: course.uit contains JWT token instead of UIT!');
        console.error('This will cause database corruption');
      } else {
        console.log('✅ course.uit appears to be correct UIT format');
      }
      
      console.log('🔍 STATUS UPDATE GPS DATA:');
      console.log('- Battery level from sensors:', gpsData.baterie + '%');
      console.log('- Status:', gpsData.status);
      console.log('- Vehicle:', gpsData.numar_inmatriculare);
      console.log('- UIT:', gpsData.uit);
      // CRITICAL FIX: Use JWT token from storage for status updates
      const storedToken = await getStoredToken();
      console.log('- Token preview:', storedToken ? storedToken.substring(0, 20) + '...' : 'NULL');
      console.log('Sending to gps.php:', JSON.stringify(gpsData, null, 2));
      
      const success = await sendGPSData(gpsData, storedToken || '');
      console.log("✅ Server status update success:", success);

      // 2. THEN: Update AndroidGPS service
      if ((window as any).AndroidGPS && (window as any).AndroidGPS.updateStatus) {
        console.log("✅ AndroidGPS.updateStatus called for SimpleGPSService");
        const androidResult = (window as any).AndroidGPS.updateStatus(courseId, newStatus);
        console.log("✅ AndroidGPS result:", androidResult);
        
        if (androidResult && androidResult.includes("ERROR")) {
          throw new Error(`Android GPS service failed: ${androidResult}`);
        }
      } else {
        console.log("⚠️ AndroidGPS not available - APK only feature");
      }
      
      // Status logic pentru SimpleGPSService:
      if (newStatus === 2) {
        console.log("📍 ACTIVE/RESUME: SimpleGPSService will transmit GPS every 5s");
        console.log(`📊 GPS transmission active for course ${courseId} - coordinates will be sent to gps.php`);
      } else if (newStatus === 3) {
        console.log("⏸️ PAUSE: SimpleGPSService sends single status update then stops GPS transmission");
        console.log(`⏹️ GPS transmission paused for course ${courseId} - no coordinates sent until resumed`);
      } else if (newStatus === 4) {
        console.log("🏁 STOP: SimpleGPSService sends final status then terminates completely");
        console.log(`🛑 GPS transmission stopped for course ${courseId} - no more coordinates`);
        // Programează ștergerea din activeCourses după terminare
        setTimeout(() => {
          this.activeCourses.delete(courseId);
          console.log(`🗑️ Course ${courseId} removed from active courses Map`);
        }, 2000);
      }
    } catch (error) {
      console.error(`❌ Failed to update course status:`, error);
      course.status = oldStatus;
      throw new Error(`Eroare de conexiune - verificați endpoint-ul API`);
    }
  }

  async startTracking(
    courseId: string,
    vehicleNumber: string,
    uit: string,
    token: string,
    status: number = 2,
  ): Promise<void> {
    console.log("=== STARTING GPS TRACKING ===");
    console.log(`Course ID: ${courseId}`);
    console.log(`Vehicle: ${vehicleNumber}`);
    console.log(`UIT: ${uit}`);
    console.log(`Status: ${status} (${status === 2 ? 'ACTIVE' : status === 3 ? 'PAUSED' : 'OTHER'})`);

    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token,
      status,
    };

    this.activeCourses.set(courseId, courseData);
    console.log(`📍 Course ${courseId} successfully added to activeCourses Map`);
    console.log(`📊 activeCourses Map now contains: [${Array.from(this.activeCourses.keys()).join(', ')}]`);
    console.log(`📈 Total active courses: ${this.activeCourses.size}`);

    try {
      // FORȚARE Android GPS nativ - chiar și în browser pentru APK
      console.log("🚀 Forcing Android native GPS service (APK mode)");
      await this.startAndroidNativeService(courseData);
      console.log("✅ Android native GPS service prioritized");
    } catch (error) {
      console.error(`❌ GPS start failed completely:`, error);
      this.activeCourses.delete(courseId);
      throw error;
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`🛑 Stopping Android native GPS for course ${courseId}`);

    const course = this.activeCourses.get(courseId);
    if (!course) return;

    try {
      // FORȚARE serviciu nativ Android - chiar și în browser pentru APK
      await this.stopAndroidNativeService(courseId);
      this.activeCourses.delete(courseId);
      console.log("✅ Android GPS service stopped");
    } catch (error) {
      console.error(`❌ Failed to stop Android GPS service:`, error);
      throw error;
    }
  }

  private async startAndroidNativeService(course: ActiveCourse): Promise<void> {
    console.log("Starting Android GPS for course:", course.courseId);

    // ANDROID APK: Use native AndroidGPS interface
    if ((window as any).AndroidGPS && (window as any).AndroidGPS.startGPS) {
      console.log("Using native Android GPS service");
      console.log(`📱 Calling AndroidGPS.startGPS(${course.courseId}, ${course.vehicleNumber}, ${course.uit}, token, ${course.status})`);
      
      const result = (window as any).AndroidGPS.startGPS(
        course.courseId,
        course.vehicleNumber, 
        course.uit,
        course.token,
        course.status
      );
      
      console.log(`📱 AndroidGPS.startGPS result: ${result}`);
      
      if (result && result.includes("ERROR")) {
        throw new Error(`GPS failed: ${result}`);
      }
      
      console.log("✅ Android GPS started successfully - course should be in SimpleGPSService activeCourses Map");
      return;
    }

    // DEVELOPMENT: Request Android permissions through Capacitor
    console.log("🔧 Development mode - requesting GPS permissions");
    
    try {
      const permissions = await Geolocation.requestPermissions();
      console.log("🔧 GPS permissions result:", permissions.location);
      
      if (permissions.location !== 'granted') {
        console.warn('⚠️ GPS permissions denied, starting anyway for testing');
      }
      
      // CRITICAL: Start browser GPS tracking immediately
      console.log("🚀 STARTING BROWSER GPS TRACKING");
      this.startBrowserGPSInterval(course);
      console.log("✅ Browser GPS interval started successfully");
      this.startBrowserGPSInterval(course);
      console.log("GPS tracking started");
    } catch (error) {
      console.log("Permission request completed, starting GPS anyway");
      this.startBrowserGPSInterval(course);
    }
  }

  private async stopAndroidNativeService(courseId: string): Promise<void> {
    console.log("=== STOPPING ANDROID NATIVE GPS SERVICE ===");
    console.log(`Course: ${courseId}`);

    try {
      // PRIORITATE 1: AndroidGPS nativ (doar în APK)
      if ((window as any).AndroidGPS && (window as any).AndroidGPS.stopGPS) {
        console.log("✅ AndroidGPS available - stopping SimpleGPSService");
        const result = (window as any).AndroidGPS.stopGPS(courseId);
        console.log("✅ SimpleGPSService stopped via AndroidGPS:", result);
      } else {
        // FALLBACK pentru browser: oprește interval-ul GPS
        console.log("⚠️ AndroidGPS not available - stopping browser GPS interval");
        this.stopBrowserGPSInterval(courseId);
      }

      console.log(`🛑 GPS tracking stopped for course ${courseId}`);
    } catch (error) {
      console.error("Failed to stop GPS service:", error);
      // Don't throw error - allow graceful degradation
      console.log("GPS stop completed with fallback");
    }
  }

  private startBrowserGPSInterval(course: ActiveCourse): void {
    const intervalKey = `gpsInterval_${course.courseId}`;
    
    // Curăță interval existent dacă există
    if ((window as any)[intervalKey]) {
      clearInterval((window as any)[intervalKey]);
    }

    console.log(`Starting browser GPS interval for course ${course.courseId}`);
    
    (window as any)[intervalKey] = setInterval(async () => {
      try {
        // Verifică dacă cursul este încă activ
        const activeCourse = this.activeCourses.get(course.courseId);
        if (!activeCourse || activeCourse.status !== 2) {
          console.log(`Course ${course.courseId} no longer active, stopping interval`);
          clearInterval((window as any)[intervalKey]);
          delete (window as any)[intervalKey];
          return;
        }

        // Obține poziția curentă
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 8000,
        });

        // Transmite coordonatele la server
        const gpsData: GPSData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
          viteza: position.coords.speed || 0,
          directie: position.coords.heading || 0,
          altitudine: position.coords.altitude || 0,
          baterie: 85, // Browser fallback
          numar_inmatriculare: course.vehicleNumber,
          uit: course.uit,
          status: 2,
          hdop: Math.round(position.coords.accuracy || 1),
          gsm_signal: 5
        };

        console.log(`🚀 TRANSMITTING GPS: ${gpsData.lat}, ${gpsData.lng} for UIT: ${gpsData.uit}`);
        
        // CRITICAL FIX: Use JWT token from storage instead of course.token (UIT)
        const storedToken = await getStoredToken();
        const success = await sendGPSData(gpsData, storedToken || '');
        
        if (success) {
          console.log(`✅ GPS SUCCESS for course ${course.courseId} - UIT: ${course.uit}`);
        } else {
          console.error(`❌ GPS FAILED for course ${course.courseId} - UIT: ${course.uit}`);
        }
        
      } catch (error) {
        console.warn(`Browser GPS transmission failed for course ${course.courseId}:`, error);
      }
    }, 5000); // 5 secunde interval
  }

  private stopBrowserGPSInterval(courseId: string): void {
    const intervalKey = `gpsInterval_${courseId}`;
    
    if ((window as any)[intervalKey]) {
      clearInterval((window as any)[intervalKey]);
      delete (window as any)[intervalKey];
      console.log(`Browser GPS interval stopped for course ${courseId}`);
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
    console.log("🔴 LOGOUT - Clearing all GPS data and stopping all tracking");
    
    try {
      // Stop all web intervals first
      for (const courseId of this.activeCourses.keys()) {
        const intervalKey = `gpsInterval_${courseId}`;
        if ((window as any)[intervalKey]) {
          clearInterval((window as any)[intervalKey]);
          delete (window as any)[intervalKey];
          console.log(`Stopped GPS interval for course ${courseId}`);
        }
      }
      
      if (Capacitor.isNativePlatform()) {
        // Send logout signal to Android service via WebView interface
        if ((window as any).AndroidGPS && (window as any).AndroidGPS.clearAllOnLogout) {
          try {
            (window as any).AndroidGPS.clearAllOnLogout();
            console.log("✅ SimpleGPSService WebView interface logout called");
          } catch (error) {
            console.log("WebView logout failed:", error);
          }
        }
      }
      
      // Clear local tracking data
      this.activeCourses.clear();
      console.log("✅ All local GPS tracking data cleared");
      
    } catch (error) {
      console.error("❌ Error during logout cleanup:", error);
      // Force clear local data even if Android call fails
      this.activeCourses.clear();
    }
  }

  getServiceInfo() {
    return {
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      activeCourses: this.activeCourses.size,
      implementation: "Direct Android Intent to SimpleGPSService",
      pluginUsed: "NONE - Direct Android service activation",
      backgroundSupport: "Full native Android background tracking",
      gpsMethod: "Android LocationManager in SimpleGPSService.java",
      transmission: "OkHttp direct from Android service to server",
    };
  }
}

const directAndroidGPSService = new DirectAndroidGPSService();

export const startGPSTracking = (
  courseId: string,
  vehicleNumber: string,
  token: string,
  uit: string,
  status: number = 2,
) =>
  directAndroidGPSService.startTracking(
    courseId,
    vehicleNumber,
    uit,
    token,
    status,
  );

export const stopGPSTracking = (courseId: string) =>
  directAndroidGPSService.stopTracking(courseId);

export const getActiveCourses = () =>
  directAndroidGPSService.getActiveCourses();

export const hasActiveCourses = () =>
  directAndroidGPSService.hasActiveCourses();

export const isGPSTrackingActive = () =>
  directAndroidGPSService.isTrackingActive();

export const getDirectGPSInfo = () => directAndroidGPSService.getServiceInfo();

export const updateCourseStatus = (courseId: string, newStatus: number) =>
  directAndroidGPSService.updateCourseStatus(courseId, newStatus);

export const logoutClearAllGPS = () =>
  directAndroidGPSService.logoutClearAll();
