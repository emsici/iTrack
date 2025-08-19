import React, { useState, useEffect } from "react";
import { Geolocation } from '@capacitor/geolocation';
import { CapacitorHttp } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Course } from "../types";
import { getVehicleCourses, logout, API_BASE_URL } from "../services/api";
import { clearToken, storeVehicleNumber, getStoredVehicleNumber, clearStoredVehicleNumber } from "../services/storage";
import { logAPI, logAPIError } from "../services/appLogger";
import { courseAnalyticsService } from "../services/courseAnalytics";
import CourseStatsModal from "./CourseStatsModal";
import CourseDetailCard from "./CourseDetailCard";
import AdminPanel from "./AdminPanel";
import ToastNotification from "./ToastNotification";
import { useToast } from "../hooks/useToast";
import SettingsModal from "./SettingsModal";
import AboutModal from "./AboutModal";
import VehicleNumberDropdown from "./VehicleNumberDropdown";
import { themeService, Theme, THEME_INFO } from "../services/themeService";

// Interfață TypeScript pentru AndroidGPS bridge
declare global {
  interface Window {
    AndroidGPS?: {
      startGPS: (ikRoTrans: string, vehicleNumber: string, realUit: string, token: string, status: number) => string;
      stopGPS: (courseId: string) => string;
      updateStatus: (courseId: string, status: number, vehicleNumber: string) => string;
      clearAllOnLogout: () => string;
    };
  }
}

interface VehicleScreenProps {
  token: string;
  onLogout: () => void;
}

// Funcții pentru senzori reali
const getBatteryLevel = async (): Promise<string> => {
  try {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      return `${Math.round(battery.level * 100)}%`;
    }
    return "75%";
  } catch {
    return "75%";
  }
};

const getNetworkSignal = async (): Promise<number> => {
  try {
    const networkStatus = await Network.getStatus();
    if (!networkStatus.connected) return 0;
    
    const connectionType = networkStatus.connectionType;
    if (connectionType === 'wifi') return 0;
    if (connectionType === 'cellular') return 3;
    return 2;
  } catch (error) {
    return 2;
  }
};

