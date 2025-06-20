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
  const [showInfo, setShowInfo] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);


  const [offlineCount, setOfflineCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastCoursesSync, setLastCoursesSync] = useState<string>('');
  const [infoClickCount, setInfoClickCount] = useState(0);


  const handleLoadCourses = async () => {
    if (!vehicleNumber.trim()) {
      setError("Introduceți numărul vehiculului");
      return;
    }

    // Check network connectivity before attempting to load
    if (!isOnline || !navigator.onLine) {
      console.log("🔌 No internet connection - cannot load courses");
      setError("Nu există conexiune la internet. Cursele nu pot fi încărcate.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getVehicleCourses(vehicleNumber, token);

      if (!data || data.length === 0) {
        setError("Nu există curse disponibile pentru acest vehicul");
        setCourses([]);
        setCoursesLoaded(false);
        return;
      }

      // Smart merge: păstrează statusurile curselor existente, adaugă cursele noi
      const mergedCourses = data.map((newCourse: Course) => {
        const existingCourse = courses.find(existing => existing.uit === newCourse.uit);
        if (existingCourse) {
          // Păstrează statusul și datele cursului existent
          return {
            ...newCourse,
            status: existingCourse.status
          };
        }
        // Cursă nouă - se afișează cu status 1 (disponibilă)
        return newCourse;
      });
      
      setCourses(mergedCourses);
      setCoursesLoaded(true);
      
      // Update last sync timestamp
      const now = new Date();
      const timeString = now.toLocaleTimeString('ro-RO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setLastCoursesSync(timeString);
    } catch (error: any) {
      console.error("Error loading courses:", error);
      setError(error.message || "Eroare la încărcarea curselor");
      setCourses([]);
      setCoursesLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("📶 Internet connection restored - starting offline sync");
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log("🔌 Internet connection lost - GPS will save offline");
    };
    
    // Check initial online status
    setIsOnline(navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Additional polling for more reliable detection
    const statusCheck = setInterval(() => {
      const currentOnlineStatus = navigator.onLine;
      if (currentOnlineStatus !== isOnline) {
        setIsOnline(currentOnlineStatus);
        console.log(`🔄 Network status changed: ${currentOnlineStatus ? 'ONLINE' : 'OFFLINE'}`);
        console.log(`📊 Debug info: navigator.onLine=${navigator.onLine}, isOnline=${isOnline}`);
      }
    }, 2000);
    
    // Debug log initial status
    console.log(`🔍 Initial network status: navigator.onLine=${navigator.onLine}, isOnline=${isOnline}`);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(statusCheck);
    };
  }, [isOnline]);

  // Monitor offline GPS count  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (coursesLoaded) {
      const updateOfflineCount = async () => {
        try {
          const count = await getOfflineGPSCount();
          setOfflineCount(count);
          
          // Check sync status
          const syncInfo = await getOfflineGPSInfo();
          setSyncInProgress(syncInfo.syncInProgress);
          
          if (count > 0) {
            console.log(`📍 GPS Offline: ${count} coordonate salvate local`);
          }
        } catch (error) {
          console.error("Error checking offline GPS count:", error);
        }
      };
      
      // Update immediately and then every 5 seconds
      updateOfflineCount();
      interval = setInterval(updateOfflineCount, 5000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [coursesLoaded]);

  // Auto-refresh effect with network check
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && coursesLoaded && vehicleNumber) {
      interval = setInterval(() => {
        // Only refresh if online
        if (isOnline && navigator.onLine) {
          console.log("🔄 Auto-refresh: reloading courses");
          handleLoadCourses();
        } else {
          console.log("⏸️ Auto-refresh: skipped (no internet connection)");
        }
      }, 30000); // Check every 30 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, coursesLoaded, vehicleNumber, isOnline]);

  const handleCourseAction = async (
    course: Course,
    action: "start" | "pause" | "resume" | "finish",
  ) => {
    setActionLoading(course.id);
    setError("");

    try {
      let newStatus = course.status;

      if (action === "start") {
        newStatus = 2;
        await startGPSTracking(
          course.id,
          vehicleNumber,
          token,
          course.uit,
          newStatus,
        );
      } else if (action === "pause") {
        newStatus = 3;
        await startGPSTracking(
          course.id,
          vehicleNumber,
          token,
          course.uit,
          newStatus,
        );
      } else if (action === "resume") {
        newStatus = 2;
        await startGPSTracking(
          course.id,
          vehicleNumber,
          token,
          course.uit,
          newStatus,
        );
      } else if (action === "finish") {
        newStatus = 4;
        // First send status 4 to server, then stop tracking
        await startGPSTracking(
          course.id,
          vehicleNumber,
          token,
          course.uit,
          newStatus,
        );
        // Small delay to ensure status 4 transmission completes
        setTimeout(() => stopGPSTracking(course.id), 1000);
      }

      setCourses((prevCourses) =>
        prevCourses.map((c) =>
          c.id === course.id ? { ...c, status: newStatus } : c,
        ),
      );
    } catch (error: any) {
      console.error("Course action error:", error);
      setError(error.message || "Eroare la executarea acțiunii");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("🔴 Starting logout process - stopping all GPS tracking");
      
      // First, stop all GPS tracking and clear all data
      await logoutClearAllGPS();
      
      // Then send logout to server
      await logout(token);
      
      // Clear local token storage
      await clearToken();
      
      console.log("✅ Logout completed - all GPS data cleared");
      onLogout();
    } catch (error) {
      console.error("Logout error:", error);
      
      // Force clear GPS and token even if server logout fails
      try {
        await logoutClearAllGPS();
      } catch (gpsError) {
        console.error("Error clearing GPS on logout:", gpsError);
      }
      
      await clearToken();
      onLogout();
    }
  };

  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const handleTimestampClick = async () => {
    // Debug logs access with 50 clicks
    const newClickCount = infoClickCount + 1;
    setInfoClickCount(newClickCount);
    
    if (newClickCount === 50) {
      console.log("🔧 Debug panel activated");
      setInfoClickCount(0);
      // Collect logs and show debug panel
      const logs = [
        `${new Date().toLocaleString()} - Debug panel activated`,
        `Vehicle: ${vehicleNumber}`,
        `Courses loaded: ${courses.length}`,
        `Online status: ${isOnline}`,
        `Navigator online: ${navigator.onLine}`,
        `User agent: ${navigator.userAgent}`,
        `Local storage debug mode: ${localStorage.getItem('debug_mode')}`,
        `Offline GPS count: ${offlineCount}`,
        `Sync in progress: ${syncInProgress}`,
        `Auto refresh: ${autoRefresh}`,
        `Last courses sync: ${lastCoursesSync}`,
        `Current timestamp: ${new Date().toISOString()}`,
        `Active courses: ${courses.filter(c => c.status === 2).length}`,
        `Available courses: ${courses.filter(c => c.status === 1).length}`,
        `Paused courses: ${courses.filter(c => c.status === 3).length}`,
      ];
      setDebugLogs(logs);
      setShowDebugPanel(true);
      return;
    }
    
    if (newClickCount >= 30) {
      // Reset counter after 5 seconds if not continued
      setTimeout(() => {
        setInfoClickCount(0);
      }, 5000);
    }
    
    console.log(`🔄 Debug click count: ${newClickCount}/50`);
  };

  const handleShowInfo = () => {
    // Regular info modal - no admin logic
    setShowInfo(true);
  };

  const getStatusText = (status: number): string => {
    switch (status) {
      case 1:
        return "Disponibilă";
      case 2:
        return "În curs";
      case 3:
        return "Pauză";
      case 4:
        return "Finalizată";
      default:
        return "Necunoscută";
    }
  };

  const renderCourseActions = (course: Course) => {
    const isLoading = actionLoading === course.id;

    if (course.status === 1) {
      return (
        <button
          className="action-button start-button"
          onClick={() => handleCourseAction(course, "start")}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              <i className="fas fa-play"></i>
              Pornește
            </>
          )}
        </button>
      );
    }

    if (course.status === 2) {
      return (
        <div className="course-actions">
          <button
            className="action-button pause-button"
            onClick={() => handleCourseAction(course, "pause")}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <i className="fas fa-pause"></i>
                Pauză
              </>
            )}
          </button>
          <button
            className="action-button finish-button"
            onClick={() => handleCourseAction(course, "finish")}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <i className="fas fa-stop"></i>
                Finalizează
              </>
            )}
          </button>
        </div>
      );
    }

    if (course.status === 3) {
      return (
        <button
          className="action-button resume-button"
          onClick={() => handleCourseAction(course, "resume")}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              <i className="fas fa-play"></i>
              Reia
            </>
          )}
        </button>
      );
    }

    return null;
  };

  return (
    <div className={`vehicle-screen ${coursesLoaded ? 'courses-loaded' : ''}`}>
      <div className="vehicle-container">
        {!coursesLoaded ? (
          <div className="enterprise-vehicle-access">
            <div className="corporate-header-zone">
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
                    className="enterprise-action-button"
                    onClick={handleLoadCourses}
                    disabled={loading || !vehicleNumber.trim()}
                  >
                    {loading ? (
                      <>
                        <div className="enterprise-spinner"></div>
                        <span>Se încarcă...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-arrow-right"></i>
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
        ) : (
          <div className="courses-section">
            <div className="executive-control-center">
              <div className="command-dashboard">
                <div className="control-header-redesigned">
                  <div className="header-brand-section">
                    <div className="logo-emblem">
                      <i className="fas fa-cube"></i>
                    </div>
                    <div className="company-name">iTrack</div>
                  </div>

                  
                  <div className="vehicle-number-section">
                    <div className="vehicle-display-centered">
                      <i className="fas fa-truck-moving vehicle-icon"></i>
                      <span className="vehicle-number">{vehicleNumber}</span>
                      <span 
                        className="admin-timestamp"
                        onClick={handleTimestampClick}
                        title="Click 50 de ori pentru debug logs"
                      >
                        {new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                        {infoClickCount >= 30 && (
                          <span className="admin-counter">{infoClickCount}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="analytics-grid-centered">
                    <div className="analytics-card total-routes">
                      <div className="card-value">{courses.length}</div>
                      <div className="card-label">TOTAL CURSE</div>
                      <div className="card-indicator"></div>
                    </div>
                    <div className="analytics-card active-tracking">
                      <div className="card-value">{courses.filter(c => c.status === 2).length}</div>
                      <div className="card-label">ACTIV</div>
                      <div className="card-indicator active"></div>
                    </div>
                    <div className="analytics-card standby-routes">
                      <div className="card-value">{courses.filter(c => c.status === 3).length}</div>
                      <div className="card-label">PAUZĂ</div>
                      <div className="card-indicator paused"></div>
                    </div>
                    <div className="analytics-card ready-routes">
                      <div className="card-value">{courses.filter(c => c.status === 1).length}</div>
                      <div className="card-label">DISPONIBIL</div>
                      <div className="card-indicator ready"></div>
                    </div>
                    <div 
                      className="analytics-card stats-card clickable" 
                      onClick={() => setShowStatsModal(true)}
                      title="Click pentru statistici detaliate"
                    >
                      <div className="card-icon">
                        <i className="fas fa-chart-bar"></i>
                      </div>
                      <div className="card-label">STATISTICI</div>
                      <div className="card-indicator stats"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
              </div>
            )}

            {/* Central Offline GPS Status Indicator */}
            <div className="offline-status-central">
              <OfflineGPSMonitor 
                isOnline={isOnline} 
                coursesActive={courses.some(c => c.status === 2)}
              />
            </div>

            <div className="courses-grid">
              {courses.map((course) => (
                <div key={course.id} className="professional-course-card">
                  <div className="course-header">
                    <div>
                      <div className="course-id">UIT: {course.uit}</div>
                      <div className="course-declarant">
                        {course.denumireDeclarant || "Transport comercial"}
                      </div>
                    </div>
                    <div
                      className={`course-status-badge status-${course.status}`}
                    >
                      {getStatusText(course.status)}
                    </div>
                  </div>

                  <div className="course-details">
                    {course.name && (
                      <div className="detail-row">
                        <i className="fas fa-truck detail-icon"></i>
                        <span className="detail-text">
                          Transport: {course.name}
                        </span>
                      </div>
                    )}

                    {course.description && (
                      <div className="detail-row">
                        <i className="fas fa-info-circle detail-icon"></i>
                        <span className="detail-text">
                          {course.description}
                        </span>
                      </div>
                    )}

                    {course.vama && course.vamaStop && (
                      <div className="detail-row">
                        <i className="fas fa-route detail-icon"></i>
                        <span className="detail-text">
                          {course.vama} → {course.vamaStop}
                        </span>
                      </div>
                    )}

                    {course.dataTransport && (
                      <div className="detail-row">
                        <i className="fas fa-calendar detail-icon"></i>
                        <span className="detail-text">
                          Data transport:{" "}
                          {new Date(course.dataTransport).toLocaleDateString(
                            "ro-RO",
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="course-actions">
                    {renderCourseActions(course)}
                    <button
                      className="action-button expand-button"
                      onClick={() =>
                        setExpandedCourse(
                          expandedCourse === course.id ? null : course.id,
                        )
                      }
                    >
                      <i className={`fas ${expandedCourse === course.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                    </button>
                  </div>

                  {expandedCourse === course.id && (
                    <div className="course-expanded-details">
                      <div className="expanded-content">
                        <h4>Detalii complete cursă</h4>
                        {course.name && (
                          <p>
                            <strong>Nume:</strong> {course.name}
                          </p>
                        )}
                        {course.description && (
                          <p>
                            <strong>Descriere:</strong> {course.description}
                          </p>
                        )}
                        {course.ikRoTrans && (
                          <p>
                            <strong>ikRoTrans:</strong> {course.ikRoTrans}
                          </p>
                        )}
                        {course.vama && (
                          <p>
                            <strong>Vamă:</strong> {course.vama}
                          </p>
                        )}
                        {course.judet && (
                          <p>
                            <strong>Județ:</strong> {course.judet}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Offline GPS Status Bar - appears above navigation when needed */}
      {(offlineCount > 0 || !isOnline || syncInProgress) && (
        <div className="offline-status-bar">
          {!isOnline && (
            <div className="offline-indicator">
              <i className="fas fa-wifi-slash"></i>
              <span>Fără internet - GPS se salvează offline</span>
            </div>
          )}
          {offlineCount > 0 && (
            <div className="offline-count-indicator">
              <i className="fas fa-database"></i>
              <span>{offlineCount} coordonate offline</span>
            </div>
          )}
          {syncInProgress && (
            <div className="sync-indicator">
              <i className="fas fa-sync-alt spinning"></i>
              <span>Sincronizare în progres...</span>
            </div>
          )}
        </div>
      )}

      <div className="bottom-navigation">
        <div className="nav-container">
          <div className="nav-actions">
            {coursesLoaded && (
              <div className="nav-button-group">
                <button
                  className="nav-button refresh-nav-button"
                  onClick={handleLoadCourses}
                  disabled={loading}
                  title="Reîncarcă cursele de la server"
                >
                  <i className={`fas fa-sync-alt ${loading ? 'spinning' : ''}`}></i>
                </button>
                {lastCoursesSync && (
                  <span className="last-sync-time">{lastCoursesSync}</span>
                )}
              </div>
            )}
            {coursesLoaded && (
              <button
                className={`nav-button auto-refresh-nav-button ${autoRefresh ? 'active' : ''}`}
                onClick={() => setAutoRefresh(!autoRefresh)}
                title={autoRefresh ? 'Dezactivează auto-refresh curse (30s)' : 'Activează auto-refresh curse (30s)'}
              >
                <i className="fas fa-clock"></i>
                {autoRefresh && <span className="auto-indicator">AUTO</span>}
              </button>
            )}


            <button
              className="nav-button logout-nav-button"
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt"></i>                      </button>
          </div>
        </div>
      </div>

      {showInfo && (
        <div className="info-modal" onClick={() => setShowInfo(false)}>
          <div className="info-content" onClick={(e) => e.stopPropagation()}>
            <div className="info-header">
              <h3>Informații</h3>
              <button onClick={() => setShowInfo(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="info-body">
              <div className="info-section">
                <h4>
                  <i className="fas fa-truck"></i> Vehicul Current
                </h4>
                <p>
                  <strong>Numărul de înmatriculare:</strong> {vehicleNumber}
                </p>
                <p>
                  <strong>Status:</strong> Conectat și operațional
                </p>
              </div>

              <div className="info-section">
                <h4>
                  <i className="fas fa-route"></i> Status Curse
                </h4>
                <p>
                  <strong>Curse active (GPS pornit):</strong>{" "}
                  {courses.filter((c) => c.status === 2).length}
                </p>
                <p>
                  <strong>Curse în pauză:</strong>{" "}
                  {courses.filter((c) => c.status === 3).length}
                </p>
                <p>
                  <strong>Curse disponibile:</strong>{" "}
                  {courses.filter((c) => c.status === 1).length}
                </p>
                <p>
                  <strong>Total curse înregistrate:</strong> {courses.length}
                </p>
              </div>

              <div className="info-section">
                <h4>
                  <i className="fas fa-satellite-dish"></i> Tehnologie GPS
                </h4>
                <p>
                  <strong>Sistem:</strong> iTrack v1807.99
                </p>
                <p>
                  <strong>Precizie:</strong> GPS de înaltă precizie (±1-3m)
                </p>
                <p>
                  <strong>Interval transmisie:</strong> La fiecare 5 secunde
                  (optimizat)
                </p>
                <p>
                  <strong>Funcționare background:</strong> Activ permanent
                </p>
                <p>
                  <strong>Compatibilitate:</strong> Android nativ
                </p>
              </div>

              <div className="info-section">
                <h4>
                  <i className="fas fa-shield-alt"></i> Caracteristici Avansate
                </h4>
                <p>
                  • <strong>Background tracking:</strong> GPS funcționează cu
                  telefonul blocat
                </p>
                <p>
                  • <strong>Multi-task:</strong> Urmărește multiple curse
                  simultan
                </p>
                <p>
                  • <strong>Triple backup system:</strong> GPS → Network →
                  Passive providers
                </p>
                <p>
                  • <strong>Auto-failover:</strong> Comută automat între surse
                  GPS
                </p>
                <p>
                  • <strong>Real-time:</strong> Transmisie coordonate în timp
                  real
                </p>
                <p>
                  • <strong>Battery optimized:</strong> Optimizat pentru baterie
                </p>
              </div>

              <div className="info-section">
                <h4>
                  <i className="fas fa-cogs"></i> Date Transmise
                </h4>
                <p>• Coordonate GPS (latitudine, longitudine)</p>
                <p>• Altitudine precisă din senzori</p>
                <p>• Viteză și direcție de deplasare</p>
                <p>• Nivel semnal GSM real</p>
                <p>• Status cursă și UIT individual</p>
                <p>• Timestamp și date autentificare</p>
              </div>
            </div>
          </div>
        </div>
      )}





      {/* Debug Panel Overlay */}
      {showDebugPanel && (
        <div className="debug-panel-overlay" onClick={() => setShowDebugPanel(false)}>
          <div className="debug-panel-content" onClick={(e) => e.stopPropagation()}>
            <div className="debug-panel-header">
              <h3>🔧 Debug Logs - iTrack v1807.99</h3>
              <button onClick={() => setShowDebugPanel(false)} className="debug-close-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="debug-panel-body">
              <div className="debug-logs-container">
                {debugLogs.map((log, index) => (
                  <div key={index} className="debug-log-entry">
                    <span className="debug-log-index">{index + 1}</span>
                    <span className="debug-log-text">{log}</span>
                  </div>
                ))}
              </div>
              <div className="debug-panel-footer">
                <button 
                  className="debug-action-btn"
                  onClick={() => {
                    const allLogs = debugLogs.join('\n');
                    navigator.clipboard.writeText(allLogs);
                    console.log("📋 Logs copied to clipboard");
                  }}
                >
                  <i className="fas fa-copy"></i>
                  Copiază Logs
                </button>
                <button 
                  className="debug-action-btn"
                  onClick={() => {
                    console.log("🔄 Refreshing debug data...");
                    const newLogs = [
                      ...debugLogs,
                      `${new Date().toLocaleString()} - Debug data refreshed`,
                      `Memory usage: ${(performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + ' MB' : 'N/A'}`,
                      `Page load time: ${performance.now().toFixed(2)}ms`
                    ];
                    setDebugLogs(newLogs);
                  }}
                >
                  <i className="fas fa-refresh"></i>
                  Refresh Data
                </button>
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
      <OfflineGPSMonitor 
        isOnline={isOnline}
        coursesActive={coursesLoaded}
      />
    </div>
  );
};

export default VehicleScreen;
