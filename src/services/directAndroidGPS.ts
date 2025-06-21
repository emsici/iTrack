// GPS direct Android prin Capacitor plugin - funcționează în background
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { GPSData, sendGPSData } from './api';
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
    
    const course = this.activeCourses.get(courseId);
    if (!course) {
      console.warn(`Course ${courseId} not found for status update`);
      return;
    }

    const oldStatus = course.status;
    course.status = newStatus;

    try {
      // EXCLUSIV AndroidGPS pentru toate operațiile
      if ((window as any).AndroidGPS && (window as any).AndroidGPS.updateStatus) {
        console.log("✅ AndroidGPS.updateStatus called for EnhancedGPSService");
        (window as any).AndroidGPS.updateStatus(courseId, newStatus);
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
      throw new Error(`Network error - verificați conexiunea la internet și permisiunile aplicației`);
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
    console.log("=== STARTING ANDROID NATIVE GPS SERVICE ===");
    console.log(`Course ID: ${course.courseId}`);
    console.log(`Vehicle: ${course.vehicleNumber}`);
    console.log(`UIT: ${course.uit}`);
    console.log(`Status: ${course.status} (${course.status === 2 ? 'ACTIVE' : course.status === 3 ? 'PAUSED' : 'OTHER'})`);
    console.log(`Token: ${course.token.substring(0, 20)}...`);

    try {
      // Cerere permisiuni GPS prin Capacitor - simplu ca înainte
      console.log("Requesting GPS permissions...");
      const permissions = await Geolocation.requestPermissions();
      console.log("GPS permissions result:", permissions);

      if (permissions.location === "granted") {
        console.log("GPS permissions granted - starting location tracking");

        // Start location tracking pentru a activa serviciul
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });

        console.log("Current position obtained:", {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        // EXCLUSIV AndroidGPS WebView interface pentru EnhancedGPSService
        if ((window as any).AndroidGPS && (window as any).AndroidGPS.startGPS) {
          console.log("✅ AndroidGPS interface available - starting EnhancedGPSService");
          const result = (window as any).AndroidGPS.startGPS(
            course.courseId,
            course.vehicleNumber, 
            course.uit,
            course.token,
            course.status
          );
          console.log("✅ EnhancedGPSService activated via AndroidGPS:", result);
          console.log("📱 Background GPS transmission every 5 seconds to gps.php");
          
        } else {
          console.log("⚠️ AndroidGPS interface not available - APK only feature");
          console.log("📱 In APK: EnhancedGPSService will start for course:", course.courseId);
          console.log("🎯 Background GPS transmission every 5 seconds with phone locked");
        }

        console.log("EnhancedGPSService activated for UIT:", course.uit);
        console.log("GPS will transmit every 5 seconds to server");
      } else {
        throw new Error("GPS permissions not granted");
      }
    } catch (error) {
      console.error("Failed to start GPS tracking:", error);
      throw error;
    }
  }

  private async stopAndroidNativeService(courseId: string): Promise<void> {
    console.log("=== STOPPING ANDROID NATIVE GPS SERVICE ===");
    console.log(`Course: ${courseId}`);

    try {
      // OPRIRE prin AndroidGPS WebView interface
      if ((window as any).AndroidGPS && (window as any).AndroidGPS.stopGPS) {
        console.log("✅ AndroidGPS available - stopping EnhancedGPSService");
        const result = (window as any).AndroidGPS.stopGPS(courseId);
        console.log("✅ EnhancedGPSService stopped via AndroidGPS:", result);
      } else {
        console.log("⚠️ AndroidGPS not available - APK only feature");
        console.log("📱 In APK: EnhancedGPSService will stop for course:", courseId);
      }

      console.log(`🛑 GPS tracking stopped for course ${courseId}`);
    } catch (error) {
      console.error("Failed to stop Android GPS service:", error);
      // Don't throw error - allow graceful degradation
      console.log("GPS stop completed with fallback");
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
        // Send logout signal to Android service to clear all data and stop GPS
        try {
          // Use DirectGPS plugin with special logout courseId
          await DirectGPS.stopTracking({ courseId: "LOGOUT_CLEAR_ALL" });
          console.log("✅ Android service notified to clear all data");
        } catch (error) {
          console.log("DirectGPS logout failed, trying WebView interface");
          
          // Fallback to WebView interface
          if ((window as any).AndroidGPS && (window as any).AndroidGPS.clearAllOnLogout) {
            (window as any).AndroidGPS.clearAllOnLogout();
            console.log("✅ WebView interface logout called");
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
      implementation: "Direct Android Intent to EnhancedGPSService",
      pluginUsed: "NONE - Direct Android service activation",
      backgroundSupport: "Full native Android background tracking",
      gpsMethod: "Android LocationManager in EnhancedGPSService.java",
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
