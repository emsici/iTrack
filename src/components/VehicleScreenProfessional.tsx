import React, { useState, useEffect } from "react";
import { Geolocation } from '@capacitor/geolocation';
import { CapacitorHttp } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Course } from "../types";
import { getVehicleCourses, logout, API_BASE_URL } from "../services/api";

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

// Urmărirea curselor active - pentru Android BackgroundGPSService  
let activeCourses = new Map<string, Course>();

// Funcții GPS Android directe - BackgroundGPSService gestionează totul nativ
const updateCourseStatus = async (courseId: string, newStatus: number, authToken: string, vehicleNumber: string) => {
  try {
    // PASUL 1: Actualizează serverul prin API
    console.log(`🌐 === TRIMITERE ACTUALIZARE STATUS ===`);
    console.log(`📊 UIT: ${courseId}`);
    console.log(`📋 Status Nou: ${newStatus} (2=ACTIV, 3=PAUZA, 4=STOP)`);
    console.log(`🔑 Lungime Token: ${authToken?.length || 0}`);
    console.log(`🚛 Numărul Vehiculului: ${vehicleNumber}`);
    console.log(`🎯 IMPORTANT: Serverul cere coordonate GPS reale pentru răspuns 200!`);
    
    // Obține coordonate GPS reale pentru status update
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
      
      console.log(`📍 GPS reale obținute pentru status ${newStatus}: ${currentLat}, ${currentLng}`);
    } catch (gpsError) {
      console.log(`⚠️ Nu s-au putut obține coordonate GPS pentru status ${newStatus}, folosesc valori default`);
    }
    
    // EXACT ACEEAȘI ORDINE CA BACKGROUNDGPSSERVICE pentru a primi răspuns 200
    const statusUpdateData = {
      uit: courseId,
      numar_inmatriculare: vehicleNumber,
      lat: currentLat,
      lng: currentLng,  
      viteza: Math.round(currentSpeed * 3.6), // m/s to km/h ca în BackgroundGPSService
      directie: Math.round(currentHeading),
      altitudine: Math.round(currentAlt),
      hdop: Math.round(currentAcc),
      gsm_signal: await getNetworkSignal(),
      baterie: await getBatteryLevel(),  // Baterie reală din device
      status: newStatus,
      timestamp: new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
    };
    
    console.log(`📤 === STRUCTURA COMPLETĂ CA GPS PENTRU STATUS ${newStatus} ===`);
    console.log(`📤 Toate câmpurile completate ca BackgroundGPSService + headers identice pentru răspuns 200:`, JSON.stringify(statusUpdateData, null, 2));
    
    // CORECTARE CRITICĂ: TOATE actualizările de status merg la gps.php (vehicul.php doar pentru interogări curse)
    // Folosește API_BASE_URL centralizat din configurație (detectează automat etsm_prod vs etsm3)
    const endpoint = `${API_BASE_URL}gps.php`;
    
    console.log(`🎯 SELECTARE ENDPOINT: TOATE actualizările de status → gps.php`);
    console.log(`📋 gps.php = actualizări status | vehicul.php = doar interogări curse`);
    console.log(`🌐 URL API de bază: ${API_BASE_URL} (configurație centralizată)`);
    
    const response = await CapacitorHttp.post({
      url: endpoint,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        "Accept": "application/json",
        "User-Agent": "iTrack-StatusUpdate/1.0"
      },
      data: statusUpdateData
    });
    
    console.log(`✅ Actualizarea statusului pe server cu succes: ${response.status}`);
    console.log(`📊 Răspuns server complet:`, response.data);
    console.log(`📋 Tip răspuns pentru STATUS ${newStatus}:`, typeof response.data);
    console.log(`📊 Response headers:`, response.headers);
    console.log(`🎯 STATUS ${newStatus} TRIMIS CU SUCCES PENTRU UIT ${courseId}`);
    
    // PASUL 2: Actualizează serviciul GPS Android
    if (window.AndroidGPS && window.AndroidGPS.updateStatus) {
      const androidResult = window.AndroidGPS.updateStatus(courseId, newStatus, vehicleNumber);
      console.log(`📱 Serviciul GPS Android actualizat: ${androidResult}`);
      return androidResult;
    }
    
    return `SUCCES: Status ${newStatus} actualizat pentru ${courseId}`;
    
  } catch (error) {
    console.error(`❌ Actualizarea statusului a eșuat pentru ${courseId}:`, error);
    
    // Încearcă totuși serviciul Android chiar dacă serverul eșuează
    if (window.AndroidGPS && window.AndroidGPS.updateStatus) {
      const androidResult = window.AndroidGPS.updateStatus(courseId, newStatus, vehicleNumber);
      console.log(`📱 Serviciul GPS Android actualizat (offline): ${androidResult}`);
      return androidResult;
    }
    
    console.warn('Interfața AndroidGPS nu este disponibilă - mod browser');
    throw error;
  }
};

