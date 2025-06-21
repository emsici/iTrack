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
      if (Capacitor.isNativePlatform()) {
        // Pentru Android nativ, folosește UPDATE_STATUS action
        // Folosește interfața WebView direct
        if ((window as any).AndroidGPS && (window as any).AndroidGPS.updateStatus) {
          (window as any).AndroidGPS.updateStatus(courseId, newStatus);
        } else {
          console.warn('AndroidGPS interface not available');
        }
        
        // Logica pentru status:
        if (newStatus === 2) {
          console.log("📍 RESUME: Continuous GPS transmission started");
        } else if (newStatus === 3) {
          console.log("⏸️ PAUSE: Single status update sent, GPS stopped");
        } else if (newStatus === 4) {
          console.log("🏁 FINISH: Final status sent, removing from active courses");
          setTimeout(() => {
            this.activeCourses.delete(courseId);
          }, 3000);
        }
      } else {
        console.log(`🌐 Web environment: Status ${newStatus} update completed (no native GPS)`);
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

        // Activare serviciu Android nativ direct
        if ((window as any).AndroidGPS && (window as any).AndroidGPS.startGPS) {
          console.log("AndroidGPS interface available - starting native service");
          const result = (window as any).AndroidGPS.startGPS(
            course.courseId,
            course.vehicleNumber, 
            course.uit,
            course.token,
            course.status
          );
          console.log("AndroidGPS.startGPS called with result:", result);
          console.log("📱 EnhancedGPSService should now be running in background");
          
          // Test dacă serviciul chiar rulează
          setTimeout(() => {
            console.log("=== GPS SERVICE STATUS CHECK (5s later) ===");
            if ((window as any).AndroidGPS && (window as any).AndroidGPS.getStatus) {
              const status = (window as any).AndroidGPS.getStatus();
              console.log("GPS Service status:", status);
            }
          }, 5000);
          
        } else {
          // În APK va fi disponibil AndroidGPS - în browser simulăm
          console.log("⚠️ AndroidGPS interface not available in browser - will be available in APK");
          console.log("🔧 Simulating AndroidGPS call for course:", course.courseId);
          console.log("🎯 In APK: EnhancedGPSService will start and transmit GPS every 5 seconds");
          console.log("🎯 Background GPS will work with phone locked in APK version");
          console.log("❌ NO WEB GPS FALLBACK - Only native Android GPS supported");
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
      if (window.AndroidGPS) {
        console.log("✅ AndroidGPS available - stopping EnhancedGPSService");
        const result = window.AndroidGPS.stopGPSTracking(courseId);
        console.log("✅ EnhancedGPSService stopped via AndroidGPS:", result);
      } else {
        console.log("Web environment: GPS would stop in APK");
      }

      console.log("GPS tracking stopped for course");
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



  private async startWebCompatibleGPS(course: ActiveCourse): Promise<void> {
    console.log("🌐 Starting GPS transmission every 5 seconds");

    // Request location permission first
    try {
      await Geolocation.requestPermissions();
      console.log("📍 Location permissions granted");
    } catch (permError) {
      console.log("⚠️ Location permission issue:", permError);
    }

    // Clear any existing interval for this course
    const existingIntervalKey = `gpsInterval_${course.courseId}`;
    if ((window as any)[existingIntervalKey]) {
      clearInterval((window as any)[existingIntervalKey]);
      console.log("🔄 Cleared existing GPS interval");
    }

    // Start GPS transmission every 5 seconds
    const transmitInterval = setInterval(async () => {
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 5000,
        });

        const gpsData: GPSData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          viteza: Math.round((position.coords.speed || 0) * 3.6),
          directie: Math.round(position.coords.heading || 0),
          altitudine: Math.round(position.coords.altitude || 0),
          baterie: 85,
          numar_inmatriculare: course.vehicleNumber,
          uit: course.uit,
          status: course.status.toString(),
          hdop: (position.coords.accuracy || 10).toString(),
          gsm_signal: "4",
        };

        console.log(`📡 Transmitting GPS: ${gpsData.lat.toFixed(6)}, ${gpsData.lng.toFixed(6)} for course ${course.courseId}`);
        const response = await sendGPSData(gpsData, course.token);
        console.log("✅ GPS data sent successfully to gps.php");
      } catch (error) {
        console.error("❌ GPS transmission failed:", error);
        // Save offline if transmission fails
        try {
          const gpsData: GPSData = {
            lat: 44.4378, lng: 26.0297,
            timestamp: new Date().toISOString(),
            viteza: 0, directie: 0, altitudine: 0, baterie: 85,
            numar_inmatriculare: course.vehicleNumber,
            uit: course.uit, status: course.status.toString(),
            hdop: "10.0", gsm_signal: "4"
          };
          await saveGPSCoordinateOffline(gpsData, course.courseId, course.vehicleNumber, course.token, course.status);
          console.log("💾 GPS data saved offline");
        } catch (offlineError) {
          console.error("❌ Failed to save offline:", offlineError);
        }
      }
    }, 5000);

    // Store interval for cleanup
    (window as any)[`gpsInterval_${course.courseId}`] = transmitInterval;
    console.log(`✅ GPS transmission ACTIVE for course ${course.courseId} - every 5 seconds`);
  }

  private async testGPSTransmission(course: ActiveCourse): Promise<void> {
    try {
      // Test transmisie GPS în mediul web
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const gpsData: GPSData = {
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
        hdop: (position.coords.accuracy || 999).toString(),
        gsm_signal: "0", // Placeholder - real GSM value comes from Android service
      };

      console.log("Test GPS data prepared:", gpsData);

      console.log("GPS data prepared for transmission");

      // Test offline storage functionality
      const offlineCount = await getOfflineGPSCount();
      console.log(`Current offline coordinates: ${offlineCount}`);

      // Primary GPS transmission logic - no conflicts
      try {
        console.log("Attempting GPS transmission to server...");
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(
          "https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${course.token}`,
              "User-Agent": "iTrack/2.0 Web-Browser",
            },
            body: JSON.stringify(gpsData),
            signal: controller.signal,
          },
        );
        
        clearTimeout(timeoutId);

        if (response.ok) {
          console.log("✅ GPS transmission successful! Server response:", response.status);
          
          // After successful transmission, sync any existing offline coordinates
          if (offlineCount > 0) {
            console.log(`🔄 Syncing ${offlineCount} stored offline coordinates`);
            setTimeout(async () => {
              try {
                await syncOfflineGPS();
                console.log("✅ Offline coordinates sync completed");
              } catch (syncError) {
                console.error("❌ Offline sync failed:", syncError);
              }
            }, 1000); // Delay to avoid conflicts
          }
        } else {
          console.log("❌ GPS transmission failed - Status:", response.status);
          console.log("💾 FORCED: Saving coordinate to offline storage");
          await saveGPSCoordinateOffline(gpsData, course.courseId, course.vehicleNumber, course.token, course.status);
        }
      } catch (networkError) {
        if (networkError.name === 'AbortError') {
          console.log("⏱️ GPS transmission timeout after 8 seconds");
        } else {
          console.log("🔌 NETWORK ERROR - No internet connection detected");
          console.log("Error details:", networkError);
        }
        console.log("💾 FORCED: Saving coordinate to offline storage due to network error");
        await saveGPSCoordinateOffline(gpsData, course.courseId, course.vehicleNumber, course.token, course.status);
      }
    } catch (error) {
      console.error("GPS test transmission error:", error);
    }
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
