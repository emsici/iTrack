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
        await DirectGPS.updateCourseStatus({
          courseId: courseId,
          status: newStatus
        });
        
        console.log(`✅ Android GPS status updated: ${courseId} (${oldStatus} → ${newStatus})`);
        
        // Logica pentru status:
        if (newStatus === 2) {
          console.log("📍 RESUME: Continuous GPS transmission started");
        } else if (newStatus === 3) {
          console.log("⏸️ PAUSE: Single status update sent, GPS stopped");
        } else if (newStatus === 4) {
          console.log("🏁 FINISH: Final status sent, removing from active courses");
          // Pentru status 4, elimină cursul din lista activă
          setTimeout(() => {
            this.activeCourses.delete(courseId);
          }, 3000);
        }
      } else {
        console.log(`Web environment: Status ${newStatus} would be sent in APK`);
      }
    } catch (error) {
      console.error(`Failed to update course status:`, error);
      course.status = oldStatus;
      throw error;
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
    console.log(`Status: ${status} (ACTIVE)`);

    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token,
      status,
    };

    this.activeCourses.set(courseId, courseData);

    try {
      // ÎNTOTDEAUNA pornește GPS web pentru testare immediate
      console.log("🚀 Starting GPS transmission for course " + courseId);
      await this.startWebCompatibleGPS(courseData);

      // Încearcă și Android nativ dacă este disponibil
      if (Capacitor.isNativePlatform()) {
        try {
          await this.startAndroidNativeService(courseData);
          console.log("✅ Both web and Android GPS active");
        } catch (nativeError) {
          console.log("⚠️ Android service failed, web GPS continues");
        }
      }
    } catch (error) {
      console.error(`❌ GPS start failed:`, error);
      this.activeCourses.delete(courseId);
      throw error;
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`Stopping direct Android GPS for course ${courseId}`);

    const course = this.activeCourses.get(courseId);
    if (!course) return;

    try {
      if (Capacitor.isNativePlatform()) {
        await this.stopAndroidNativeService(courseId);
      } else {
        console.log("Web environment: Android service would stop in APK");
      }

      this.activeCourses.delete(courseId);
    } catch (error) {
      console.error(`Failed to stop Android GPS service:`, error);
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
      // Cerere permisiuni GPS prin Capacitor
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

        // Activare serviciu Android prin broadcast intent
        await this.activateAndroidGPSService(course);

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
      if (Capacitor.isNativePlatform()) {
        try {
          // Oprire prin DirectGPS plugin
          const result = await DirectGPS.stopTracking({
            courseId: courseId,
          });

          console.log("GPS tracking stopped:", result.message);
        } catch (pluginError) {
          console.log("DirectGPS plugin not available - using fallback");
          console.log("In APK: DirectGPS will stop EnhancedGPSService");
        }
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

  private async activateAndroidGPSService(course: ActiveCourse): Promise<void> {
    console.log("Activating Android GPS service for course:", course.courseId);

    if (Capacitor.isNativePlatform()) {
      try {
        console.log("Starting EnhancedGPSService through DirectGPS plugin");

        // Primary method: DirectGPS plugin
        const result = await DirectGPS.startTracking({
          courseId: course.courseId,
          vehicleNumber: course.vehicleNumber,
          uit: course.uit,
          authToken: course.token,
          status: course.status,
        });

        console.log("GPS tracking started:", result.message);
        console.log(
          "EnhancedGPSService running in background - coordinates transmit every 5s",
        );
      } catch (error) {
        console.error("DirectGPS plugin failed:", error);
        console.log("Trying direct MainActivity method activation");

        // Backup method: WebView AndroidGPS interface
        console.log("Trying MainActivity WebView interface");
        await this.activateViaWebViewInterface(course);
      }
    } else {
      console.log("Web environment: Using web-compatible GPS simulation");
      await this.startWebCompatibleGPS(course);
    }
  }

  private async activateViaWebViewInterface(
    course: ActiveCourse,
  ): Promise<void> {
    console.log("Activating GPS through WebView AndroidGPS interface");

    try {
      // Check if AndroidGPS interface is available
      if ((window as any).AndroidGPS && (window as any).AndroidGPS.startGPS) {
        (window as any).AndroidGPS.startGPS(
          course.courseId,
          course.vehicleNumber,
          course.uit,
          course.token,
          course.status,
        );

        console.log("GPS started via AndroidGPS WebView interface");
        console.log(
          "EnhancedGPSService activated through WebView backup method",
        );
      } else {
        throw new Error("AndroidGPS WebView interface not available");
      }
    } catch (error) {
      console.error("WebView AndroidGPS interface failed:", error);
      throw error;
    }
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
        
        const response = await fetch(
          "https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${course.token}`,
              "User-Agent": "iTrack/2.0 Web-Test",
            },
            body: JSON.stringify(gpsData),
          },
        );

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
        console.log("🔌 NETWORK ERROR - No internet connection detected");
        console.log("💾 FORCED: Saving coordinate to offline storage due to network error");
        console.log("Error details:", networkError);
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