const startAndroidGPS = (course: Course, vehicleNumber: string, token: string) => {
  console.log(`🚀 === GPS START === Pornirea GPS pentru cursă: ${course.id}`);
  console.log(`📍 Detalii cursă:`);
  console.log(`   - ID Cursă (ikRoTrans): ${course.id}`);
  console.log(`   - UIT Real: ${course.uit}`);
  console.log(`   - Vehicul: ${vehicleNumber}`);
  console.log(`   - Status: ${course.status}`);
  console.log(`   - Token length: ${token?.length || 0}`);
  
  if (window.AndroidGPS && window.AndroidGPS.startGPS) {
    console.log(`🔗 Apelează AndroidGPS.startGPS cu parametrii:`);
    console.log(`   - courseId (ikRoTrans pentru HashMap): "${course.id}"`);
    console.log(`   - vehicleNumber: "${vehicleNumber}"`);  
    console.log(`   - realUit (UIT pentru server): "${course.uit}"`);
    console.log(`   - token: "${token?.substring(0, 20) || 'MISSING'}..."`);
    console.log(`   - status: ${course.status}`);
    
    // CRITICĂ: Trimite ikRoTrans ca courseId (key HashMap), dar UIT real ca extra pentru server
    const result = window.AndroidGPS.startGPS(
      course.id,      // courseId = ikRoTrans pentru HashMap în BackgroundGPSService 
      vehicleNumber,  // vehicleNumber pentru transmisia GPS
      course.uit,     // realUit pentru transmisia către server
      token,         // token Bearer pentru autentificare
      2
    );
    
    console.log("🔥 BackgroundGPSService Result:", result);
    console.log("📊 GPS service va urmări toate cursele active cu același set de coordonate");
    return result;
  } else {
    console.error("❌ AndroidGPS.startGPS nu este disponibil!");
    console.error("🔍 window.AndroidGPS:", window.AndroidGPS);
    return "ERROR: AndroidGPS not available";
  }
};

const logoutClearAllGPS = async () => {
  if (window.AndroidGPS && window.AndroidGPS.clearAllOnLogout) {
    return window.AndroidGPS.clearAllOnLogout();
  }
  console.warn('AndroidGPS interface not available - browser mode');
};

import { clearToken, storeVehicleNumber, getStoredVehicleNumber, clearStoredVehicleNumber } from "../services/storage";
// BackgroundGPSService handles offline GPS natively - no separate service needed
import { logAPI, logAPIError } from "../services/appLogger";
import { courseAnalyticsService } from "../services/courseAnalytics";
// Analytics imports removed - unused
import CourseStatsModal from "./CourseStatsModal";
import CourseDetailCard from "./CourseDetailCard";
import AdminPanel from "./AdminPanel";

// import OfflineSyncMonitor from "./OfflineSyncMonitor"; // UNUSED - offline sync logic în main component
import ToastNotification from "./ToastNotification";

import { useToast } from "../hooks/useToast";
// garanteedGPS eliminat complet - folosim doar BackgroundGPSService
import SettingsModal from "./SettingsModal";
import AboutModal from "./AboutModal";
import VehicleNumberDropdown from "./VehicleNumberDropdown";
// SimpleGPSIndicator removed per user request
import { themeService, Theme, THEME_INFO } from "../services/themeService";

// Funcții globale pentru senzori reali - utilizate în updateCourseStatus și startGPSForActiveCourses
const getBatteryLevel = async (): Promise<string> => {
  try {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      return `${Math.round(battery.level * 100)}%`;
    }
    return "75%"; // Default if battery API not available  
  } catch {
    return "75%";
  }
};

