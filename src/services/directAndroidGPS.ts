// DIRECT GPS SERVICE - Single source of truth for GPS operations  
// Uses DirectGPS Capacitor Plugin (no WebView dependency)
import { getStoredToken, getStoredVehicleNumber } from './storage';
import { logGPS, logGPSError } from './appLogger';

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
    
    // FOR STATUS 2 (START): Setup complete GPS tracking
    if (newStatus === 2) {
      console.log(`🚀 STATUS 2 (START): Setting up complete GPS tracking for ${courseId}`);
      
      // Get course data from Capacitor Preferences (consistent with login storage)
      const vehicleNumber = await getStoredVehicleNumber() || 'UNKNOWN';
      const token = await getStoredToken() || '';
      
      // Get real UIT from courses data
      const storedCourses = localStorage.getItem(`courses_${vehicleNumber}`);
      let realUIT = courseId; // fallback
      
      if (storedCourses) {
        try {
          const coursesData = JSON.parse(storedCourses);
          const foundCourse = coursesData.find((c: any) => c.id === courseId);
          if (foundCourse && foundCourse.uit) {
            realUIT = foundCourse.uit;
            console.log(`✅ Found real UIT ${realUIT} for courseId ${courseId}`);
          }
        } catch (error) {
          console.log(`⚠️ Error parsing courses, using courseId as UIT:`, error);
        }
      }
      
      // Start GPS tracking FIRST (adds to activeCourses Map)
      console.log(`📍 Starting GPS tracking for course ${courseId}`);
      await this.startTracking(courseId, vehicleNumber, realUIT, token, newStatus);
      console.log(`✅ GPS tracking started successfully for ${courseId}`);
      return; // startTracking handles everything for status 2
    }
    
    // FOR OTHER STATUSES: Get existing course or create minimal entry
    let course = this.activeCourses.get(courseId);
    if (!course && (newStatus === 3 || newStatus === 4)) {
      console.log(`🔧 Creating minimal course entry for ${courseId} with status ${newStatus}`);
      
      const vehicleNumber = await getStoredVehicleNumber() || 'UNKNOWN';
      const token = await getStoredToken() || '';
      
      // Get real UIT from courses data
      const storedCourses = localStorage.getItem(`courses_${vehicleNumber}`);
      let realUIT = courseId;
      
      if (storedCourses) {
        try {
          const coursesData = JSON.parse(storedCourses);
          const foundCourse = coursesData.find((c: any) => c.id === courseId);
          if (foundCourse && foundCourse.uit) {
            realUIT = foundCourse.uit;
          }
        } catch (error) {
          console.log(`⚠️ Error parsing courses, using courseId as UIT:`, error);
        }
      }
      
      course = { courseId, vehicleNumber, uit: realUIT, token, status: newStatus };
      this.activeCourses.set(courseId, course);
      console.log(`✅ Minimal course entry created: ${courseId}`);
    }

    if (!course) {
      console.log(`⚠️ Course ${courseId} not found - allowing status change to proceed`);
      return;
    }

    course.status = newStatus;

    try {
      // ANDROID NATIVE STATUS UPDATE: Update course status via OptimalGPSService
      console.log(`📡 Updating course status via AndroidGPS: ${courseId} → ${newStatus}`);
      
      // Update status through DirectGPS interface
      if (typeof (window as any).DirectGPS !== 'undefined' && (window as any).DirectGPS.updateGPS) {
        console.log("✅ DirectGPS interface available - calling updateGPS");
        
        const result = (window as any).DirectGPS.updateGPS(courseId, newStatus);
        
        console.log("📡 DirectGPS updateGPS result:", result);
        
        if (result === "SUCCESS") {
          console.log(`✅ Course ${courseId} status updated to ${newStatus} successfully`);
          logGPS(`Course ${courseId} status updated to ${newStatus}`);
        } else {
          console.log(`⚠️ AndroidGPS status update had issues for course ${courseId}`);
          logGPSError(`Status update failed for course ${courseId}`);
        }
      } else {
        console.log(`⚠️ DirectGPS interface not available for status update`);
        console.log("🔧 This means we're in browser - OptimalGPSService only works in APK");
        logGPSError(`Status update failed for course ${courseId} - DirectGPS not available`);
      }

      // Handle special status logic
      if (newStatus === 3) {
        console.log(`⏸️ STATUS 3 (PAUSE): GPS transmission paused for ${courseId}`);
      } else if (newStatus === 4) {
        console.log(`🛑 STATUS 4 (STOP): Scheduling course removal for ${courseId}`);
        setTimeout(() => {
          this.activeCourses.delete(courseId);
          console.log(`🧹 Course ${courseId} removed from activeCourses after STOP`);
        }, 2000);
      }

    } catch (error) {
      console.error(`❌ Error updating course status:`, error);
      logGPSError(`Error updating course ${courseId}: ${error}`);
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
    console.log(`Token: ${token.substring(0, 10)}...`);
    console.log(`Status: ${status} (${status === 2 ? 'ACTIVE' : status === 3 ? 'PAUSED' : 'OTHER'})`);
    
    // UIT validation
    if (uit && uit.startsWith('eyJ')) {
      console.error('❌ CRITICAL: UIT parameter contains JWT token!');
      console.error(`Received UIT: ${uit.substring(0, 30)}...`);
      console.error(`Expected UIT format: alphanumeric like 0Y3P670513100172`);
    } else {
      console.log('✅ UIT parameter appears correct');
    }

    const courseData: ActiveCourse = { courseId, vehicleNumber, uit, token, status };

    this.activeCourses.set(courseId, courseData);
    console.log(`📍 Course ${courseId} successfully added to activeCourses Map`);
    console.log(`📊 activeCourses Map now contains: [${Array.from(this.activeCourses.keys()).join(', ')}]`);
    console.log(`📈 Total active courses: ${this.activeCourses.size}`);

    try {
      console.log("🚀 Starting Android native GPS service via Capacitor Plugin");
      await this.startAndroidNativeService(courseData);
      console.log("✅ GPS tracking started for course", courseId, "with status", status);
      logGPS(`GPS tracking started for course ${courseId}`);
    } catch (error) {
      console.log("📱 Native GPS Plugin not ready yet - Course added to activeCourses");
      console.log("🚀 APK Environment: GPS will work when plugin becomes available");
      logGPSError(`GPS start failed for course ${courseId}: ${error}`);
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    console.log(`🛑 Stopping Android native GPS for course ${courseId}`);

    const course = this.activeCourses.get(courseId);
    if (!course) return;

    try {
      console.log('🔴 Stopping Android GPS for course:', courseId);
      await this.stopAndroidNativeService(courseId);
      console.log('✅ Android GPS stopped for course:', courseId);
      logGPS(`GPS stopped for course ${courseId}`);
    } catch (error) {
      console.log('⚠️ Native GPS Plugin stop failed - APK required for GPS functionality');
      logGPSError(`GPS stop failed for course ${courseId}: ${error}`);
    }

    this.activeCourses.delete(courseId);
    console.log("✅ Android GPS service stopped and cleaned up");
  }

  private async startAndroidNativeService(course: ActiveCourse): Promise<void> {
    console.log("🚀 Starting Android Native GPS Service via OptimalGPSService");

    try {
      // ANDROID NATIVE GPS: Use OptimalGPSService through AndroidGPS interface
      console.log(`📱 AndroidGPS: Starting OptimalGPSService for ${course.courseId}`);
      
      // Start OptimalGPSService through MainActivity DirectGPS interface
      if (typeof (window as any).DirectGPS !== 'undefined' && (window as any).DirectGPS.startGPS) {
        console.log("✅ DirectGPS interface available - calling startGPS");
        
        const result = (window as any).DirectGPS.startGPS(
          course.courseId,
          course.vehicleNumber, 
          course.uit,
          course.token,
          course.status
        );
        
        console.log("📡 DirectGPS startGPS result:", result);
        
        if (result === "SUCCESS") {
          console.log("✅ OptimalGPSService started successfully - will transmit GPS every 5 seconds");
        } else {
          console.log("⚠️ OptimalGPSService start had issues - but service may still work");
        }
      } else {
        console.log("❌ DirectGPS interface not available");
        console.log("🔧 This means we're in browser - OptimalGPSService only works in APK");
      }
      
    } catch (error) {
      console.log(`⚠️ OptimalGPSService start error: ${error}`);
      console.log("✅ Course remains active in activeCourses for retry");
    }
  }
  

  


  private async stopAndroidNativeService(courseId: string): Promise<void> {
    console.log("🛑 Stopping Android Native GPS Service via OptimalGPSService");
    console.log(`Course: ${courseId}`);

    try {
      // Stop OptimalGPSService through DirectGPS interface
      if (typeof (window as any).DirectGPS !== 'undefined' && (window as any).DirectGPS.stopGPS) {
        console.log("✅ DirectGPS interface available - calling stopGPS");
        
        const result = (window as any).DirectGPS.stopGPS(courseId);
        
        console.log("📡 DirectGPS stopGPS result:", result);
        
        if (result === "SUCCESS") {
          console.log(`✅ OptimalGPSService stopped successfully for course ${courseId}`);
        } else {
          console.log(`⚠️ OptimalGPSService stop had issues for course ${courseId}`);
        }
      } else {
        console.log("❌ DirectGPS interface not available for stop operation");
        console.log("🔧 This means we're in browser - OptimalGPSService only works in APK");
      }
      
    } catch (error) {
      console.log(`⚠️ OptimalGPSService stop error for ${courseId}: ${error}`);
    }
    
    console.log("✅ Android Native GPS service stopped and cleaned up");
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
      // Clear all web intervals
      for (const courseId of this.activeCourses.keys()) {
        const intervalKey = `gpsInterval_${courseId}`;
        if ((window as any)[intervalKey]) {
          clearInterval((window as any)[intervalKey]);
          delete (window as any)[intervalKey];
          console.log(`Stopped GPS interval for course ${courseId}`);
        }
      }
      
      // Clear all Android GPS services
      try {
        if (typeof (window as any).DirectGPS !== 'undefined' && (window as any).DirectGPS.clearAllGPS) {
          console.log("✅ DirectGPS interface available - calling clearAllGPS");
          
          const result = (window as any).DirectGPS.clearAllGPS();
          
          console.log("📡 DirectGPS clearAllGPS result:", result);
          
          if (result === "SUCCESS") {
            console.log("✅ All OptimalGPSService instances cleared successfully");
          } else {
            console.log("⚠️ AndroidGPS clearAll had issues");
          }
        } else {
          console.log("⚠️ AndroidGPS interface not available for clearAll");
        }
      } catch (error) {
        console.log("AndroidGPS cleanup failed:", error);
      }
      
      // Clear local tracking data
      this.activeCourses.clear();
      console.log("✅ All local GPS tracking data cleared");
      
    } catch (error) {
      console.error("❌ Error during logout cleanup:", error);
      // Force clear local data even if Native Plugin call fails
      this.activeCourses.clear();
    }
  }

  getServiceInfo() {
    return {
      type: 'Native GPS Plugin',
      activeCourses: Array.from(this.activeCourses.keys()),
      totalCourses: this.activeCourses.size,
      isActive: this.activeCourses.size > 0
    };
  }
}

// Export singleton instance
export const directAndroidGPSService = new DirectAndroidGPSService();

// Export functions for external use
export const startGPSTracking = (courseId: string, vehicleNumber: string, uit: string, token: string, status: number) =>
  directAndroidGPSService.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) =>
  directAndroidGPSService.stopTracking(courseId);

export const updateCourseStatus = (courseId: string, newStatus: number) =>
  directAndroidGPSService.updateCourseStatus(courseId, newStatus);

export const getActiveCourses = () =>
  directAndroidGPSService.getActiveCourses();

export const hasActiveCourses = () =>
  directAndroidGPSService.hasActiveCourses();

export const isGPSTrackingActive = () =>
  directAndroidGPSService.isTrackingActive();

export const getDirectGPSInfo = () => directAndroidGPSService.getServiceInfo();

export const logoutClearAllGPS = () =>
  directAndroidGPSService.logoutClearAll();