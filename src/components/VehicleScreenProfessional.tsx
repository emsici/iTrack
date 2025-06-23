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
        console.log("No courses found for this vehicle - allowing access to main screen");
        // Allow access to main screen even with no courses
        setCourses([]);
        setCoursesLoaded(true); // Allow user to access main screen
        setError(""); // Clear any errors
        console.log("User can access main screen despite no courses");
      }
    } catch (error: any) {
      console.error("Error loading courses:", error);
      // Allow user to proceed even on error - graceful degradation
      setCoursesLoaded(true); // Allow access to main screen
      setCourses([]);
      setError(""); // Clear error to allow access
      console.log("API error handled gracefully - user can access main screen");
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

      // Update course status through GPS service
      try {
        await updateCourseStatus(courseId, newStatus);
        console.log(`✅ Status updated to ${newStatus} for course ${courseId}`);

      } catch (error) {
        console.error(`❌ Status update error:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('401')) {
          console.error('🔐 Token expired - redirecting to login');
          await clearToken();
          onLogout();
          return;
        }
        
        setError(`Status update failed: ${errorMessage}`);
        logAPIError(`Status update failed: ${errorMessage}`);
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
          padding: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Logo Row - Top */}
          <div style={{
            textAlign: 'center',
            paddingTop: '60px',
            paddingBottom: '40px',
            flex: '0 0 auto'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '36px',
              margin: '0 auto 24px',
              boxShadow: '0 8px 32px rgba(14, 165, 233, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}>
              <i className="fas fa-truck"></i>
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#ffffff',
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px'
            }}>
              iTrack
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#94a3b8',
              margin: '0',
              fontWeight: '400'
            }}>
              Sistem GPS Profesional
            </p>
          </div>

          {/* Input Row - Middle */}
          <div style={{
            flex: '1 1 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 0'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '400px',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '40px 30px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
              {/* Vehicle Number Input */}
              <div style={{ marginBottom: '30px' }}>
                <input
                  type="text"
                  placeholder="Număr de înmatriculare (ex: B123ABC)"
                  value={vehicleNumber}
                  onChange={(e) => {
                    const cleanValue = e.target.value
                      .replace(/[^A-Za-z0-9]/g, "")
                      .toUpperCase();
                    setVehicleNumber(cleanValue);
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleLoadCourses()}
                  style={{
                    width: '100%',
                    padding: '20px',
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '2px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '16px',
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                    outline: 'none',
                    letterSpacing: '2px',
                    textTransform: 'uppercase'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Button Row - Bottom */}
          <div style={{
            flex: '0 0 auto',
            padding: '20px 0 40px 0'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '400px',
              margin: '0 auto',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '30px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
              <button
                onClick={handleLoadCourses}
                disabled={loading || !vehicleNumber.trim()}
                style={{
                  width: '100%',
                  padding: '20px',
                  background: loading ? 'rgba(148, 163, 184, 0.5)' : 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(14, 165, 233, 0.3)'
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner" style={{ 
                      marginRight: '12px',
                      animation: 'spin 1s linear infinite'
                    }}></i>
                    Se încarcă cursele...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search" style={{ marginRight: '12px' }}></i>
                    Caută Curse pentru Vehicul
                  </>
                )}
              </button>
              
              {error && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  color: '#fca5a5',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                  {error}
                </div>
              )}
            </div>
          </div>

          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>

          {/* Debug Counter */}
          {clickCount >= 30 && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              color: '#64748b',
              fontSize: '12px',
              cursor: 'pointer'
            }} onClick={handleTimestampClick}>
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
          </div>

          {/* Main Dashboard Content */}
          <div className="vehicle-dashboard-main-content">
            <div className="dashboard-stats-row">
              <div className="stat-card total" onClick={() => setSelectedStatusFilter('all')}>
                <div className="stat-card-content">
                  <div className="stat-icon-wrapper total">
                    <i className="fas fa-list-alt"></i>
                  </div>
                  <div className="stat-details">
                    <div className="stat-label">TOTAL CURSE</div>
                    <div className="stat-value">{courses.length}</div>
                  </div>
                </div>
              </div>

              <div className="stat-card active" onClick={() => setSelectedStatusFilter(2)}>
                <div className="stat-card-content">
                  <div className="stat-icon-wrapper active">
                    <i className="fas fa-play"></i>
                  </div>
                  <div className="stat-details">
                    <div className="stat-label">ACTIV</div>
                    <div className="stat-value">{courses.filter(c => c.status === 2).length}</div>
                  </div>
                </div>
              </div>

              <div className="stat-card paused" onClick={() => setSelectedStatusFilter(3)}>
                <div className="stat-card-content">
                  <div className="stat-icon-wrapper paused">
                    <i className="fas fa-pause"></i>
                  </div>
                  <div className="stat-details">
                    <div className="stat-label">PAUZĂ</div>
                    <div className="stat-value">{courses.filter(c => c.status === 3).length}</div>
                  </div>
                </div>
              </div>

              <div className="stat-card available" onClick={() => setSelectedStatusFilter(1)}>
                <div className="stat-card-content">
                  <div className="stat-icon-wrapper available">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div className="stat-details">
                    <div className="stat-label">DISPONIBIL</div>
                    <div className="stat-value">{courses.filter(c => c.status === 1).length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses List */}
            <div className="courses-container">
              {filteredCourses.length === 0 ? (
                <div className="no-courses-message">
                  <i className="fas fa-info-circle"></i>
                  <p>Nu există curse {selectedStatusFilter === 'all' ? '' : 'cu statusul selectat'} pentru acest vehicul.</p>
                </div>
              ) : (
                <div className="courses-list">
                  {filteredCourses.map((course) => (
                    <CourseDetailCard
                      key={course.id}
                      course={course}
                      onStatusUpdate={handleCourseStatusUpdate}
                      isLoading={loadingCourses.has(course.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons-row">
              <button className="action-button refresh" onClick={handleRefreshCourses}>
                <i className="fas fa-sync-alt"></i>
                <span>Actualizează</span>
              </button>
              <button className="action-button logout" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Ieșire</span>
              </button>
            </div>
          </div>

          {/* Course Stats Modal */}
          <CourseStatsModal
            isOpen={showStatsModal}
            onClose={() => setShowStatsModal(false)}
            courses={courses}
            vehicleNumber={vehicleNumber}
          />

          {/* Admin Panel Modal */}
          {showAdminPanel && (
            <AdminPanel
              onLogout={handleLogout}
              onClose={() => setShowAdminPanel(false)}
            />
          )}
        </>
      )}
    </div>
  );
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
