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
import CourseStatsModal from "./CourseStatsModal";
import "../styles/professionalVehicleScreen.css";

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

  const [showStats, setShowStats] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastCoursesSync, setLastCoursesSync] = useState<string>('');

  const handleLoadCourses = async () => {
    if (!vehicleNumber.trim()) {
      setError("Introduceți numărul vehiculului");
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
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
        } catch (error) {
          console.error("Error checking offline GPS count:", error);
        }
      };
      
      // Update immediately and then every 5 seconds
      updateOfflineCount();
      interval = setInterval(updateOfflineCount, 5000);
      
      // Also log GPS activity for debugging
      const logGPSActivity = async () => {
        try {
          const count = await getOfflineGPSCount();
          if (count > 0) {
            console.log(`📍 GPS Offline: ${count} coordonate salvate local`);
          }
        } catch (error) {
          // Silent error to avoid spam
        }
      };
      
      const gpsLogInterval = setInterval(logGPSActivity, 15000); // Every 15 seconds
      
      return () => {
        clearInterval(interval);
        clearInterval(gpsLogInterval);
      };
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [coursesLoaded]);

  // Auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && coursesLoaded && vehicleNumber) {
      interval = setInterval(() => {
        handleLoadCourses();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, coursesLoaded, vehicleNumber]);

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

  const handleShowInfo = () => {
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
    <div className="vehicle-screen">
      <div className="vehicle-container">
        {!coursesLoaded ? (
          <>
            <div className="vehicle-header">
              <div className="header-title">
                <div className="header-icon">
                  <i className="fas fa-route"></i>
                </div>
              </div>

              <div className="vehicle-input-section">
                <div className="input-group">
                  <div className="input-field">
                    <label className="input-label">Numărul Vehiculului</label>
                    <input
                      type="text"
                      className="vehicle-input"
                      placeholder="🚛 B123ABC / CJ45DEF / TM67GHI"
                      value={vehicleNumber}
                      onChange={(e) => {
                        // Allow only alphanumeric characters, convert to uppercase
                        const cleanValue = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                        setVehicleNumber(cleanValue);
                      }}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleLoadCourses()
                      }
                    />
                  </div>
                  <button
                    className="load-button"
                    onClick={handleLoadCourses}
                    disabled={loading || !vehicleNumber.trim()}
                  >
                    {loading ? (
                      <div className="loading-spinner"></div>
                    ) : (
                      <>
                        <i className="fas fa-search"></i>
                        Încarcă Cursele
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="courses-section">
            <div className="executive-control-center">
              <div className="command-dashboard">
                <div className="control-header">
                  <div className="system-identity">
                    <div className="corporate-logo">
                      <div className="logo-emblem">
                        <i className="fas fa-cube"></i>
                      </div>
                      <div className="brand-text">
                        <div className="company-name">iTrack</div>
                        {/* <div className="system-edition">Enterprise Edition</div> */}
                      </div>
                    </div>

                  </div>

                  <div className="vehicle-management-panel">
                    <div className="active-unit-section">
                      <div className="section-header">ACTIVE UNIT</div>
                      <div className="unit-control">
                        <div 
                          className="unit-display"
                          onClick={() => {
                            setCoursesLoaded(false);
                            setCourses([]);
                            setVehicleNumber('');
                          }}
                        >
                          <i className="fas fa-truck-moving unit-icon"></i>
                          <span className="unit-identifier">
                            {vehicleNumber}
                          </span>
                          <i className="fas fa-exchange-alt change-unit"></i>
                        </div>
                      </div>
                    </div>

                    <div className="analytics-grid">
                      <div className="analytics-card total-routes">
                        <div className="card-value">{courses.length}</div>
                        <div className="card-label">TOTAL ROUTES</div>
                        <div className="card-indicator"></div>
                      </div>
                      <div className="analytics-card active-tracking">
                        <div className="card-value">{courses.filter(c => c.status === 2).length}</div>
                        <div className="card-label">TRACKING</div>
                        <div className="card-indicator active"></div>
                      </div>
                      <div className="analytics-card standby-routes">
                        <div className="card-value">{courses.filter(c => c.status === 3).length}</div>
                        <div className="card-label">STANDBY</div>
                        <div className="card-indicator paused"></div>
                      </div>
                      <div className="analytics-card ready-routes">
                        <div className="card-value">{courses.filter(c => c.status === 1).length}</div>
                        <div className="card-label">READY</div>
                        <div className="card-indicator ready"></div>
                      </div>
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
                      className="action-button info-button"
                      onClick={() =>
                        setExpandedCourse(
                          expandedCourse === course.id ? null : course.id,
                        )
                      }
                    >
                      <i className="fas fa-info"></i>
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
              className="nav-button stats-nav-button"
              onClick={() => setShowStats(true)}
            >
              <i className="fas fa-chart-line"></i>
            </button>
            <button
              className="nav-button info-nav-button"
              onClick={handleShowInfo}
            >
              <i className="fas fa-info-circle"></i>           
            </button>
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
                  <strong>Sistem:</strong> iTrack
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

      <CourseStatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        courses={courses}
        vehicleNumber={vehicleNumber}
      />
    </div>
  );
};

export default VehicleScreen;
