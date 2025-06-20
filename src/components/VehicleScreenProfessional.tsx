import React, { useState, useEffect } from "react";
import { Course } from "../types";
import { getVehicleCourses, logout } from "../services/api";
import {
  startGPSTracking,
  stopGPSTracking,
  logoutClearAllGPS,
} from "../services/directAndroidGPS";
import { clearToken } from "../services/storage";
import { getOfflineGPSCount } from "../services/offlineGPS";
import { getAppLogs } from "../services/appLogger";

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

      if (response && Array.isArray(response) && response.length > 0) {
        const mergedCourses = response.map((newCourse: Course) => {
          const existingCourse = courses.find((c) => c.id === newCourse.id);
          return existingCourse
            ? { ...newCourse, status: existingCourse.status }
            : newCourse;
        });

        setCourses(mergedCourses);
        setCoursesLoaded(true);
        console.log(
          `=== UI: Successfully loaded ${mergedCourses.length} courses ===`,
        );
        // Courses loaded successfully
      } else {
        console.log("No courses found - API returned empty or invalid data");
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
      if (!courseToUpdate) return;

      console.log(`=== STATUS UPDATE ===`);
      console.log(`Course: ${courseId}, Status: ${courseToUpdate.status} → ${newStatus}`);
      console.log(`UIT REAL: ${courseToUpdate.uit}, Vehicle: ${vehicleNumber}`);

      if (newStatus === 2) {
        // Start/Resume - GPS transmite continuu coordonate
        await startGPSTracking(
          courseId,
          vehicleNumber,
          courseToUpdate.uit,
          token,
          newStatus,
        );
      } else if (newStatus === 3) {
        // Pause - Trimite UN update cu status 3, apoi oprește coordonatele
        const { sendGPSData } = await import('../services/api');
        const { saveGPSCoordinateOffline } = await import('../services/offlineGPS');
        
        const gpsData = {
          lat: 0,
          lng: 0,
          timestamp: new Date().toISOString(),
          viteza: 0,
          directie: 0,
          altitudine: 0,
          baterie: 100,
          numar_inmatriculare: vehicleNumber,
          uit: courseToUpdate.uit,
          status: "3",
          hdop: "1.0",
          gsm_signal: "4"
        };
        
        try {
          await sendGPSData(gpsData, token);
          console.log('✅ Status 3 trimis online');
        } catch (error) {
          console.log('💾 Status 3 salvat offline');
          await saveGPSCoordinateOffline(gpsData, courseId, vehicleNumber, token, 3);
        }
        
        await stopGPSTracking(courseId); // Oprește coordonatele continue
      } else if (newStatus === 4) {
        // Finish - Trimite UN update cu status 4, apoi oprește
        const { sendGPSData } = await import('../services/api');
        const { saveGPSCoordinateOffline } = await import('../services/offlineGPS');
        
        const gpsData = {
          lat: 0,
          lng: 0,
          timestamp: new Date().toISOString(),
          viteza: 0,
          directie: 0,
          altitudine: 0,
          baterie: 100,
          numar_inmatriculare: vehicleNumber,
          uit: courseToUpdate.uit,
          status: "4",
          hdop: "1.0",
          gsm_signal: "4"
        };
        
        try {
          await sendGPSData(gpsData, token);
          console.log('✅ Status 4 trimis online');
        } catch (error) {
          console.log('💾 Status 4 salvat offline');
          await saveGPSCoordinateOffline(gpsData, courseId, vehicleNumber, token, 4);
        }
        
        await stopGPSTracking(courseId); // Oprește coordonatele continue
      }

      // Update local state
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId ? { ...course, status: newStatus } : course,
        ),
      );

      console.log(`Status transition completed: ${courseToUpdate.status} → ${newStatus}`);
    } catch (error) {
      console.error("Eroare la actualizarea statusului:", error);
      alert(`Eroare la actualizarea statusului: ${error}`);
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

  return (
    <div className={`vehicle-screen ${coursesLoaded ? "courses-loaded" : ""}`}>
      {!coursesLoaded ? (
        <>
          <div className="vehicle-screen-header">
            <div className="header-brand">
              <div
                className="header-logo-corporate"
                onClick={handleTimestampClick}
                title="Click 50 de ori pentru debug logs"
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
              <div className="header-text-section">
                <h1 className="header-title">iTrack</h1>
                <p className="header-subtitle">GPS Professional</p>
              </div>
              {infoClickCount >= 30 && (
                <div className="click-counter-badge">{infoClickCount}/50</div>
              )}
            </div>

            <div className="header-vehicle-display">
              <span className="vehicle-number-clickable" onClick={() => setCoursesLoaded(false)} title="Schimbă vehiculul">
                🚛 {vehicleNumber}
                <i className="edit-icon fas fa-edit"></i>
              </span>
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
                <div className="analytics-grid-centered">
                  <div className="analytics-card total-routes">
                    <div className="card-value">{courses.length}</div>
                    <div className="card-label">TOTAL CURSE</div>
                    <div className="card-indicator"></div>
                  </div>

                  <div className="analytics-card active-routes">
                    <div className="card-value">
                      {courses.filter((c) => c.status === 2).length}
                    </div>
                    <div className="card-label">ACTIV</div>
                    <div className="card-indicator active"></div>
                  </div>

                  <div className="analytics-card paused-routes">
                    <div className="card-value">
                      {courses.filter((c) => c.status === 3).length}
                    </div>
                    <div className="card-label">PAUZĂ</div>
                    <div className="card-indicator paused"></div>
                  </div>

                  <div className="analytics-card available-routes">
                    <div className="card-value">
                      {courses.filter((c) => c.status === 1).length}
                    </div>
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
                    <CourseDetailCard
                      key={course.id}
                      course={course}
                      onStatusUpdate={handleStatusUpdate}
                      isLoading={actionLoading === course.id}
                    />
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
