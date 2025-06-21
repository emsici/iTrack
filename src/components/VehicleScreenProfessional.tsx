import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { getVehicleCourses, logout } from '../services/api';
import { clearToken, storeVehicleNumber, getStoredVehicleNumber } from '../services/storage';
import { updateCourseStatus, logoutClearAllGPS } from '../services/directAndroidGPS';
import { logAPI } from '../services/appLogger';
import { startCourseAnalytics, stopCourseAnalytics } from '../services/courseAnalytics';
import CourseDetailCard from './CourseDetailCard';
import CourseStatsModal from './CourseStatsModal';
import OfflineGPSMonitor from './OfflineGPSMonitor';

interface VehicleScreenProps {
  token: string;
  onLogout: () => void;
}

const VehicleScreenProfessional: React.FC<VehicleScreenProps> = ({ token, onLogout }) => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [infoClickCount, setInfoClickCount] = useState(0);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [syncProgress, setSyncProgress] = useState<any>(null);
  const [offlineCount, setOfflineCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Load stored vehicle number on component mount
  useEffect(() => {
    const loadStoredVehicleNumber = async () => {
      try {
        const stored = await getStoredVehicleNumber();
        if (stored) {
          setVehicleNumber(stored);
          handleLoadCourses(stored);
        }
      } catch (error) {
        console.error('Error loading stored vehicle number:', error);
      }
    };

    loadStoredVehicleNumber();
  }, []);

  const handleLoadCourses = async (inputVehicleNumber?: string) => {
    const vehicleNumberToUse = inputVehicleNumber || vehicleNumber;
    
    if (!vehicleNumberToUse.trim()) {
      setError('Introduceți numărul de înmatriculare');
      return;
    }

    console.log("=== APK DEBUG: Vehicle number:", vehicleNumberToUse);
    console.log("=== APK DEBUG: Token available:", !!token);
    console.log("=== APK DEBUG: Current coursesLoaded state:", coursesLoaded);
    
    setLoading(true);
    setError("");
    
    try {
      // Store vehicle number for persistence
      await storeVehicleNumber(vehicleNumberToUse.trim());
      
      console.log(`=== DEBUGGING: Loading courses for vehicle: ${vehicleNumberToUse} ===`);
      const response = await getVehicleCourses(vehicleNumberToUse, token);
      
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
        
        console.log(`Successfully loaded ${finalCourses.length} courses for ${vehicleNumberToUse} (sorted: new first)`);
        
        // Log new courses found
        const newCoursesCount = mergedCourses.filter(c => c.isNew).length;
        if (newCoursesCount > 0) {
          console.log(`🆕 Found ${newCoursesCount} new courses - displayed at top`);
        }
      } else {
        console.log("=== APK DEBUG: No courses found - BLOCKING access ===");
        setCourses([]);
        setCoursesLoaded(false);
        setError("Nu s-au găsit curse pentru acest vehicul. Verificați numărul de înmatriculare și încercați din nou.");
        console.log("=== APK DEBUG: User blocked - must enter valid vehicle number ===");
      }
    } catch (error: any) {
      console.error("=== APK DEBUG: Error loading courses ===", error);
      console.log("=== APK DEBUG: ERROR - Blocking user due to API error ===");
      setCoursesLoaded(false);
      setCourses([]);
      setError(error.message || "Eroare la conectarea la server. Verificați conexiunea și încercați din nou.");
    } finally {
      setLoading(false);
      console.log("=== APK DEBUG: Loading finished ===");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutClearAllGPS();
      await logout(token);
      await clearToken();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      onLogout();
    }
  };

  const handleStatusUpdate = async (courseId: string, newStatus: number) => {
    try {
      await updateCourseStatus(courseId, newStatus);
      
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, status: newStatus }
            : course
        )
      );

      const course = courses.find(c => c.id === courseId);
      if (course) {
        if (newStatus === 2) {
          await startCourseAnalytics(courseId, course.uit, vehicleNumber);
        } else if (newStatus === 4) {
          await stopCourseAnalytics(courseId);
        }
      }

      logAPI(`Course ${courseId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating course status:', error);
      setError('Eroare la actualizarea statusului');
    }
  };

  const handleTimestampClick = () => {
    setInfoClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 50) {
        setShowDebugPanel(true);
        return 0;
      }
      return newCount;
    });
  };

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

  // Update time display every 5 minutes
  const [, forceUpdate] = useState({});
  useEffect(() => {
    if (!lastRefreshTime) return;
    
    const interval = setInterval(() => {
      forceUpdate({});
    }, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [lastRefreshTime]);

  // Monitor online/offline status
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

  return (
    <div className="vehicle-screen">
      {!coursesLoaded ? (
        <>
          <div className="vehicle-screen-header">
            <div className="header-brand">
              <div className="header-logo-corporate" onClick={handleTimestampClick}>
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
                  placeholder="Numărul de înmatriculare"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLoadCourses()}
                />
                <button
                  className="header-load-btn"
                  onClick={() => handleLoadCourses()}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <>
                      <i className="fas fa-search"></i>
                      <span>Încarcă Cursele</span>
                    </>
                  )}
                </button>
              </div>
              
              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>{error}</span>
                </div>
              )}
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
        <div className="vehicle-screen-header">
          <div className="header-brand">
            <div className="header-logo-corporate" onClick={handleTimestampClick}>
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
            >
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
              <div className="refresh-content">
                <span>Refresh</span>
                {lastRefreshTime && (
                  <span className="refresh-time">{getTimeAgo(lastRefreshTime)}</span>
                )}
              </div>
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
            
            {/* GPS Status Button */}
            <div className="gps-status-button">
              <div className={`gps-indicator-btn ${courses.filter(c => c.status === 2).length > 0 ? 'gps-active' : 'gps-inactive'}`}>
                <i className="fas fa-satellite-dish"></i>
                <span>GPS</span>
                {courses.filter(c => c.status === 2).length > 0 && (
                  <span className="gps-count-badge">
                    {courses.filter(c => c.status === 2).length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {coursesLoaded && (
        <div className="courses-section">
          <div className="executive-control-center">
            <div className="command-dashboard">
              {/* Statistics Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '4px',
                maxWidth: '320px',
                margin: '0 auto',
                padding: '0 8px'
              }}>
                <div className="stats-card">
                  <h3>{courses.length}</h3>
                  <p>TOTAL</p>
                </div>
                
                <div className="stats-card">
                  <h3>{courses.filter(c => c.status === 2).length}</h3>
                  <p>ACTIV</p>
                </div>
                
                <div className="stats-card">
                  <h3>{courses.filter(c => c.status === 3).length}</h3>
                  <p>PAUZĂ</p>
                </div>
                
                <div className="stats-card">
                  <h3>{courses.filter(c => c.status === 1).length}</h3>
                  <p>DISPONIBIL</p>
                </div>
                
                <div className="stats-card" onClick={() => setShowStatsModal(true)} style={{cursor: 'pointer'}}>
                  <h3><i className="fas fa-chart-line"></i></h3>
                  <p>STATISTICI</p>
                </div>
              </div>

              {/* Courses List */}
              <div className="courses-grid">
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <CourseDetailCard
                      key={course.id}
                      course={course}
                      onStatusUpdate={handleStatusUpdate}
                      isLoading={loading}
                    />
                  ))
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
        </div>
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
            className="admin-modal-content debug-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2>Debug Panel</h2>
              <button
                className="admin-modal-close"
                onClick={() => setShowDebugPanel(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="debug-panel-content">
              <p>Debug logs would appear here...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleScreenProfessional;