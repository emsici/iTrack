import React, { useState, useEffect } from "react";
// Removed CapacitorHttp - using fetch for all HTTP requests
import { Course } from "../types";
import { getVehicleCourses, logout, API_BASE_URL } from "../services/api";
import {
  startGPSTracking,
  stopGPSTracking,
  updateCourseStatus,
  logoutClearAllGPS,
  hasActiveCourses,
  getActiveCourses,
} from "../services/directAndroidGPS";
import { clearToken, storeVehicleNumber, getStoredVehicleNumber } from "../services/storage";
import { getOfflineGPSCount } from "../services/offlineGPS";
import { getAppLogs, logAPI, logAPIError } from "../services/appLogger";
import { startCourseAnalytics, stopCourseAnalytics } from "../services/courseAnalytics";


import CourseStatsModal from "./CourseStatsModal";
import CourseDetailCard from "./CourseDetailCard";

interface VehicleScreenProps {
  token: string;
  onLogout: () => void;
}

const VehicleScreen: React.FC<VehicleScreenProps> = ({ token, onLogout }) => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [infoClickCount, setInfoClickCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Load stored vehicle number on component mount
  useEffect(() => {
    const loadStoredVehicleNumber = async () => {
      try {
        const storedVehicle = await getStoredVehicleNumber();
        if (storedVehicle) {
          setVehicleNumber(storedVehicle);
          console.log('Loaded stored vehicle number:', storedVehicle);
        }
      } catch (error) {
        console.error('Error loading stored vehicle number:', error);
      }
    };
    
    loadStoredVehicleNumber();
    
    // Listen for background refresh events from Android
    const handleBackgroundRefresh = () => {
      console.log('Background refresh event received from Android');
      if (vehicleNumber && token && coursesLoaded) {
        // Background refresh handled by Android service
      }
    };
    
    window.addEventListener('backgroundRefresh', handleBackgroundRefresh);
    
    return () => {
      window.removeEventListener('backgroundRefresh', handleBackgroundRefresh);
    };
  }, [vehicleNumber, token, coursesLoaded]);

  const handleLoadCourses = async () => {
    if (!vehicleNumber.trim()) {
      setError("Introduceți numărul vehiculului");
      return;
    }

    if (!isOnline || !navigator.onLine) {
      console.log("🔌 No internet connection - cannot load courses");
      setError("Nu există conexiune la internet. Cursele nu pot fi încărcate.");
      return;
    }

    console.log("=== APK DEBUG: Starting course loading process ===");
    console.log("=== APK DEBUG: Vehicle number:", vehicleNumber);
    console.log("=== APK DEBUG: Token available:", !!token);
    console.log("=== APK DEBUG: Current coursesLoaded state:", coursesLoaded);
    
    setLoading(true);
    setError("");
    
    try {
      // Store vehicle number for persistence
      await storeVehicleNumber(vehicleNumber.trim());
      
      console.log(`=== DEBUGGING: Loading courses for vehicle: ${vehicleNumber} ===`);
      const response = await getVehicleCourses(vehicleNumber, token);
      
      // Handle API response format
      let coursesArray = [];
      
      if (Array.isArray(response)) {
        coursesArray = response;
      } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
        coursesArray = response.data;
      } else if (response && typeof response === 'object' && response.data) {
        coursesArray = [response.data];
      } else if (response && typeof response === 'object') {
        coursesArray = [response];
      }

      console.log("Courses found:", coursesArray.length);

      if (coursesArray.length > 0) {
        const mergedCourses = coursesArray.map((newCourse: Course) => {
          const existingCourse = courses.find((c) => c.id === newCourse.id);
          
          // Restore saved status from localStorage
          let savedStatus = newCourse.status || 1; // Default to available
          try {
            const statusKey = `course_status_${newCourse.uit}`;
            const storedStatus = localStorage.getItem(statusKey);
            if (storedStatus) {
              savedStatus = parseInt(storedStatus);
              console.log(`📋 Restored status ${savedStatus} for UIT ${newCourse.uit}`);
            }
          } catch (error) {
            console.error('Failed to restore course status:', error);
          }
          
          return existingCourse
            ? { ...newCourse, status: savedStatus }
            : { ...newCourse, status: savedStatus, isNew: true }; // Mark new courses
        });

        // Sort: new courses first, then existing ones
        const sortedCourses = mergedCourses.sort((a: Course, b: Course) => {
          // New courses (isNew = true) go first
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          
          // Within same group, sort by status priority: 2 (active) > 3 (paused) > 1 (available) > 4 (finished)
          const statusPriority = { 2: 4, 3: 3, 1: 2, 4: 1 };
          return (statusPriority[b.status as keyof typeof statusPriority] || 0) - (statusPriority[a.status as keyof typeof statusPriority] || 0);
        });

        // Clean up isNew flag after sorting
        const finalCourses = sortedCourses.map((course: Course) => {
          const { isNew, ...cleanCourse } = course;
          return cleanCourse;
        });

        setCourses(finalCourses);
        setError("");
        setCoursesLoaded(true);
        
        // Update last refresh timestamp
        setLastRefreshTime(new Date());
        
        // Setup robust auto-refresh for Android (works with phone locked)
        if (autoRefreshInterval) {
          clearInterval(autoRefreshInterval);
        }
        
        // Create persistent interval that survives app minimizing/screen lock
        const createRobustInterval = () => {
          return setInterval(async () => {
            const currentTime = new Date();
            console.log(`[${currentTime.toLocaleTimeString()}] Auto-refresh starting (Android background)...`);
            
            try {
              const response = await getVehicleCourses(vehicleNumber, token);
              if (response && Array.isArray(response)) {
                // Capture current state to avoid race conditions
                setCourses(currentCourses => {
                  const existingUITs = new Set(currentCourses.map(course => course.uit));
                  
                  // Process new courses and mark new ones
                  const newCoursesData = response.map((course: any) => ({
                    ...course,
                    isNew: !existingUITs.has(course.uit) // Mark as new if UIT doesn't exist
                  }));
                  
                  // Sort: new courses first, then existing ones
                  const sortedCourses = newCoursesData.sort((a: Course, b: Course) => {
                    if (a.isNew && !b.isNew) return -1;
                    if (!a.isNew && b.isNew) return 1;
                    return 0;
                  });
                  
                  const newCount = newCoursesData.filter((c: Course) => c.isNew).length;
                  if (newCount > 0) {
                    console.log(`🆕 Auto-refresh: ${newCount} new UIT courses added (may be background)`);
                  } else {
                    console.log(`✅ Auto-refresh: ${sortedCourses.length} courses updated (no new UITs)`);
                  }
                  
                  return sortedCourses;
                });
                
                setLastRefreshTime(new Date());
              }
            } catch (error) {
              console.log('Auto-refresh failed (will retry in 5 minutes):', error);
            }
          }, 5 * 60 * 1000); // 5 minutes
        };
        
        const interval = createRobustInterval();
        setAutoRefreshInterval(interval);
        
        console.log('🔄 Android background auto-refresh activated (5 min intervals)');
        
        console.log(`Successfully loaded ${finalCourses.length} courses for ${vehicleNumber} (sorted: new first)`);
        
        // Log new courses found
        const newCoursesCount = mergedCourses.filter((c: Course) => c.isNew).length;
        if (newCoursesCount > 0) {
          console.log(`🆕 Found ${newCoursesCount} new courses - displayed at top`);
        }
      } else {
        console.log("=== APK DEBUG: No courses found - BLOCKING access ===");
        // IMPORTANT: Nu setează coursesLoaded = true când nu există curse
        // Rămâne pe ecranul de input cu mesaj de eroare
        setCourses([]);
        setCoursesLoaded(false); // Force rămâne pe input screen
        setError("Nu s-au găsit curse pentru acest vehicul. Verificați numărul de înmatriculare și încercați din nou.");
        console.log("=== APK DEBUG: User blocked - must enter valid vehicle number ===");
      }
    } catch (error: any) {
      console.error("=== APK DEBUG: Error loading courses ===", error);
      console.log("=== APK DEBUG: ERROR - Blocking user due to API error ===");
      // SCHIMBARE: Pe eroare, nu trece utilizatorul mai departe
      setCoursesLoaded(false); // Rămâne pe input screen
      setCourses([]);
      setError(error.message || "Eroare la conectarea la server. Verificați conexiunea și încercați din nou.");
    } finally {
      setLoading(false);
      console.log("=== APK DEBUG: Loading finished ===");
      // ELIMINAT: Nu mai forțez coursesLoaded = true dacă nu există curse valide
    }
  };

  const handleLogout = async () => {
    try {
      await logoutClearAllGPS();
      await logout(token);
      await clearToken();
      
      // Clear all saved course statuses on logout
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('course_status_')) {
            localStorage.removeItem(key);
            console.log(`🧹 Cleared saved status for ${key}`);
          }
        });
      } catch (error) {
        console.error('Failed to clear course statuses:', error);
      }
      
      onLogout();
    } catch (error) {
      console.error("Eroare la logout:", error);
      onLogout();
    }
  };

  const handleTimestampClick = async () => {
    setClickCount(prev => prev + 1);
    const newCount = infoClickCount + 1;
    setInfoClickCount(newCount);
    
    if (newCount === 50) {
      try {
        const logs = await getAppLogs();
        setDebugLogs(logs);
        setShowDebugPanel(true);
        setInfoClickCount(0);
      } catch (error) {
        console.error("Error loading debug logs:", error);
        setShowDebugPanel(true);
        setInfoClickCount(0);
      }
    }
  };

  const handleStatusUpdate = async (courseId: string, newStatus: number) => {
    setActionLoading(courseId);

    try {
      const courseToUpdate = courses.find((c) => c.id === courseId);
      if (!courseToUpdate) {
        console.error("Course not found:", courseId);
        return;
      }

      // Update course status immediately in UI for responsive feel
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, status: newStatus }
            : course
        )
      );

      // Store the status in localStorage for persistence
      try {
        const statusKey = `course_status_${courseToUpdate.uit}`;
        localStorage.setItem(statusKey, newStatus.toString());
        console.log(`💾 Saved status ${newStatus} for UIT ${courseToUpdate.uit}`);
      } catch (error) {
        console.error('Failed to save course status:', error);
      }

      console.log(`=== STATUS UPDATE START ===`);
      console.log(`Course: ${courseId}, Status: ${courseToUpdate.status} → ${newStatus}`);
      console.log(`UIT REAL: ${courseToUpdate.uit}, Vehicle: ${vehicleNumber}`);
      console.log(`Token available: ${!!token}, Token length: ${token?.length || 0}`);

      // Update server status first
      try {
        // Use gps.php with GPS payload format but status update
        const gpsUrl = `${API_BASE_URL}/gps.php`;
        console.log(`🔄 Sending status update to gps.php: ${gpsUrl}`);
        
        const gpsPayload = {
          lat: "0.000000", // Dummy coordinates for status update
          lng: "0.000000",
          timestamp: new Date().toISOString(),
          viteza: 0,
          directie: 0,
          altitudine: 0,
          baterie: 100,
          numar_inmatriculare: vehicleNumber,
          uit: courseToUpdate.uit,
          status: newStatus.toString(),
          hdop: "1.0",
          gsm_signal: "4G"
        };
        
        console.log(`📦 GPS Status payload:`, gpsPayload);
        
        // Try native HTTP first - PURE JAVA EFFICIENCY
        let response;
        console.log('🔍 Checking AndroidGPS availability:', typeof (window as any).AndroidGPS);
        console.log('🔍 postNativeHttp function:', typeof (window as any).AndroidGPS?.postNativeHttp);
        console.log('🔍 All AndroidGPS methods:', Object.keys((window as any).AndroidGPS || {}));
        
        // FORCE AndroidGPS check - ensure we use native HTTP in APK
        if ((window as any).AndroidGPS && typeof (window as any).AndroidGPS.postNativeHttp === 'function') {
          console.log('🔥 Using native HTTP for status update - PURE JAVA');
          console.log('📤 Sending payload:', JSON.stringify(gpsPayload));
          console.log('🔑 Using token:', token.substring(0, 20) + '...');
          
          const nativeResult = (window as any).AndroidGPS.postNativeHttp(
            gpsUrl,
            JSON.stringify(gpsPayload),
            token // Bearer prefix added automatically in Java
          );
          console.log('📱 Native HTTP result:', nativeResult);
          response = { status: 204, data: nativeResult }; // Assume success for native calls
        } else {
          console.log('⚠️ Falling back to CapacitorHttp (browser development mode)');
          // Fallback to CapacitorHttp only in browser
          response = await CapacitorHttp.post({
            url: gpsUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
            data: gpsPayload
          });
        }

        console.log(`📡 Response status: ${response.status}`);
        console.log(`📋 Response headers:`, response.headers);
        
        // Accept status 200, 201, 204 as success (204 is common for GPS updates)
        if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
          console.error(`❌ Server error ${response.status}:`, response.data);
          console.error(`🔍 Full response:`, {
            status: response.status,
            headers: response.headers,
            body: response.data
          });
          throw new Error(`Server error ${response.status}: ${JSON.stringify(response.data)}`);
        }

        console.log(`📥 Response data:`, response.data);
        
        // For status 204 (No Content), there's no response data to check
        if (response.status === 204) {
          console.log(`✅ Status update sent successfully (204 No Content) for UIT: ${courseToUpdate.uit}`);
          logAPI(`Status update success: Course ${courseId} → Status ${newStatus}`);
        } else {
          // For other successful statuses, check response data
          const result = response.data;
          if (result && result.status !== 'success' && !result.success) {
            throw new Error(result.message || result.error || 'Server rejected status update');
          }
          console.log(`✅ Status update sent successfully for UIT: ${courseToUpdate.uit}`);
          logAPI(`Status update success: Course ${courseId} → Status ${newStatus}`);
        }
      } catch (fetchError) {
        console.error(`❌ Network/Fetch error:`, fetchError);
        console.error(`🔍 Error details:`, {
          name: (fetchError as Error).name,
          message: (fetchError as Error).message,
          stack: (fetchError as Error).stack
        });
        
        const error = fetchError as Error;
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - server nu răspunde în 10 secunde');
        }
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.error(`🚫 Network fetch failed`);
          console.error(`📶 Navigator online: ${navigator.onLine}`);
          throw new Error(`Conexiune server eșuată - verificați endpoint-ul API`);
        }
        // Check if it's a 401 Unauthorized error (token expired)
        if (error.message.includes('401')) {
          console.error('🔐 Token expired - redirecting to login');
          logAPIError('Token expired - redirecting to login');
          await clearToken();
          onLogout();
          return;
        }
        
        throw new Error(`Network error: ${error.message}`);
      }

      // Update GPS service (non-blocking)
      try {
        if (newStatus === 2) {
          console.log(`Starting/Resuming GPS tracking for course ${courseId}`);
          await startGPSTracking(courseId, vehicleNumber, token, courseToUpdate.uit, newStatus);
          await startCourseAnalytics(courseId, courseToUpdate.uit, vehicleNumber);
        } else if (newStatus === 3) {
          console.log(`Pausing GPS tracking for course ${courseId}`);
          // Ensure course is active before PAUSE
          if (!hasActiveCourses() || !getActiveCourses().includes(courseId)) {
            console.log(`Course ${courseId} not active - starting first for PAUSE`);
            await startGPSTracking(courseId, vehicleNumber, token, courseToUpdate.uit, 2);
          }
          await updateCourseStatus(courseId, newStatus);
        } else if (newStatus === 4) {
          console.log(`Stopping GPS tracking for course ${courseId}`);
          // Ensure course is active before STOP
          if (!hasActiveCourses() || !getActiveCourses().includes(courseId)) {
            console.log(`Course ${courseId} not active - starting first for STOP`);
            await startGPSTracking(courseId, vehicleNumber, token, courseToUpdate.uit, 2);
          }
          await updateCourseStatus(courseId, newStatus);
          await stopGPSTracking(courseId);
          await stopCourseAnalytics(courseId);
        }
      } catch (gpsError) {
        console.warn('GPS service error (non-critical):', gpsError);
        logAPIError(`GPS service warning: ${gpsError}`);
        // GPS errors are non-blocking - UI continues normally
      }

      // Update local state
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === courseId ? { ...course, status: newStatus } : course
        )
      );

      logAPI(`Course ${courseId} status updated successfully to ${newStatus}`);
      console.log(`=== STATUS UPDATE COMPLETE ===`);
    } catch (error) {
      console.error("Status update error:", error);
      logAPIError(`Status update failed: ${error}`);
      
      // Use setError instead of alert for better UX
      const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
      setError(`Actualizare status: ${errorMessage}`);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Removed unused function

  // Update time display every 30 seconds
  const [, forceUpdate] = useState({});
  useEffect(() => {
    if (!lastRefreshTime) return;
    
    const interval = setInterval(() => {
      forceUpdate({});
    }, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [lastRefreshTime]);

  // Monitor offline GPS count
  useEffect(() => {
    const updateOfflineCount = async () => {
      try {
        await getOfflineGPSCount();
        // Offline count updated
      } catch (error) {
        console.error("Error getting offline count:", error);
      }
    };

    updateOfflineCount();
    const interval = setInterval(updateOfflineCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Course actions handled by CourseDetailCard component


  // SIMPLIFICARE: Elimină logica complexă și folosește doar coursesLoaded

  // ELIMINAT: Fallback timer care forța coursesLoaded
  // Utilizatorul trebuie să introducă un număr valid de vehicul

  return (
    <div className={`vehicle-screen ${coursesLoaded ? "courses-loaded" : ""}`}>
      {!coursesLoaded ? (
        <div style={{
          minHeight: '100dvh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #374151 100%)',
          backgroundAttachment: 'fixed',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <style>
            {`
              .vehicle-input-container {
                background: linear-gradient(135deg, 
                  rgba(15, 23, 42, 0.95) 0%,
                  rgba(30, 41, 59, 0.95) 100%);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 60px 40px;
                width: 100%;
                max-width: 480px;
                box-shadow: 
                  0 8px 32px rgba(0, 0, 0, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1);
                position: relative;
                margin: 0 auto;
              }
              
              .vehicle-input-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
                border-radius: 24px;
                pointer-events: none;
              }

              .vehicle-brand-section {
                text-align: center;
                margin-bottom: 48px;
                position: relative;
                z-index: 2;
              }

              .vehicle-logo-emblem {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 36px;
                margin: 0 auto 24px;
                box-shadow: 
                  0 8px 32px rgba(14, 165, 233, 0.4),
                  0 4px 16px rgba(14, 165, 233, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
              }

              .vehicle-brand-title {
                font-size: 32px;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 8px;
                letter-spacing: -0.5px;
              }

              .vehicle-brand-subtitle {
                font-size: 16px;
                color: #94a3b8;
                font-weight: 400;
              }

              .vehicle-form-group {
                position: relative;
                z-index: 2;
                margin-bottom: 32px;
              }

              .vehicle-input-field {
                width: 100%;
                padding: 18px 24px 18px 60px;
                background: rgba(30, 41, 59, 0.6);
                border: 2px solid rgba(148, 163, 184, 0.2);
                border-radius: 16px;
                color: #ffffff;
                font-size: 16px;
                font-weight: 500;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                outline: none;
                letter-spacing: 1px;
                text-transform: uppercase;
              }

              .vehicle-input-field::placeholder {
                color: #64748b;
                font-weight: 400;
                text-transform: none;
                letter-spacing: normal;
              }

              .vehicle-input-field:focus {
                border-color: #0ea5e9;
                background: rgba(30, 41, 59, 0.8);
                box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
                transform: translateY(-2px);
              }

              .vehicle-input-icon {
                position: absolute;
                left: 24px;
                top: 50%;
                transform: translateY(-50%);
                color: #64748b;
                font-size: 18px;
                z-index: 3;
                transition: color 0.3s ease;
              }

              .vehicle-input-field:focus + .vehicle-input-icon {
                color: #0ea5e9;
              }

              .vehicle-submit-button {
                width: 100%;
                padding: 18px 32px;
                background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
                border: none;
                border-radius: 16px;
                color: white;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 16px rgba(14, 165, 233, 0.3);
                position: relative;
                overflow: hidden;
              }

              .vehicle-submit-button:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 32px rgba(14, 165, 233, 0.4);
              }

              .vehicle-submit-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
              }

              .vehicle-error-message {
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 12px;
                padding: 16px 20px;
                color: #fca5a5;
                font-size: 14px;
                margin-top: 16px;
                text-align: center;
                backdrop-filter: blur(10px);
              }

              .debug-counter {
                position: absolute;
                bottom: 20px;
                right: 20px;
                color: #64748b;
                font-size: 12px;
                cursor: pointer;
                z-index: 10;
              }

              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }

              .spinning {
                animation: spin 1s linear infinite;
              }
            `}
          </style>

          {/* Background Effects */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, rgba(15, 23, 42, 0.8) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(55, 65, 81, 0.4) 0%, transparent 50%)
            `,
            pointerEvents: 'none'
          }} />

          <div className="vehicle-input-container">
            <div className="vehicle-brand-section" onClick={handleTimestampClick}>
              <div className="vehicle-logo-emblem">
                <i className="fas fa-truck"></i>
              </div>
              <div className="vehicle-brand-title">iTrack</div>
              <div className="vehicle-brand-subtitle">Monitorizare GPS Profesională</div>
            </div>

            <div className="vehicle-form-group">
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="vehicle-input-field"
                  placeholder="Introduceți numărul de înmatriculare"
                  value={vehicleNumber}
                  onChange={(e) => {
                    const cleanValue = e.target.value
                      .replace(/[^A-Za-z0-9]/g, "")
                      .toUpperCase();
                    setVehicleNumber(cleanValue);
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleLoadCourses()}
                />
                <i className="fas fa-truck vehicle-input-icon"></i>
              </div>
              
              <button
                className="vehicle-submit-button"
                onClick={handleLoadCourses}
                disabled={loading || !vehicleNumber.trim()}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner spinning" style={{ marginRight: '12px' }}></i>
                    Se încarcă cursele...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search" style={{ marginRight: '12px' }}></i>
                    Încarcă Cursele
                  </>
                )}
              </button>

              {error && <div className="vehicle-error-message">{error}</div>}
            </div>
          </div>

          {/* Debug Counter */}
          {clickCount >= 30 && (
            <div className="debug-counter">
              {clickCount}/50
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="corporate-header-professional loaded">
            <div className="header-brand-section">
              <div className="brand-logo-container" onClick={handleTimestampClick}>
                <div className="logo-emblem">
                  <i className="fas fa-truck"></i>
                </div>
                <div className="brand-text">
                  <span className="brand-name">iTrack</span>
                </div>
              </div>
            </div>
            
            <div className="header-vehicle-info">
              <div className="vehicle-number-badge" onClick={() => setCoursesLoaded(false)} title="Schimbă vehiculul">
                <i className="fas fa-truck vehicle-icon"></i>
                <span className="vehicle-number">{vehicleNumber}</span>
                <i className="edit-icon fas fa-edit"></i>
              </div>
              
              <div className="logout-button-card" onClick={handleLogout} title="Logout">
                <i className="fas fa-sign-out-alt"></i>
              </div>
            </div>
            
            {/* Debug counter - positioned below cards for better visibility */}
            <div 
              className="debug-timestamp-area"
              onClick={handleTimestampClick}
              style={{
                textAlign: 'center',
                padding: '8px 16px',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {infoClickCount >= 30 && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(239, 68, 68, 0.9))',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'inline-block',
                  border: '2px solid rgba(220, 38, 38, 0.6)',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                  animation: infoClickCount >= 45 ? 'glow 1.5s infinite' : 'pulse 2s infinite',
                  letterSpacing: '0.5px',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}>
                  🐛 DEBUG: {infoClickCount}/50
                </div>
              )}
              
              {/* Invisible clickable area for debug activation */}
              {infoClickCount < 30 && (
                <div style={{
                  height: '20px',
                  width: '100%',
                  opacity: 0
                }}>
                  &nbsp;
                </div>
              )}
            </div>

            <div className="hidden-for-debug">
              <div className="online-status-display">
                <div 
                  className="status-indicator-wrapper"
                  onClick={handleTimestampClick}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`status-indicator ${isOnline ? "online" : "offline"}`}></div>
                  <span className="status-text">{isOnline ? "Online" : "Offline"}</span>
                  {/* Offline count handled by Android service */}

                </div>
                
                {/* Sync progress handled by Android service */}
              </div>

            </div>

            <div className="header-actions">
              <button
                className="header-logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>

          <div className="courses-section">
            <div className="executive-control-center">
              <div className="command-dashboard">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  maxWidth: '320px',
                  margin: '0 auto',
                  padding: '0 10px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '6px',
                    padding: '6px 2px',
                    textAlign: 'center',
                    minHeight: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      lineHeight: '1'
                    }}>{courses.length}</div>
                    <div style={{
                      fontSize: '0.5rem',
                      color: '#94a3b8',
                      fontWeight: '600',
                      letterSpacing: '0.2px',
                      textTransform: 'uppercase',
                      lineHeight: '1'
                    }}>TOTAL</div>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    borderRadius: '12px',
                    padding: '16px 12px',
                    textAlign: 'center',
                    minHeight: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(34, 197, 94, 0.08)'
                  }}>
                    <div style={{
                      fontSize: '1.4rem',
                      fontWeight: '800',
                      color: '#22c55e',
                      lineHeight: '1',
                      marginBottom: '4px'
                    }}>{courses.filter(c => c.status === 2).length}</div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#64748b',
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      lineHeight: '1'
                    }}>ACTIV</div>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    borderRadius: '12px',
                    padding: '16px 12px',
                    textAlign: 'center',
                    minHeight: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(251, 191, 36, 0.08)'
                  }}>
                    <div style={{
                      fontSize: '1.4rem',
                      fontWeight: '800',
                      color: '#f59e0b',
                      lineHeight: '1',
                      marginBottom: '4px'
                    }}>{courses.filter(c => c.status === 3).length}</div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#64748b',
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      lineHeight: '1'
                    }}>PAUZĂ</div>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '12px',
                    padding: '16px 12px',
                    textAlign: 'center',
                    minHeight: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(168, 85, 247, 0.08)'
                  }}>
                    <div style={{
                      fontSize: '1.4rem',
                      fontWeight: '800',
                      color: '#a855f7',
                      lineHeight: '1',
                      marginBottom: '4px'
                    }}>{courses.filter(c => c.status === 1).length}</div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#64748b',
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      lineHeight: '1'
                    }}>DISPONIBIL</div>
                  </div>
                </div>

                {courses.length > 0 ? (
                  <div className="courses-container-compact">
                    {courses.map((course) => (
                      <CourseDetailCard
                        key={course.id}
                        course={course}
                        onStatusUpdate={handleStatusUpdate}
                        isLoading={actionLoading === course.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="no-courses-message" style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#6b7280',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    margin: '20px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <i className="fas fa-truck" style={{fontSize: '48px', marginBottom: '16px', opacity: 0.5}}></i>
                    <p style={{margin: '0 0 8px 0', fontSize: '18px', fontWeight: '500'}}>Nu există curse pentru acest vehicul</p>
                    <p style={{margin: '0', fontSize: '14px', opacity: 0.7}}>Verificați numărul de înmatriculare</p>
                  </div>
                )}
                
                {error && !coursesLoaded && (
                  <div className="error-message-courses" style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    margin: '20px 16px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    <i className="fas fa-exclamation-triangle" style={{marginRight: '8px'}}></i>
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Course Statistics Modal */}
      <CourseStatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        courses={courses}
        vehicleNumber={vehicleNumber}
      />



      {/* Debug Panel Modal */}
      {showDebugPanel && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowDebugPanel(false)}
        >
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>Debug Panel iTrack</h3>
              <button
                className="modal-close"
                onClick={() => setShowDebugPanel(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="debug-stats">
                <div className="debug-stat-item">
                  <strong>Total Logs:</strong> {debugLogs.length}
                </div>
                <div className="debug-stat-item">
                  <strong>Vehicul:</strong> {vehicleNumber || "Nespecificat"}
                </div>
                <div className="debug-stat-item">
                  <strong>Status:</strong> {isOnline ? "Online" : "Offline"}
                </div>
                <div className="debug-stat-item">
                  <strong>Curse:</strong> {courses.length}
                </div>
              </div>

              <div className="debug-actions">
                <button
                  className="debug-btn copy-logs"
                  onClick={() => {
                    const logsText = debugLogs
                      .map(
                        (log) =>
                          `[${log.timestamp}] ${log.level}: ${log.message}`,
                      )
                      .join("\n");
                    navigator.clipboard.writeText(logsText);
                    alert("Logs copied to clipboard!");
                  }}
                >
                  <i className="fas fa-copy"></i> Copy Logs
                </button>

                <button
                  className="debug-btn refresh-data"
                  onClick={async () => {
                    if (vehicleNumber) {
                      await handleLoadCourses();
                    }
                    const logs = await getAppLogs();
                    setDebugLogs(logs);
                  }}
                >
                  <i className="fas fa-sync"></i> Refresh Data
                </button>
              </div>

              <div className="debug-logs-container">
                <h4>Application Logs</h4>
                <div className="debug-logs-list">
                  {debugLogs.length === 0 ? (
                    <div className="no-logs">No logs available</div>
                  ) : (
                    debugLogs
                      .slice(-50)
                      .reverse()
                      .map((log, index) => (
                        <div
                          key={index}
                          className={`debug-log-item ${log.level.toLowerCase()}`}
                        >
                          <span className="log-time">{log.timestamp}</span>
                          <span className="log-level">{log.level}</span>
                          <span className="log-message">{log.message}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleScreen;
