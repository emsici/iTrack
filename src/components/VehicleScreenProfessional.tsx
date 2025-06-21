import React, { useState, useEffect } from "react";
import { Course } from "../types";
import { getVehicleCourses, logout, sendGPSData } from "../services/api";
import {
  startGPSTracking,
  stopGPSTracking,
  updateCourseStatus,
  logoutClearAllGPS,
} from "../services/directAndroidGPS";
import { clearToken, storeVehicleNumber, getStoredVehicleNumber } from "../services/storage";
import { getOfflineGPSCount, saveGPSCoordinateOffline, syncOfflineGPS } from "../services/offlineGPS";
import { getAppLogs, logAPI, logAPIError } from "../services/appLogger";
import { startCourseAnalytics, stopCourseAnalytics } from "../services/courseAnalytics";
import { subscribeToSyncProgress } from "../services/offlineSyncStatus";

import OfflineGPSMonitor from "./OfflineGPSMonitor";
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
  }, []);

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
    setInfoClickCount((prev) => prev + 1);
    if (infoClickCount >= 49) {
      // Load debug logs and show panel
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
        const response = await fetch(`${API_BASE_URL}/update_course_status.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            course_id: courseId,
            status: newStatus
          }),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          throw new Error(`Server error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('Server response:', result);

        if (result.status !== 'success' && !result.success) {
          throw new Error(result.message || result.error || 'Server rejected status update');
        }
      } catch (fetchError) {
        console.error('Network error:', fetchError);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - server nu răspunde');
        }
        throw new Error(`Network error: ${fetchError.message}`);
      }

      // Update GPS service (non-blocking)
      try {
        if (newStatus === 2) {
          console.log(`Starting GPS tracking for course ${courseId}`);
          await startGPSTracking(courseId, courseToUpdate.uit, newStatus, vehicleNumber, token);
          await startCourseAnalytics(courseId, courseToUpdate.uit, vehicleNumber);
        } else if (newStatus === 3) {
          console.log(`Pausing GPS tracking for course ${courseId}`);
          await updateCourseStatus(courseId, newStatus);
        } else if (newStatus === 4) {
          console.log(`Stopping GPS tracking for course ${courseId}`);
          await stopGPSTracking(courseId);
          await stopCourseAnalytics(courseId);
        }
      } catch (gpsError) {
        console.warn('GPS service error (non-critical):', gpsError);
        logAPIError(`GPS service warning: ${gpsError}`);
        // Continuă execuția - nu blocheze UI-ul pentru probleme GPS
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
      alert(`Eroare la actualizarea statusului: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`);
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

  console.log("=== APK DEBUG: RENDER - coursesLoaded:", coursesLoaded);
  console.log("=== APK DEBUG: RENDER - courses.length:", courses.length);
  console.log("=== APK DEBUG: RENDER - error:", error);
  console.log("=== APK DEBUG: RENDER - loading:", loading);

  // SIMPLIFICARE: Elimină logica complexă și folosește doar coursesLoaded
  console.log("=== APK DEBUG: RENDER DECISION ===");
  console.log("coursesLoaded:", coursesLoaded);
  console.log("loading:", loading);
  console.log("courses.length:", courses.length);

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
              {infoClickCount >= 30 && (
                <div className="click-counter-badge">{infoClickCount}/50</div>
              )}
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

            <div className="header-actions">
              <button
                className="header-icon-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Ieșire</span>
              </button>
              <div className="header-status">
                <div
                  className={`status-indicator ${isOnline ? "online" : "offline"}`}
                ></div>
                <span>{isOnline ? "Online" : "Offline"}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="vehicle-screen-header">
            <div className="header-brand">
              <div
                className="header-logo-corporate"
                onClick={handleTimestampClick}
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
              {infoClickCount >= 30 && (
                <div className="click-counter-badge">{infoClickCount}/50</div>
              )}
            </div>

            <div className="header-vehicle-display">
              <div className="vehicle-number-badge" onClick={() => setCoursesLoaded(false)} title="Schimbă vehiculul">
                <i className="fas fa-truck vehicle-icon"></i>
                <span className="vehicle-number">{vehicleNumber}</span>
                <i className="edit-icon fas fa-edit"></i>
              </div>
              
              {/* Status Online/Offline */}
              <div className="online-status-display">
                <div className="status-indicator-wrapper">
                  <div className={`status-indicator ${isOnline ? "online" : "offline"}`}></div>
                  <span className="status-text">{isOnline ? "Online" : "Offline"}</span>
                  {offlineCount > 0 && !syncProgress?.isActive && (
                    <span className="offline-count-badge">{offlineCount}</span>
                  )}
                </div>
                
                {/* Progress sincronizare sub status */}
                {syncProgress && syncProgress.isActive && (
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
              </div>
            </div>

            <div className="header-actions">
              <button
                className="header-icon-btn"
                onClick={() => setShowStatsModal(true)}
                title="Statistici Curse"
              >
                <i className="fas fa-chart-line"></i>
                <span>Statistici</span>
              </button>
              <button
                className="header-icon-btn"
                onClick={handleLoadCourses}
                disabled={loading}
                title="Refresh Curse"
              >
                <i className="fas fa-sync-alt"></i>
                <span>Refresh</span>
              </button>
              <button
                className="header-icon-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Ieșire</span>
              </button>
              <div className="header-status">
                <div
                  className={`status-indicator ${isOnline ? "online" : "offline"}`}
                ></div>
                <span>{isOnline ? "Online" : "Offline"}</span>
              </div>
            </div>
          </div>

          <div className="courses-section">
            <div className="executive-control-center">
              <div className="command-dashboard">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '4px',
                  maxWidth: '320px',
                  margin: '0 auto',
                  padding: '0 8px'
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
                  
                  <div 
                    onClick={() => setShowStatsModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.3) 100%)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px',
                      padding: '6px 2px',
                      textAlign: 'center',
                      minHeight: '40px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: '#60a5fa',
                      lineHeight: '1'
                    }}>
                      <i className="fas fa-chart-line"></i>
                    </div>

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

      {/* Monitorizare GPS Offline */}
      <OfflineGPSMonitor isOnline={isOnline} coursesActive={coursesLoaded} />

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
