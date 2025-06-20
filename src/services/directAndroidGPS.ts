// GPS direct Android prin Capacitor plugin - funcționează în background
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { GPSData } from './api';
import { saveGPSCoordinateOffline, syncOfflineGPS, getOfflineGPSCount } from './offlineGPS';
import { startCourseAnalytics, updateCourseGPS, stopCourseAnalytics } from './courseAnalytics';

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
    console.log(`Updating course ${courseId} status to ${newStatus}`);

    const course = this.activeCourses.get(courseId);
    if (!course) {
      console.warn(`Course ${courseId} not found for status update`);
      return;
    }

    const oldStatus = course.status;
    course.status = newStatus;

    try {
      if (Capacitor.isNativePlatform()) {
        // Restart tracking with new status - reuses existing startTracking method
        await this.startAndroidNativeService(course);
        console.log(
          `Status updated: ${courseId} from ${oldStatus} to ${newStatus}`,
        );
      } else {
        console.log(
          `Web environment: Status would be updated to ${newStatus} in APK`,
        );
      }
    } catch (error) {
      console.error(`Failed to update course status:`, error);
      // Revert status on error
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
    console.log(
      `Starting direct Android GPS for course ${courseId}, UIT: ${uit}`,
    );

    const courseData: ActiveCourse = {
      courseId,
      vehicleNumber,
      uit,
      token,
      status,
    };

    this.activeCourses.set(courseId, courseData);

    try {
      // Start course analytics tracking
      await startCourseAnalytics(courseId, uit, vehicleNumber);
      console.log(`📊 Started analytics tracking for course: ${courseId}`);

      if (Capacitor.isNativePlatform()) {
        // Pentru Android APK - activează serviciul nativ direct
        await this.startAndroidNativeService(courseData);
      } else {
        // Pentru web - doar logging
        console.log("Web environment: Android service would start in APK");
        console.log(`GPS tracking configured for UIT: ${uit}`);
        
        // Start web-compatible GPS for development/testing
        await this.startWebCompatibleGPS(courseData);
      }
    } catch (error) {
      console.error(`Failed to start Android GPS service:`, error);
      this.activeCourses.delete(courseId);
      throw error;
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`Stopping direct Android GPS for course ${courseId}`);

    const course = this.activeCourses.get(courseId);
    if (!course) return;

    try {
      // Stop course analytics tracking
      await stopCourseAnalytics(courseId);
      console.log(`📊 Stopped analytics tracking for course: ${courseId}`);

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
    console.log(`Vehicle: ${course.vehicleNumber}`);
    console.log(`UIT: ${course.uit}`);
    console.log(`Status: ${course.status}`);

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
        console.log("GPS will transmit every 60 seconds to server");
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
          "EnhancedGPSService running in background - coordinates transmit every 60s",
        );
      } catch (error) {
        console.error("DirectGPS plugin failed:", error);
        console.log("Trying direct MainActivity method activation");

        // Backup method: WebView AndroidGPS interface
        try {
          await this.activateViaWebViewInterface(course);
        } catch (webViewError) {
          console.error("WebView interface activation failed:", webViewError);

          // Final fallback for web testing
          if (!Capacitor.isNativePlatform()) {
            await this.startWebCompatibleGPS(course);
          } else {
            throw new Error("GPS activation failed in APK - check permissions");
          }
        }
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
    console.log(
      "Starting web-compatible GPS simulation for course:",
      course.courseId,
    );

    try {
      // Request GPS permissions first
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      console.log(
        "GPS position obtained:",
        position.coords.latitude,
        position.coords.longitude,
      );
      console.log("In APK: DirectGPS plugin will activate EnhancedGPSService");
      console.log("Web simulation: GPS would transmit every 60s in background");

      // Simulate successful activation
      await this.testGPSTransmission(course);
    } catch (error) {
      console.error("GPS permission or location error:", error);
      throw new Error("GPS permissions required for tracking");
    }
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
        gsm_signal: "100",
      };

      console.log("Test GPS data prepared:", gpsData);

      // Update course analytics with GPS data
      await updateCourseGPS(
        course.courseId,
        gpsData.lat,
        gpsData.lng,
        gpsData.viteza,
        position.coords.accuracy || 0
      );

      // Test offline storage functionality
      const offlineCount = await getOfflineGPSCount();
      console.log(`Current offline coordinates: ${offlineCount}`);

      // Test HTTP transmission
      try {
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
          console.log("GPS test transmission successful!");
          console.log("Response status:", response.status);
          
          // Test sync offline coordinates
          if (offlineCount > 0) {
            await syncOfflineGPS();
          }
        } else {
          console.log("GPS test transmission failed:", response.status);
          
          // Save to offline storage when transmission fails
          await saveGPSCoordinateOffline(gpsData, course.courseId, course.vehicleNumber, course.token, course.status);
        }
      } catch (fetchError) {
        console.log("Network error during test transmission:", fetchError);
        
        // Save to offline storage when network error
        await saveGPSCoordinateOffline(gpsData, course.courseId, course.vehicleNumber, course.token, course.status);
      }
    } catch (error) {
      console.error("GPS test transmission error:", error);
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
