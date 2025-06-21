// GPS direct Android prin Capacitor plugin - funcționează în background
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { GPSData, sendGPSData, API_BASE_URL } from './api';
import { saveGPSCoordinateOffline, syncOfflineGPS, getOfflineGPSCount } from './offlineGPS';




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

  updateCourseStatus(options: {
    courseId: string;
    status: number;
  }): Promise<{ success: boolean; message: string }>;
}

const DirectGPS = Capacitor.registerPlugin<DirectGPSPlugin>("DirectGPS");

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
    console.log(`Active courses in map: ${Array.from(this.activeCourses.keys()).join(', ')}`);
    
    let course = this.activeCourses.get(courseId);
    if (!course) {
      throw new Error(`Course ${courseId} not found in active courses - call startGPSTracking first`);
    }

    const oldStatus = course.status;
    course.status = newStatus;

    try {
      // 1. TRIMITE STATUS LA SERVER prin gps.php (cum face și VehicleScreenProfessional)
      console.log(`📡 Updating course status on server: ${courseId} → ${newStatus}`);
      const gpsPayload = {
        lat: "0.000000", // Coordonate dummy pentru status update
        lng: "0.000000",
        timestamp: new Date().toISOString(),
        viteza: 0,
        directie: 0,
        altitudine: 0,
        baterie: 100,
        numar_inmatriculare: course.vehicleNumber,
        uit: course.uit,
        status: newStatus.toString(),
        hdop: "1.0",
        gsm_signal: "4G"
      };
      
      const response = await CapacitorHttp.post({
        url: `${API_BASE_URL}/gps.php`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${course.token}`,
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        data: gpsPayload
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Server error ${response.status}: ${JSON.stringify(response.data)}`);
      }
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.log("Server response (non-JSON):", responseText);
        result = { message: responseText };
      }
      
      console.log("✅ Server status update successful:", result);

      // 2. APOI ANDROIDGPS PENTRU SIMPLE GPS SERVICE
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
      
      // Status logic pentru EnhancedGPSService:
      if (newStatus === 2) {
        console.log("📍 ACTIVE/RESUME: EnhancedGPSService continuing GPS transmission every 5s");
      } else if (newStatus === 3) {
        console.log("⏸️ PAUSE: EnhancedGPSService sends single status update then stops GPS");
      } else if (newStatus === 4) {
        console.log("🏁 STOP: EnhancedGPSService sends final status then terminates");
        // Programează ștergerea din activeCourses după terminare
        setTimeout(() => {
          this.activeCourses.delete(courseId);
          console.log(`🗑️ Course ${courseId} removed from active courses`);
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
      
      const result = (window as any).AndroidGPS.startGPS(
        course.courseId,
        course.vehicleNumber, 
        course.uit,
        course.token,
        course.status
      );
      
      if (result && result.includes("ERROR")) {
        throw new Error(`GPS failed: ${result}`);
      }
      
      console.log("Android GPS started successfully");
      return;
    }

    // DEVELOPMENT: Request Android permissions through Capacitor
    console.log("Development mode - requesting GPS permissions");
    
    try {
      const permissions = await Geolocation.requestPermissions();
      console.log("GPS permissions result:", permissions.location);
      
      // Start GPS tracking after permissions
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
          timestamp: new Date().toISOString(),
          viteza: position.coords.speed || 0,
          directie: position.coords.heading || 0,
          altitudine: position.coords.altitude || 0,
          baterie: 100, // Browser fallback
          numar_inmatriculare: course.vehicleNumber,
          uit: course.uit,
          status: "2",
          hdop: position.coords.accuracy.toString(),
          gsm_signal: "WiFi"
        };

        await sendGPSData(gpsData, course.token);
        console.log(`Browser GPS transmitted for course ${course.courseId}`);
        
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
