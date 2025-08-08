import React, { useState, useEffect } from "react";
import { Geolocation } from '@capacitor/geolocation';
import { Course } from "../types";
import { getVehicleCourses, logout } from "../services/api";
import {
  updateCourseStatus,
  logoutClearAllGPS,
} from "../services/directAndroidGPS";

import { clearToken, storeVehicleNumber, getStoredVehicleNumber } from "../services/storage";
import { getOfflineGPSCount } from "../services/offlineGPS";
import { getAppLogs, logAPI, logAPIError } from "../services/appLogger";
// Analytics imports removed - unused
import CourseStatsModal from "./CourseStatsModal";
import CourseDetailCard from "./CourseDetailCard";
import AdminPanel from "./AdminPanel";
import OfflineGPSMonitor from "./OfflineGPSMonitor";

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [clickCount, setClickCount] = useState(0);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<number | 'all'>('all');
  const [loadingCourses] = useState(new Set<string>());

  // Load stored vehicle number ONLY on initial component mount
  useEffect(() => {
    const loadStoredVehicleNumber = async () => {
      try {
        const storedVehicle = await getStoredVehicleNumber();
        if (storedVehicle && !vehicleNumber) { // Only load if current input is empty
          setVehicleNumber(storedVehicle);
          console.log('Loaded stored vehicle number:', storedVehicle);
        }
      } catch (error) {
        console.error('Error loading stored vehicle number:', error);
      }
    };
    
    loadStoredVehicleNumber();
  }, []); // Empty dependency array - runs only once on mount

  // Separate useEffect for background refresh events
  useEffect(() => {
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
    console.log("=== APK DEBUG: Current courses count:", courses.length);
    
    setLoading(true);
    setError("");
    
    try {
      // Store vehicle number for persistence ONLY if successful
      // Moved after successful course loading
      
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
        setCoursesLoaded(true); // Allow access only when courses are found
        setSelectedStatusFilter('all'); // Reset filter when new courses load
        
        // Store vehicle number ONLY after successful course loading
        await storeVehicleNumber(vehicleNumber.trim());
        console.log(`✅ Courses loaded successfully - switching to main view with ${finalCourses.length} courses`);
        
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
                  
                  // CRITICAL: Preserve local status when auto-refreshing
                  const newCoursesData = response.map((course: any) => {
                    // Find existing course with same UIT
                    const existingCourse = currentCourses.find(c => c.uit === course.uit);
                    
                    // Restore saved status from localStorage or use existing status
                    let preservedStatus = course.status || 1; // Default from server
                    
                    if (existingCourse) {
                      // KEEP existing status - user started/paused/stopped course
                      preservedStatus = existingCourse.status;
                      console.log(`🔄 Auto-refresh: Preserving status ${preservedStatus} for UIT ${course.uit}`);
                    } else {
                      // New course - check localStorage for saved status
                      try {
                        const statusKey = `course_status_${course.uit}`;
                        const storedStatus = localStorage.getItem(statusKey);
                        if (storedStatus) {
                          preservedStatus = parseInt(storedStatus);
                          console.log(`📋 Auto-refresh: Restored status ${preservedStatus} for new UIT ${course.uit}`);
                        }
                      } catch (error) {
                        console.error('Failed to restore course status during auto-refresh:', error);
                      }
                    }
                    
                    return {
                      ...course,
                      status: preservedStatus,
                      isNew: !existingUITs.has(course.uit)
                    };
                  });
                  
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
                    console.log(`✅ Auto-refresh: ${sortedCourses.length} courses updated (preserved statuses)`);
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
        console.log("No courses found - staying on vehicle input screen");
        setCourses([]);
        setCoursesLoaded(false); // Stay on input screen
        setError("Nu au fost găsite curse pentru acest vehicul");
        // Don't save failed vehicle number to storage
        console.log("✅ Staying on input screen - no courses found");
      }
    } catch (error: any) {
      console.error("Error loading courses:", error);
      setCourses([]);
      setCoursesLoaded(false); // Stay on input screen on error
      setError(error.message || "Eroare la încărcarea curselor");
      console.log("✅ Staying on input screen - error occurred");
    } finally {
      setLoading(false);
      console.log("=== Loading finished ===");
      // Clear any lingering loading states that might disable input
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔐 Starting complete logout - stopping ALL GPS transmissions...');
      
      // STEP 1: Stop all GPS services completely
      await logoutClearAllGPS(); // Direct Android GPS service
      
      // STEP 2: Clear any remaining guaranteed GPS services 
      try {
        const { clearAllGuaranteedGPS } = await import('../services/garanteedGPS');
        await clearAllGuaranteedGPS();
        console.log('✅ Guaranteed GPS service cleared');
      } catch (error) {
        console.warn('GuaranteedGPS clear failed (service may not be active):', error);
      }
      
      // STEP 3: Server logout 
      await logout(token);
      
      // STEP 4: Clear local authentication
      await clearToken();
      
      // STEP 5: Clear all saved course statuses on logout
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
      
      console.log('✅ Complete logout finished - all GPS transmissions stopped');
      onLogout();
    } catch (error) {
      console.error("Eroare la logout:", error);
      onLogout();
    }
  };

  const handleTimestampClick = async () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    console.log(`Debug click: ${newCount}/50`);
    
    if (newCount >= 50) {
      try {
        console.log("Opening debug panel after 50 clicks...");
        const logs = await getAppLogs();
        console.log("Logs loaded:", logs.length);
        // Debug panel functionality removed
        console.log('Debug logs available:', logs.length);
        setClickCount(0);
      } catch (error) {
        console.error("Error loading debug logs:", error);
        // Show panel anyway with empty logs
        console.log('Debug panel would show empty logs');
        setClickCount(0);
      }
    }
  };

  const handleStatusUpdate = async (courseId: string, newStatus: number) => {
    console.log(`Processing course action: ${courseId}`);

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

      // Request GPS permissions first if starting course
      if (newStatus === 2) {
        console.log('🔍 Requesting GPS permissions for course start...');
        try {
          await Geolocation.requestPermissions();
          console.log('✅ GPS permissions granted');
        } catch (permError) {
          console.log('⚠️ GPS permissions not immediately granted:', permError);
          console.log('📱 APK Environment: Permissions will be requested by Android service');
          console.log('✅ Continuing course start - GPS service will handle permissions');
        }
      }

      // SIMPLIFIED: All GPS logic handled by capacitorGPS service
      try {
        console.log(`🎯 Delegating all GPS logic to capacitorGPS service`);
        console.log(`📞 Calling updateCourseStatus with UIT: ${courseToUpdate.uit} (not ID: ${courseId})`);
        
        // CRITICAL FIX: Use UIT instead of courseId for GPS service
        await updateCourseStatus(courseToUpdate.uit, newStatus);
        console.log(`✅ Course ${courseToUpdate.uit} status updated to ${newStatus} successfully`);

      } catch (error) {
        console.error(`❌ Status update error:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Status update failed: ${errorMessage}`);
        logAPIError(`Status update failed: ${errorMessage}`);
      }

      // Status already updated above - no duplicate update needed

      logAPI(`Course ${courseToUpdate.uit} status updated successfully to ${newStatus}`);
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
      console.log(`Course action completed: ${courseId}`);
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
  const handleCourseStatusUpdate = (courseId: string, newStatus: number) => {
    return handleStatusUpdate(courseId, newStatus);
  };

  // SIMPLIFICARE: Elimină logica complexă și folosește doar coursesLoaded

  // Filter courses based on selected status
  const filteredCourses = selectedStatusFilter === 'all' 
    ? courses 
    : courses.filter(course => course.status === selectedStatusFilter);

  // ELIMINAT: Fallback timer care forța coursesLoaded
  // Utilizatorul trebuie să introducă un număr valid de vehicul

  return (
    <div className={`vehicle-screen ${coursesLoaded ? "courses-loaded" : ""}`} style={{
      paddingTop: coursesLoaded ? 'env(safe-area-inset-top)' : '0'
    }}>
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
                    // Clear error when user starts typing
                    if (error) {
                      setError("");
                    }
                    console.log(`📝 Vehicle number changed to: ${cleanValue}`);
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleLoadCourses()}
                  disabled={loading}
                  readOnly={false} // Ensure input is always editable when not loading
                  style={{
                    width: '100%',
                    padding: '20px',
                    background: loading ? 'rgba(30, 41, 59, 0.3)' : 'rgba(30, 41, 59, 0.6)',
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
              {/* Main Action Button */}
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
                    Caută curse
                  </>
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  marginTop: '15px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '16px',
                  color: '#fca5a5',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: loading ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  }
                }}
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Ieșire</span>
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
            <div className="header-vehicle-section">
              <div className="vehicle-info-group">
                <div className="vehicle-number-badge" onClick={() => setCoursesLoaded(false)} title="Schimbă vehiculul">
                  <i className="fas fa-truck vehicle-icon"></i>
                  <span className="vehicle-number">{vehicleNumber}</span>
                  <i className="edit-icon fas fa-edit"></i>
                </div>
                
                <div className="logout-button-enhanced" onClick={handleLogout} title="Logout">
                  <i className="fas fa-sign-out-alt"></i>
                  <span className="logout-text">Ieșire</span>
                </div>
              </div>
            </div>
          </div>

          {/* Indicator Online/Offline cu Debug Trigger */}
          <div 
            className="online-indicator"
            onClick={handleTimestampClick}
            style={{
              textAlign: 'center',
              margin: '15px 0',
              padding: '10px',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer',
              userSelect: 'none',
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '8px',
              maxWidth: '200px',
              marginLeft: 'auto',
              marginRight: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {isOnline ? 'Online' : 'Offline'}
            {clickCount >= 30 && (
              <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                ({clickCount}/50)
              </span>
            )}
          </div>

          {/* Main Dashboard Content */}
          <div className="vehicle-dashboard-main-content">
            {/* Statistics Cards - 4 in One Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              margin: '20px 0',
              padding: '0 20px'
            }}>
              <div className="analytics-grid-centered">
                <div className="stat-card total" onClick={() => setSelectedStatusFilter('all')}>
                  <div className="stat-card-content">
                    <div className="stat-icon-wrapper total">
                      <i className="fas fa-list-alt"></i>
                    </div>
                    <div className="stat-details">
                      <div className="stat-label">TOTAL</div>
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
            </div>

            {/* Offline GPS Monitor - visible when courses are active */}
            <OfflineGPSMonitor 
              isOnline={isOnline} 
              coursesActive={coursesLoaded && courses.some(c => c.status === 2)} 
            />

            {/* Courses List */}
            <div className="courses-container" style={{ position: 'relative', zIndex: 1 }}>
              {filteredCourses.length === 0 ? (
                <div className="no-courses-message">
                  <i className="fas fa-info-circle"></i>
                  <p>Nu există curse {selectedStatusFilter === 'all' ? '' : 'cu statusul selectat'} pentru acest vehicul.</p>
                </div>
              ) : (
                <div className="courses-list" style={{ position: 'relative', isolation: 'isolate' }}>
                  {filteredCourses.map((course, index) => (
                    <div key={course.id} style={{ 
                      position: 'relative', 
                      zIndex: 1,
                      marginBottom: '8px'
                    }}>
                      <CourseDetailCard
                        course={course}
                        onStatusUpdate={handleCourseStatusUpdate}
                        isLoading={loadingCourses.has(course.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons-row">
              <button className="action-button logout" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Ieșire</span>
              </button>
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
          </div>
        </>
      )}
    </div>
  );
};

export default VehicleScreen;
