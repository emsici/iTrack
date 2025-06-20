import React, { useState, useEffect } from "react";
import { Course } from "../types";
import { getVehicleCourses, logout } from "../services/api";
import {
  startGPSTracking,
  stopGPSTracking,
  logoutClearAllGPS,
} from "../services/directAndroidGPS";
import { clearToken } from "../services/storage";
import { getOfflineGPSCount, getOfflineGPSInfo } from "../services/offlineGPS";

import OfflineGPSMonitor from "./OfflineGPSMonitor";
import CourseStatsModal from "./CourseStatsModal";

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
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastCoursesSync, setLastCoursesSync] = useState<string>('');
  const [infoClickCount, setInfoClickCount] = useState(0);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [showStatsModal, setShowStatsModal] = useState(false);

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

    setLoading(true);
    setError("");

    try {
      const response = await getVehicleCourses(vehicleNumber, token);
      
      if (response && response.data) {
        const mergedCourses = response.data.map((newCourse: Course) => {
          const existingCourse = courses.find(c => c.id === newCourse.id);
          return existingCourse ? { ...newCourse, status: existingCourse.status } : newCourse;
        });
        
        setCourses(mergedCourses);
        setCoursesLoaded(true);
        setLastCoursesSync(new Date().toLocaleTimeString('ro-RO', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
      } else {
        setError("Nu s-au găsit curse pentru acest vehicul");
      }
    } catch (error: any) {
      console.error("Eroare la încărcarea curselor:", error);
      setError(error.message || "Eroare la încărcarea curselor");
    } finally {
      setLoading(false);
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

  const handleTimestampClick = () => {
    setInfoClickCount(prev => prev + 1);
    if (infoClickCount >= 49) {
      setShowDebugPanel(true);
      setInfoClickCount(0);
    }
  };

  const handleStatusUpdate = async (courseId: string, newStatus: number) => {
    setActionLoading(courseId);
    
    try {
      const courseToUpdate = courses.find(c => c.id === courseId);
      if (!courseToUpdate) return;

      if (newStatus === 2) {
        await startGPSTracking(courseId, vehicleNumber, courseToUpdate.uit, token, newStatus);
      } else if (newStatus === 4) {
        await stopGPSTracking(courseId);
      }

      setCourses(prev => 
        prev.map(course => 
          course.id === courseId 
            ? { ...course, status: newStatus }
            : course
        )
      );
    } catch (error) {
      console.error("Eroare la actualizarea statusului:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Monitor connection status
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

  // Monitor offline GPS count
  useEffect(() => {
    const updateOfflineCount = async () => {
      try {
        const count = await getOfflineGPSCount();
        setOfflineCount(count);
      } catch (error) {
        console.error("Error getting offline count:", error);
      }
    };

    updateOfflineCount();
    const interval = setInterval(updateOfflineCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderCourseActions = (course: Course) => {
    const isLoading = actionLoading === course.id;
    
    return (
      <div className="course-actions">
        {course.status === 1 && (
          <button
            className="action-button start-button"
            onClick={() => handleStatusUpdate(course.id, 2)}
            disabled={isLoading}
          >
            <i className={`fas ${isLoading ? 'fa-spinner spinning' : 'fa-play'}`}></i>
            <span>Start</span>
          </button>
        )}
        {course.status === 2 && (
          <>
            <button
              className="action-button pause-button"
              onClick={() => handleStatusUpdate(course.id, 3)}
              disabled={isLoading}
            >
              <i className={`fas ${isLoading ? 'fa-spinner spinning' : 'fa-pause'}`}></i>
              <span>Pauză</span>
            </button>
            <button
              className="action-button stop-button"
              onClick={() => handleStatusUpdate(course.id, 4)}
              disabled={isLoading}
            >
              <i className={`fas ${isLoading ? 'fa-spinner spinning' : 'fa-stop'}`}></i>
              <span>Stop</span>
            </button>
          </>
        )}
        {course.status === 3 && (
          <>
            <button
              className="action-button resume-button"
              onClick={() => handleStatusUpdate(course.id, 2)}
              disabled={isLoading}
            >
              <i className={`fas ${isLoading ? 'fa-spinner spinning' : 'fa-play'}`}></i>
              <span>Continuă</span>
            </button>
            <button
              className="action-button stop-button"
              onClick={() => handleStatusUpdate(course.id, 4)}
              disabled={isLoading}
            >
              <i className={`fas ${isLoading ? 'fa-spinner spinning' : 'fa-stop'}`}></i>
              <span>Stop</span>
            </button>
          </>
        )}
        {course.status === 4 && (
          <div className="status-badge completed">
            <i className="fas fa-check-circle"></i>
            <span>Finalizat</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`vehicle-screen ${coursesLoaded ? 'courses-loaded' : ''}`}>
      {!coursesLoaded ? (
        <>
          <div className="vehicle-screen-header">
            <div className="header-brand">
              <div className="header-logo">
                <i className="fas fa-cube"></i>
              </div>
              <h1 className="header-title">iTrack</h1>
              <p className="header-subtitle">Sistem Enterprise GPS</p>
            </div>
            
            <div className="header-actions">
              <button className="header-icon-btn" onClick={() => setShowStatsModal(true)} title="Statistici Curse">
                <i className="fas fa-chart-line"></i>
                <span>Statistici</span>
              </button>
              <button className="header-icon-btn" onClick={handleLogout} title="Logout">
                <i className="fas fa-sign-out-alt"></i>
                <span>Ieșire</span>
              </button>
              <div className="header-status">
                <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></div>
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
          
          <div className="vehicle-container">
            <div className="enterprise-vehicle-access">
              <div className="brand-identity-section">
                <div className="corporate-logo">
                  <div className="logo-symbol">
                    <i className="fas fa-cube"></i>
                  </div>
                  <div className="brand-name">iTrack</div>
                </div>
              </div>
              
              <div className="access-control-panel">
                <div className="panel-header">
                  <h2 className="panel-title">Acces vehicul</h2>
                  <p className="panel-description">Introduceți numărul de înmatriculare pentru a accesa cursele vehiculului</p>
                </div>
                
                <div className="input-control-group">
                  <div className="form-field-enhanced">
                    <label className="field-label">Număr de înmatriculare</label>
                    <div className="input-wrapper-professional">
                      <div className="input-prefix">
                        <i className="fas fa-truck"></i>
                      </div>
                      <input
                        type="text"
                        className="enterprise-input"
                        placeholder="B123ABC"
                        value={vehicleNumber}
                        onChange={(e) => {
                          const cleanValue = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                          setVehicleNumber(cleanValue);
                        }}
                        onKeyPress={(e) => e.key === "Enter" && handleLoadCourses()}
                      />
                    </div>
                  </div>
                  
                  <button
                    className={`access-button ${loading ? 'loading' : ''}`}
                    onClick={handleLoadCourses}
                    disabled={loading || !vehicleNumber.trim()}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner spinning"></i>
                        <span>Se încarcă...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search"></i>
                        <span>Accesează cursele</span>
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="enterprise-error-alert">
                    <div className="alert-icon">
                      <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <div className="alert-content">
                      <div className="alert-title">Eroare de acces</div>
                      <div className="alert-message">{error}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="system-info-footer">
                <div className="version-info">
                  <span className="version-label">Versiune</span>
                  <span className="version-number">1807.99</span>
                </div>
                <div className="connection-status">
                  <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></div>
                  <span className="status-text">
                    {isOnline ? 'Conectat' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="vehicle-screen-header">
            <div className="header-brand">
              <div className="header-logo">
                <i className="fas fa-cube"></i>
              </div>
              <h1 className="header-title">iTrack</h1>
              <p className="header-subtitle">Vehicul: {vehicleNumber}</p>
            </div>
            
            <div className="header-actions">
              <button className="header-icon-btn" onClick={() => setShowStatsModal(true)} title="Statistici Curse">
                <i className="fas fa-chart-line"></i>
                <span>Statistici</span>
              </button>
              <button className="header-icon-btn" onClick={handleLoadCourses} disabled={loading} title="Refresh Curse">
                <i className="fas fa-sync-alt"></i>
                <span>Refresh</span>
              </button>
              <button className="header-icon-btn" onClick={handleLogout} title="Logout">
                <i className="fas fa-sign-out-alt"></i>
                <span>Ieșire</span>
              </button>
              <div className="header-status">
                <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></div>
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <div 
                className="debug-trigger"
                onClick={handleTimestampClick}
                title="Click 50 de ori pentru debug logs"
              >
                {new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                {infoClickCount >= 30 && <span className="click-counter">({infoClickCount}/50)</span>}
              </div>
            </div>
          </div>
          
          <div className="courses-section">
            <div className="executive-control-center">
              <div className="command-dashboard">
                <div className="analytics-grid-centered">
                  <div className="analytics-card total-routes">
                    <div className="card-value">{courses.length}</div>
                    <div className="card-label">TOTAL CURSE</div>
                    <div className="card-indicator"></div>
                  </div>
                  
                  <div className="analytics-card active-routes">
                    <div className="card-value">{courses.filter(c => c.status === 2).length}</div>
                    <div className="card-label">ACTIV</div>
                    <div className="card-indicator active"></div>
                  </div>
                  
                  <div className="analytics-card paused-routes">
                    <div className="card-value">{courses.filter(c => c.status === 3).length}</div>
                    <div className="card-label">PAUZĂ</div>
                    <div className="card-indicator paused"></div>
                  </div>
                  
                  <div className="analytics-card available-routes">
                    <div className="card-value">{courses.filter(c => c.status === 1).length}</div>
                    <div className="card-label">DISPONIBIL</div>
                    <div className="card-indicator available"></div>
                  </div>
                  
                  <button 
                    className="analytics-card stats-card clickable-stats"
                    onClick={() => setShowStatsModal(true)}
                    title="Vezi statistici detaliate pentru toate cursele"
                  >
                    <div className="card-value">
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="card-label">STATISTICI</div>
                    <div className="card-indicator stats"></div>
                  </button>
                </div>

                <div className="courses-list">
                  {courses.map((course) => (
                    <div key={course.id} className={`course-card-enhanced status-${course.status}`}>
                      <div className="course-header-enhanced">
                        <div className="course-info-section">
                          <h3 className="course-title-enhanced">{course.name}</h3>
                          <div className="course-metadata-enhanced">
                            <span className="course-uit">UIT: {course.uit}</span>
                            <span className={`status-badge-enhanced status-${course.status}`}>
                              {course.status === 1 && 'Disponibil'}
                              {course.status === 2 && 'Activ'}
                              {course.status === 3 && 'Pauză'}
                              {course.status === 4 && 'Oprit'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="course-actions-section">
                          {renderCourseActions(course)}
                          <button
                            className="toggle-details-button"
                            onClick={() => setExpandedCourse(
                              expandedCourse === course.id ? null : course.id
                            )}
                          >
                            <i className={`fas fa-chevron-${expandedCourse === course.id ? 'up' : 'down'}`}></i>
                          </button>
                        </div>
                      </div>
                      
                      {expandedCourse === course.id && (
                        <div className="course-details-enhanced">
                          <div className="details-grid">
                            <div className="detail-item">
                              <strong>Plecare:</strong> {course.departure_location || 'N/A'}
                            </div>
                            <div className="detail-item">
                              <strong>Destinație:</strong> {course.destination_location || 'N/A'}
                            </div>
                            {course.departure_time && (
                              <div className="detail-item">
                                <strong>Ora plecare:</strong> {course.departure_time}
                              </div>
                            )}
                            {course.arrival_time && (
                              <div className="detail-item">
                                <strong>Ora sosire:</strong> {course.arrival_time}
                              </div>
                            )}
                            {course.description && (
                              <div className="detail-item full-width">
                                <strong>Descriere:</strong> {course.description}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
      <OfflineGPSMonitor 
        isOnline={isOnline}
        coursesActive={coursesLoaded}
      />
    </div>
  );
};

export default VehicleScreen;