const VehicleScreen: React.FC<VehicleScreenProps> = ({ token, onLogout }) => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [clickCount, setClickCount] = useState(0);
  const [showDebugPage, setShowDebugPage] = useState(false);

  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<any>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<number | 'all'>('all');
  const [loadingCourses] = useState(new Set<string>());

  const [offlineGPSCount, setOfflineGPSCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>('dark');

  const toast = useToast();

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedTheme = await themeService.initialize();
        setCurrentTheme(savedTheme);
        
        const storedVehicle = await getStoredVehicleNumber();
        if (storedVehicle && storedVehicle.trim() && storedVehicle.trim() !== 'IL02ADD') {
          setVehicleNumber(storedVehicle);
          if (token) {
            const response = await getVehicleCourses(storedVehicle, token);
            if (response && response.length > 0) {
              setCourses(response);
              setCoursesLoaded(true);
            }
          }
        }
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    initializeApp();
  }, [token]);

  // Load courses function
  const loadCourses = async (vehicleNum: string) => {
    if (!vehicleNum.trim()) {
      setError("Te rog introdu numărul vehiculului");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getVehicleCourses(vehicleNum, token);
      
      if (response && response.length > 0) {
        setCourses(response);
        setCoursesLoaded(true);
        await storeVehicleNumber(vehicleNum);
        setLastRefreshTime(new Date());
        toast.addToast('success', 'Curse încărcate!', `${response.length} curse disponibile pentru vehicul ${vehicleNum}`, 3000);
      } else {
        setError(`Nu există curse disponibile pentru vehiculul ${vehicleNum}`);
        setCourses([]);
        setCoursesLoaded(false);
      }
    } catch (error: any) {
      console.error('Eroare la încărcarea curselor:', error);
      setError(error.message || 'Eroare la încărcarea curselor');
      setCourses([]);
      setCoursesLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  // Course status update
  const updateCourseStatus = async (courseId: string, newStatus: number) => {
    try {
      console.log(`Actualizare status pentru cursă ${courseId}: ${newStatus}`);
      
      // Get real GPS coordinates
      let currentLat = 0, currentLng = 0, currentAlt = 0, currentAcc = 0, currentSpeed = 0, currentHeading = 0;
      
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 30000
        });
        
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;
        currentAlt = position.coords.altitude || 0;
        currentAcc = position.coords.accuracy || 0;
        currentSpeed = position.coords.speed || 0;
        currentHeading = position.coords.heading || 0;
      } catch (gpsError) {
        console.log('Nu s-au putut obține coordonate GPS pentru status');
      }
      
      const statusUpdateData = {
        uit: courseId,
        numar_inmatriculare: vehicleNumber,
        lat: currentLat,
        lng: currentLng,
        viteza: Math.round(currentSpeed * 3.6),
        directie: Math.round(currentHeading),
        altitudine: Math.round(currentAlt),
        hdop: Math.round(currentAcc),
        gsm_signal: await getNetworkSignal(),
        baterie: await getBatteryLevel(),
        status: newStatus,
        timestamp: new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      };
      
      const response = await CapacitorHttp.post({
        url: `${API_BASE_URL}gps.php`,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "User-Agent": "iTrack-StatusUpdate/1.0"
        },
        data: statusUpdateData
      });
      
      // Update Android GPS service
      if (window.AndroidGPS && window.AndroidGPS.updateStatus) {
        window.AndroidGPS.updateStatus(courseId, newStatus, vehicleNumber);
      }
      
      // Update local state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.uit === courseId ? { ...course, status: newStatus } : course
        )
      );
      
      console.log(`Status actualizat cu succes pentru ${courseId}`);
      return true;
      
    } catch (error) {
      console.error(`Eroare actualizare status pentru ${courseId}:`, error);
      throw error;
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      if (window.AndroidGPS && window.AndroidGPS.clearAllOnLogout) {
        window.AndroidGPS.clearAllOnLogout();
      }
      
      await logout(token);
      await clearToken();
      onLogout();
    } catch (error) {
      console.error('Eroare la logout:', error);
      onLogout();
    }
  };

  // Theme change handler
  const handleThemeChange = async (theme: Theme) => {
    try {
      await themeService.setTheme(theme);
      setCurrentTheme(theme);
      toast.addToast('success', 'Tema schimbată!', `Tema "${THEME_INFO[theme].name}" a fost aplicată cu succes.`, 3000);
    } catch (error) {
      console.error('Error changing theme:', error);
      toast.addToast('error', 'Eroare temă', 'Nu s-a putut schimba tema. Încercați din nou.', 4000);
    }
  };

  // Filter courses based on selected status
  const filteredCourses = selectedStatusFilter === 'all' 
    ? courses 
    : courses.filter(course => course.status === selectedStatusFilter);

  return (
    <div className={`vehicle-screen ${coursesLoaded ? "courses-loaded" : ""} theme-${currentTheme}`} style={{
      paddingTop: coursesLoaded ? 'env(safe-area-inset-top)' : '0'
    }}>
      {!coursesLoaded ? (
        <div style={{
          minHeight: '100dvh',
          background: currentTheme === 'dark' 
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #374151 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', paddingTop: '60px', paddingBottom: '40px' }}>
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
              boxShadow: '0 8px 32px rgba(14, 165, 233, 0.4)'
            }}>
              <i className="fas fa-truck"></i>
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 12px 0'
            }}>
              iTrack GPS
            </h1>
            <p style={{
              fontSize: '18px',
              color: currentTheme === 'dark' ? '#94a3b8' : '#64748b',
              margin: 0
            }}>
              Monitorizare Profesională Fleet
            </p>
          </div>

          {/* Vehicle Input */}
          <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
              <VehicleNumberDropdown
                vehicleNumber={vehicleNumber}
                onVehicleChange={setVehicleNumber}
                onLoadCourses={loadCourses}
                loading={loading}
                error={error}
                currentTheme={currentTheme}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
              <button
                onClick={() => setShowSettings(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: currentTheme === 'dark' ? '#f1f5f9' : '#1e293b',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-cog"></i>
              </button>
              <button
                onClick={() => setShowAbout(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: currentTheme === 'dark' ? '#f1f5f9' : '#1e293b',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-info-circle"></i>
              </button>
            </div>
            <p style={{
              fontSize: '14px',
              color: currentTheme === 'dark' ? '#64748b' : '#94a3b8',
              margin: 0
            }}>
              © 2024 iTrack Professional v2.1
            </p>
          </div>
        </div>
      ) : (
        <div style={{ minHeight: '100vh', padding: '20px' }}>
          {/* Header cu cursele încărcate */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ color: currentTheme === 'dark' ? '#f1f5f9' : '#1e293b', marginBottom: '10px' }}>
              Vehicul: {vehicleNumber}
            </h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => setSelectedStatusFilter('all')} style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: selectedStatusFilter === 'all' ? '2px solid #0ea5e9' : '1px solid #ccc',
                background: selectedStatusFilter === 'all' ? '#0ea5e9' : 'transparent',
                color: selectedStatusFilter === 'all' ? 'white' : (currentTheme === 'dark' ? '#f1f5f9' : '#1e293b'),
                cursor: 'pointer'
              }}>
                Toate ({courses.length})
              </button>
              <button onClick={() => setSelectedStatusFilter(2)} style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: selectedStatusFilter === 2 ? '2px solid #10b981' : '1px solid #ccc',
                background: selectedStatusFilter === 2 ? '#10b981' : 'transparent',
                color: selectedStatusFilter === 2 ? 'white' : (currentTheme === 'dark' ? '#f1f5f9' : '#1e293b'),
                cursor: 'pointer'
              }}>
                Active ({courses.filter(c => c.status === 2).length})
              </button>
              <button onClick={() => setSelectedStatusFilter(3)} style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: selectedStatusFilter === 3 ? '2px solid #f59e0b' : '1px solid #ccc',
                background: selectedStatusFilter === 3 ? '#f59e0b' : 'transparent',
                color: selectedStatusFilter === 3 ? 'white' : (currentTheme === 'dark' ? '#f1f5f9' : '#1e293b'),
                cursor: 'pointer'
              }}>
                Pauză ({courses.filter(c => c.status === 3).length})
              </button>
            </div>
          </div>

          {/* Lista de curse */}
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredCourses.map(course => (
              <CourseDetailCard
                key={course.uit}
                course={course}
                onStatusUpdate={(newStatus) => updateCourseStatus(course.uit, newStatus)}
                loading={loadingCourses.has(course.uit)}
                currentTheme={currentTheme}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px' 
          }}>
            <button
              onClick={() => loadCourses(vehicleNumber)}
              style={{
                background: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '15px',
                fontSize: '18px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.4)'
              }}
            >
              <i className="fas fa-sync-alt"></i>
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '15px',
                fontSize: '18px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
              }}
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: currentTheme === 'dark' ? '#1e293b' : 'white',
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ color: currentTheme === 'dark' ? '#f1f5f9' : '#1e293b', marginBottom: '20px' }}>
              Confirmare Logout
            </h3>
            <p style={{ color: currentTheme === 'dark' ? '#94a3b8' : '#64748b', marginBottom: '30px' }}>
              Ești sigur că vrei să te deconectezi?
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: currentTheme === 'dark' ? '#f1f5f9' : '#1e293b',
                  cursor: 'pointer'
                }}
              >
                Anulează
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#ef4444',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastNotification
        toasts={toast.toasts}
        onRemove={toast.removeToast}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        currentTheme={currentTheme === 'dark' ? 'dark' : 'light'}
      />
    </div>
  );
}

export default VehicleScreen;