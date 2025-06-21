import React, { useState, useEffect } from "react";
import { CapacitorHttp } from '@capacitor/core';
import { Course } from "../types";
import { getVehicleCourses, logout, sendGPSData, API_BASE_URL } from "../services/api";
import {
  startGPSTracking,
  stopGPSTracking,
  updateCourseStatus,
  logoutClearAllGPS,
  hasActiveCourses,
  getActiveCourses,
} from "../services/directAndroidGPS";
import { clearToken, storeVehicleNumber, getStoredVehicleNumber } from "../services/storage";
import { getOfflineGPSCount, saveGPSCoordinateOffline, syncOfflineGPS } from "../services/offlineGPS";
import { getAppLogs, logAPI, logAPIError } from "../services/appLogger";
import { startCourseAnalytics, stopCourseAnalytics } from "../services/courseAnalytics";
import { subscribeToSyncProgress } from "../services/offlineSyncStatus";


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
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [syncProgress, setSyncProgress] = useState<any>(null);
  const [offlineCount, setOfflineCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [backgroundRefreshActive, setBackgroundRefreshActive] = useState(false);

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
        performBackgroundRefresh();
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
          return existingCourse
            ? { ...newCourse, status: existingCourse.status }
            : { ...newCourse, isNew: true }; // Mark new courses
        });

        // Sort: new courses first, then existing ones
        const sortedCourses = mergedCourses.sort((a, b) => {
          // New courses (isNew = true) go first
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          
          // Within same group, sort by status priority: 2 (active) > 3 (paused) > 1 (available) > 4 (finished)
          const statusPriority = { 2: 4, 3: 3, 1: 2, 4: 1 };
          return (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
        });

        // Clean up isNew flag after sorting
        const finalCourses = sortedCourses.map(course => {
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
        setBackgroundRefreshActive(true);
        
        // Start native Android background refresh service
        if (window.AndroidGPS && window.AndroidGPS.startBackgroundRefresh) {
          try {
            const result = window.AndroidGPS.startBackgroundRefresh(vehicleNumber, token);
            console.log('Native Android background refresh:', result);
          } catch (error) {
            console.log('Native background refresh not available (browser mode)');
          }
        }
        
        console.log('🔄 Android background auto-refresh activated (5 min intervals)');
        
        console.log(`Successfully loaded ${finalCourses.length} courses for ${vehicleNumber} (sorted: new first)`);
        
        // Log new courses found
        const newCoursesCount = mergedCourses.filter(c => c.isNew).length;
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
      onLogout();
    } catch (error) {
      console.error("Eroare la logout:", error);
      onLogout();
    }
  };

  const handleTimestampClick = async () => {
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
        
        const response = await CapacitorHttp.post({
          url: gpsUrl,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          data: gpsPayload
        });

        console.log(`📡 Response status: ${response.status}`);
        console.log(`📋 Response headers:`, response.headers);
        
        if (response.status < 200 || response.status >= 300) {
          console.error(`❌ Server error ${response.status}:`, response.data);
          console.error(`🔍 Full response:`, {
            status: response.status,
            headers: response.headers,
            body: response.data
          });
          throw new Error(`Server error ${response.status}: ${JSON.stringify(response.data)}`);
        }

        console.log(`📥 Response data:`, response.data);
        const result = response.data;

        if (result.status !== 'success' && !result.success) {
          throw new Error(result.message || result.error || 'Server rejected status update');
        }
      } catch (fetchError) {
        console.error(`❌ Network/Fetch error:`, fetchError);
        console.error(`🔍 Error details:`, {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack
        });
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - server nu răspunde în 10 secunde');
        }
        if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
          console.error(`🚫 Network fetch failed`);
          console.error(`📶 Navigator online: ${navigator.onLine}`);
          throw new Error(`Conexiune server eșuată - verificați endpoint-ul API`);
        }
        throw new Error(`Network error: ${fetchError.message}`);
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

  // Helper function to format time difference in Romanian
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      if (diffSeconds === 1) return "acum o secundă";
      if (diffSeconds < 20) return `acum ${diffSeconds} secunde`;
      return `acum ${diffSeconds} de secunde`;
    }

    if (diffMinutes < 60) {
      if (diffMinutes === 1) return "acum un minut";
      if (diffMinutes < 20) return `acum ${diffMinutes} minute`;
      return `acum ${diffMinutes} de minute`;
    }

    if (diffHours < 24) {
      if (diffHours === 1) return "acum o oră";
      if (diffHours < 20) return `acum ${diffHours} ore`;
      return `acum ${diffHours} de ore`;
    }

    if (diffDays === 1) return "acum o zi";
    if (diffDays < 20) return `acum ${diffDays} zile`;
    return `acum ${diffDays} de zile`;
  };

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
        <>
          <div className="vehicle-screen-header">
            <div className="header-brand">
              <div
                className="header-logo-corporate"
                onClick={handleTimestampClick}
                title=""
              >
                <div className="corporate-emblem-small">
                  <div className="emblem-ring-small">
                    <div className="emblem-core-small">
                      <div className="emblem-center-small">
                        <i className="fas fa-truck"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="header-text-section"></div>

            </div>

            <div className="header-vehicle-form">
              <div className="vehicle-input-container">
                <input
                  type="text"
                  className="header-vehicle-input"
                  placeholder="Nr. înmatriculare"
                  value={vehicleNumber}
                  onChange={(e) => {
                    const cleanValue = e.target.value
                      .replace(/[^A-Za-z0-9]/g, "")
                      .toUpperCase();
                    setVehicleNumber(cleanValue);
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleLoadCourses()}
                />
                <button
                  className={`header-load-btn ${loading ? "loading" : ""}`}
                  onClick={handleLoadCourses}
                  disabled={loading || !vehicleNumber.trim()}
                >
                  {loading ? (
                    <i className="fas fa-spinner spinning"></i>
                  ) : (
                    <i className="fas fa-search"></i>
                  )}
                </button>
              </div>
              {error && <div className="header-error">{error}</div>}
            </div>


          </div>
        </>
      ) : (
        <>
          <div className="vehicle-screen-header">
            <div className="header-vehicle-display">
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
                  {offlineCount > 0 && !syncProgress?.isActive && (
                    <span className="offline-count-badge">{offlineCount}</span>
                  )}

                </div>
                
                {/* Progress sincronizare - doar când există coordonate offline */}
                {syncProgress && syncProgress.isActive && syncProgress.totalToSync > 0 && (
                  <div className="sync-progress-container">
                    <div className="sync-info">
                      <span className="sync-text">Sincronizare: {syncProgress.synced}/{syncProgress.totalToSync}</span>
                      <span className="sync-percent">({syncProgress.percentage}%)</span>
                    </div>
                    <div className="sync-progress-bar">
                      <div 
                        className="sync-progress-fill" 
                        style={{ width: `${syncProgress.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                

                
                {/* Mesaj coordonate offline - doar când există date */}
                {!syncProgress?.isActive && offlineCount > 0 && (
                  <div className="offline-summary">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>{offlineCount} coordonate salvate offline</span>
                    <small>Se vor sincroniza automat când revine conexiunea</small>
                  </div>
                )}
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
                    }}>{courses.filter(c => c.status === 2).length}</div>
                    <div style={{
                      fontSize: '0.5rem',
                      color: '#94a3b8',
                      fontWeight: '600',
                      letterSpacing: '0.2px',
                      textTransform: 'uppercase',
                      lineHeight: '1'
                    }}>ACTIV</div>
                  </div>
                  
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
                    }}>{courses.filter(c => c.status === 3).length}</div>
                    <div style={{
                      fontSize: '0.5rem',
                      color: '#94a3b8',
                      fontWeight: '600',
                      letterSpacing: '0.2px',
                      textTransform: 'uppercase',
                      lineHeight: '1'
                    }}>PAUZĂ</div>
                  </div>
                  
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
                    }}>{courses.filter(c => c.status === 1).length}</div>
                    <div style={{
                      fontSize: '0.5rem',
                      color: '#94a3b8',
                      fontWeight: '600',
                      letterSpacing: '0.2px',
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
