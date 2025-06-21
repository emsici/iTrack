import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import CourseDetailCard from './CourseDetailCard';
import CourseStatsModal from './CourseStatsModal';
import OfflineSyncProgress from './OfflineSyncProgress';
import { 
  getVehicleCourses, 
  logout as apiLogout 
} from '../services/api';
import { 
  storeToken, 
  clearToken, 
  storeVehicleNumber, 
  getStoredVehicleNumber 
} from '../services/storage';
import { 
  startGPSTracking, 
  stopGPSTracking, 
  updateCourseStatus, 
  logoutClearAllGPS 
} from '../services/directAndroidGPS';
import { 
  getOfflineGPSCount, 
  syncOfflineGPS 
} from '../services/offlineGPS';
import { 
  subscribeToSyncProgress, 
  hasOfflineGPSData 
} from '../services/offlineSyncStatus';
import { 
  getAppLogs, 
  clearAppLogs, 
  logAPI, 
  logAPIError 
} from '../services/appLogger';
import { Course } from '../types';

interface VehicleScreenProps {
  token: string;
  onLogout: () => void;
}

const VehicleScreen: React.FC<VehicleScreenProps> = ({ token, onLogout }) => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  // Load stored vehicle number on component mount
  useEffect(() => {
    const loadStoredVehicleNumber = async () => {
      try {
        const storedVehicle = await getStoredVehicleNumber();
        if (storedVehicle) {
          setVehicleNumber(storedVehicle);
          console.log('Loaded stored vehicle number:', storedVehicle);
          // Auto-load courses only for complete stored vehicle numbers
          if (storedVehicle.length >= 5) {
            setTimeout(() => loadCourses(), 100);
          }
        }
      } catch (error) {
        console.error('Error loading stored vehicle number:', error);
      }
    };

    loadStoredVehicleNumber();
  }, []);

  // Auto-load courses only if vehicle number is already stored on mount
  useEffect(() => {
    if (vehicleNumber && !coursesLoaded && vehicleNumber.length >= 5) {
      // Only auto-load if we have a complete vehicle number (min 5 chars)
      loadCourses();
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh courses every 5 minutes in background
  const [, forceUpdate] = useState({});
  useEffect(() => {
    if (!lastRefreshTime) return;
    
    // Timer pentru afișarea timpului trecut
    const displayTimer = setInterval(() => {
      forceUpdate({});
    }, 30000); // Update display every 30 seconds

    // Timer pentru auto-refresh curse în background
    const autoRefreshTimer = setInterval(() => {
      console.log("🔄 Auto-refresh: Loading courses in background");
      loadCourses();
    }, 300000); // Auto-refresh every 5 minutes

    return () => {
      clearInterval(displayTimer);
      clearInterval(autoRefreshTimer);
    };
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

  // Subscribe to sync progress
  useEffect(() => {
    const unsubscribe = subscribeToSyncProgress({
      onProgressUpdate: (progress) => {
        setSyncProgress(progress);
        console.log('Sync progress:', progress);
      },
      onSyncComplete: () => {
        console.log('Sync completed');
        setSyncProgress(null);
        setOfflineCount(0);
      },
      onSyncError: (error) => {
        console.error('Sync error:', error);
      }
    });

    return unsubscribe;
  }, []);

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      setError('Vă rugăm introduceți numărul vehiculului');
      return;
    }
    await loadCourses();
  };

  const loadCourses = async () => {
    if (!vehicleNumber.trim()) {
      setError('Vă rugăm introduceți numărul vehiculului');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      logAPI(`Loading courses for vehicle: ${vehicleNumber}`);
      const response = await getVehicleCourses(vehicleNumber, token);
      
      if (response && Array.isArray(response)) {
        const coursesArray = response;
        
        // Merge with existing courses and preserve isNew flag for new courses
        const mergedCourses = coursesArray.map((newCourse: Course) => {
          const existingCourse = courses.find(c => c.id === newCourse.id);
          return {
            ...newCourse,
            isNew: existingCourse ? existingCourse.isNew : true // Mark as new if not found in existing
          };
        });

        // Sort courses with new ones first, then by status priority
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
        setCoursesLoaded(true);
        setLastRefreshTime(new Date());
        
        // Store vehicle number for persistence
        await storeVehicleNumber(vehicleNumber);
        
        logAPI(`Successfully loaded ${finalCourses.length} courses`);
      } else {
        setError('Răspuns invalid de la server');
        logAPIError('Invalid response format from get courses API');
      }
    } catch (error: any) {
      console.error('Error loading courses:', error);
      const errorMessage = error.message || 'Eroare la încărcarea curselor';
      setError(errorMessage);
      logAPIError(`Failed to load courses: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCourses = async () => {
    if (vehicleNumber) {
      await loadCourses();
    }
  };

  const handleCourseStatusUpdate = async (courseId: string, newStatus: number) => {
    if (actionLoading) return;

    setActionLoading(courseId);
    
    try {
      logAPI(`Updating course ${courseId} status to ${newStatus}`);
      
      // Update course status using Android GPS service
      await updateCourseStatus(courseId, newStatus);
      
      // Update local state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, status: newStatus }
            : course
        )
      );

      logAPI(`Successfully updated course ${courseId} to status ${newStatus}`);
    } catch (error: any) {
      console.error(`Error updating course status:`, error);
      setError(`Eroare la actualizarea statusului: ${error.message || 'Eroare necunoscută'}`);
      logAPIError(`Failed to update course status: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    try {
      logAPI("Starting logout process");
      
      // Clear all GPS tracking
      await logoutClearAllGPS();
      
      // Call logout API
      await apiLogout(token);
      
      // Clear stored data
      await clearToken();
      
      logAPI("Logout completed successfully");
      onLogout();
    } catch (error: any) {
      console.error('Logout error:', error);
      logAPIError(`Logout failed: ${error.message}`);
      // Still proceed with logout even if API call fails
      await clearToken();
      onLogout();
    }
  };

  const handleTimestampClick = () => {
    setInfoClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 50) {
        setShowDebugPanel(true);
        return 0; // Reset counter
      }
      return newCount;
    });
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "acum";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes === 1) return "acum un minut";
    if (diffInMinutes < 60) return `acum ${diffInMinutes} minute`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return "acum o oră";
    if (diffInHours < 24) return `acum ${diffInHours} ore`;
    
    const diffDays = Math.floor(diffInHours / 24);
    if (diffDays === 1) return "acum o zi";
    if (diffDays < 20) return `acum ${diffDays} zile`;
    return `acum ${diffDays} de zile`;
  };

  return (
    <div className="vehicle-screen">
      {!coursesLoaded ? (
        <>
          <div className="main-header">
            <div className="app-info">
              <div style={{
                width: '32px',
                height: '32px',
                marginRight: '12px',
                backgroundColor: '#1e293b',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #64748b'
              }}>
                <i className="fas fa-truck" style={{ color: '#0ea5e9', fontSize: '16px' }}></i>
              </div>
              <div className="app-title">
                <h1>iTrack</h1>
                <p>Sistem profesional de monitorizare GPS</p>
              </div>
            </div>
          </div>

          <div className="vehicle-input-container">
            <form onSubmit={handleVehicleSubmit} className="vehicle-form">
              <div className="vehicle-input-group">
                <label htmlFor="vehicleNumber">Numărul vehiculului</label>
                <div className="input-with-icon">
                  <i className="fas fa-truck input-icon"></i>
                  <input
                    id="vehicleNumber"
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="ex. AB12CDE"
                    disabled={loading}
                    className="vehicle-input"
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading || !vehicleNumber.trim()}
                className="load-courses-btn"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Încărcare...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search"></i>
                    Încarcă Curse
                  </>
                )}
              </button>
              {error && <div className="header-error">{error}</div>}
            </form>
          </div>
        </>
      ) : (
        <>
          {/* Rând 1: Numărul vehiculului + Buton ieșire */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '12px',
            padding: '16px 20px',
            margin: '0 auto 16px auto',
            width: '96%',
            maxWidth: '96%'
          }}>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: 1,
                cursor: 'pointer'
              }}
              onClick={() => setCoursesLoaded(false)} 
              title="Schimbă vehiculul"
            >
              <i className="fas fa-truck" style={{ color: '#64748b', marginRight: '12px', fontSize: '1.2rem' }}></i>
              <span style={{ 
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '1.1rem'
              }}>{vehicleNumber}</span>
              <i className="fas fa-edit" style={{ color: '#64748b', marginLeft: '8px', fontSize: '0.8rem' }}></i>
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                height: 'fit-content'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title="Deconectare"
            >
              <i className="fas fa-sign-out-alt"></i>
              Ieșire
            </button>
          </div>

          {/* Rând 2: Status Online + Counter debug */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div 
              onClick={handleTimestampClick}
              style={{ cursor: 'pointer', textAlign: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div className={`status-indicator ${isOnline ? "online" : "offline"}`}></div>
                <span className="status-text">
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
              {infoClickCount >= 30 && (
                <div style={{ 
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  marginTop: '4px'
                }}>
                  {infoClickCount}/50
                </div>
              )}
              {offlineCount > 0 && !syncProgress?.isActive && (
                <span style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  {offlineCount} offline
                </span>
              )}
            </div>
            {lastRefreshTime && (
              <div style={{
                color: '#94a3b8',
                fontSize: '0.7rem',
                marginTop: '4px',
                textAlign: 'center'
              }}>
                Ultima actualizare: {getTimeAgo(lastRefreshTime)}
              </div>
            )}
          </div>

          {/* Progress sincronizare GPS offline (între rândul 2 și 3) */}
          <OfflineSyncProgress />

          {/* Rând 3: 4 carduri analytics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            maxWidth: '320px',
            margin: '0 auto 20px auto',
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

          {/* Rând 4: Lista curselor */}
          <div style={{ marginTop: '10px' }}>
            {courses.length > 0 ? (
              courses.map((course) => (
                <CourseDetailCard
                  key={course.id}
                  course={course}
                  onStatusUpdate={handleCourseStatusUpdate}
                  isLoading={actionLoading === course.id}
                />
              ))
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#94a3b8', 
                padding: '40px 20px',
                fontSize: '0.9rem'
              }}>
                Nu există curse disponibile pentru acest vehicul
              </div>
            )}
          </div>
        </>
      )}

      {showStatsModal && (
        <CourseStatsModal
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          courses={courses}
          vehicleNumber={vehicleNumber}
        />
      )}

      {showDebugPanel && (
        <div className="debug-panel-overlay">
          <div className="debug-panel">
            <div className="debug-panel-header">
              <h3>Debug Panel</h3>
              <button onClick={() => setShowDebugPanel(false)} className="debug-close-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="debug-content">
              <div className="debug-stats">
                <div className="debug-stat-item">
                  <span>Courses: {courses.length}</span>
                </div>
                <div className="debug-stat-item">
                  <span>Online: {isOnline ? 'Yes' : 'No'}</span>
                </div>
                <div className="debug-stat-item">
                  <span>Offline Count: {offlineCount}</span>
                </div>
                <div className="debug-stat-item">
                  <span>Platform: {Capacitor.getPlatform()}</span>
                </div>
              </div>

              <div className="debug-actions">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={async () => {
                    const logs = await getAppLogs();
                    const logText = logs.map(log => 
                      `[${log.timestamp}] ${log.level}: ${log.message}`
                    ).join('\n');
                    
                    try {
                      await navigator.clipboard.writeText(logText);
                      alert('Logs copied to clipboard');
                    } catch (err) {
                      console.error('Failed to copy logs:', err);
                      
                      const textarea = document.createElement('textarea');
                      textarea.value = logText;
                      document.body.appendChild(textarea);
                      textarea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textarea);
                      alert('Logs copied to clipboard (fallback method)');
                    }
                  }}
                  style={{
                    borderColor: '#64748b',
                    color: '#e2e8f0',
                    background: 'rgba(100, 116, 139, 0.1)',
                    marginRight: '10px'
                  }}
                >
                  <i className="fas fa-copy"></i> Copy Logs
                </button>
                
                <button 
                  className="btn btn-outline-success btn-sm"
                  onClick={async () => {
                    if (vehicleNumber) {
                      await handleLoadCourses();
                    }
                    const logs = await getAppLogs();
                    setDebugLogs(logs);
                  }}
                >
                  <i className="fas fa-download"></i> Export Logs
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