const getNetworkSignal = async (): Promise<number> => {
  try {
    // Try Capacitor Network plugin for connection type
    const networkStatus = await Network.getStatus();
    
    if (!networkStatus.connected) {
      return 0; // No connection = no GSM signal
    }
    
    const connectionType = networkStatus.connectionType;
    
    // GSM Signal reprezintă doar rețeaua CELULARĂ, nu WiFi
    if (connectionType === 'wifi') {
      return 0; // WiFi nu este GSM - nu are semnal cellular
    } else if (connectionType === 'cellular') {
      // Pentru cellular generic, estimez signal bazat pe browser API
      try {
        const connection = (navigator as any).connection || 
                          (navigator as any).mozConnection || 
                          (navigator as any).webkitConnection;
        
        if (connection && connection.effectiveType) {
          switch (connection.effectiveType) {
            case '5g': return 5; // 5G = semnal GSM excelent
            case '4g': return 4; // 4G = semnal GSM bun
            case '3g': return 3; // 3G = semnal GSM moderat  
            case '2g': return 2; // 2G = semnal GSM slab
            case 'slow-2g': return 1; // 2G lent = semnal GSM foarte slab
            default: return 3; // Default pentru cellular necunoscut
          }
        }
      } catch (browserError) {
        console.log('Browser effective type not available');
      }
      
      return 3; // Default pentru cellular fără detalii
    } else {
      return 2; // Alt tip de conexiune = semnal GSM moderat
    }
  } catch (error) {
    console.error('Network status check failed:', error);
    return 2; // Default pe eroare
  }
};

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

  // Offline GPS count handled by BackgroundGPSService natively
  const [offlineGPSCount, setOfflineGPSCount] = useState(0);
  // Offline sync monitoring handled by OfflineSyncMonitor component
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>('dark');

  const toast = useToast();

  // PERFORMANCE OPTIMIZED: Initialize theme and vehicle number with debouncing
  useEffect(() => {
    let mounted = true;
    const initializeApp = async () => {
      try {
        // Initialize theme with caching
        const savedTheme = await themeService.initialize();
        if (mounted) {
          setCurrentTheme(savedTheme);
        }
        
        // Load stored vehicle number DOAR dacă există și este valid (nu pentru prima instalare)
        const storedVehicle = await getStoredVehicleNumber();
        // CRITICĂ: Elimină orice număr de vehicul predefinit/invalid (inclusiv IL02ADD)
        const isValidStoredVehicle = storedVehicle && 
                                   storedVehicle.trim() && 
                                   storedVehicle.trim() !== 'IL02ADD' && 
                                   storedVehicle.trim() !== 'undefined' && 
                                   storedVehicle.trim() !== 'null' &&
                                   storedVehicle.trim().length > 2;
        
        if (isValidStoredVehicle && mounted) {
          console.log('✅ Vehicul stocat valid găsit:', storedVehicle);
          setVehicleNumber(storedVehicle!);
          
          // AUTO-LOAD courses pentru vehiculul stocat DOAR dacă avem token valid
          if (token) {
            try {
              console.log('🔄 Auto-loading courses pentru vehicul stocat:', storedVehicle);
              const response = await getVehicleCourses(storedVehicle, token);
              if (response && response.length > 0) {
                setCourses(response);
                setCoursesLoaded(true);
                console.log('✅ Cursele vehiculului încărcate automat:', response.length);
              } else {
                console.log('⚠️ Vehiculul stocat nu are curse disponibile');
              }
            } catch (error) {
              console.log('⚠️ Eroare auto-loading curse pentru vehicul stocat:', error);
            }
          }
        }
      } catch (error) {
        console.error('Eroare inițializare aplicație:', error);
      }
    };

    initializeApp();
    return () => {
      mounted = false;
    };
  }, [token]);

  // Return JSX pentru aplicația completă
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
          backgroundAttachment: 'fixed',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Logo și input pentru vehicul */}
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
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
            <h1 style={{ color: currentTheme === 'dark' ? '#f1f5f9' : '#1e293b', marginBottom: '32px' }}>
              iTrack GPS Professional
            </h1>
            
            <VehicleNumberDropdown
              onVehicleSelect={async (selectedVehicle) => {
                console.log('Vehicle selected:', selectedVehicle);
                setVehicleNumber(selectedVehicle);
                setLoading(true);
                setError("");
                
                try {
                  const response = await getVehicleCourses(selectedVehicle, token);
                  if (response && response.length > 0) {
                    setCourses(response);
                    setCoursesLoaded(true);
                    await storeVehicleNumber(selectedVehicle);
                  }
                } catch (error) {
                  console.error('Error loading courses:', error);
                  setError("Eroare încărcare curse");
                } finally {
                  setLoading(false);
                }
              }}
              currentTheme={currentTheme}
              loading={loading}
            />
            
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '12px',
                marginTop: '16px',
                color: '#dc2626'
              }}>
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Main courses interface */}
          <div style={{ padding: '20px' }}>
            <h2 style={{ color: currentTheme === 'dark' ? '#f1f5f9' : '#1e293b' }}>
              Curse Active - {vehicleNumber}
            </h2>
            
            {/* Course cards */}
            <div style={{ marginTop: '20px' }}>
              {courses.map((course) => (
                <CourseDetailCard
                  key={course.id}
                  course={course}
                  vehicleNumber={vehicleNumber}
                  token={token}
                  onStatusChange={async (courseId, newStatus) => {
                    try {
                      await updateCourseStatus(courseId, newStatus, token, vehicleNumber);
                      // Update local state
                      setCourses(prev => prev.map(c => 
                        c.id === courseId ? { ...c, status: newStatus } : c
                      ));
                    } catch (error) {
                      console.error('Error updating course status:', error);
                    }
                  }}
                  onStartGPS={(course) => {
                    startAndroidGPS(course, vehicleNumber, token);
                  }}
                  currentTheme={currentTheme}
                />
              ))}
            </div>
          </div>

          {/* Settings and About modals */}
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            currentTheme={currentTheme}
            onThemeChange={async (theme) => {
              await themeService.setTheme(theme);
              setCurrentTheme(theme);
            }}
          />

          <AboutModal
            isOpen={showAbout}
            onClose={() => setShowAbout(false)}
            currentTheme={currentTheme === 'dark' ? 'dark' : 'light'}
          />

          {/* Toast Notifications */}
          <ToastNotification
            toasts={toast.toasts}
            onRemove={toast.removeToast}
          />
        </>
      )}
    </div>
  );
};

export default VehicleScreen;