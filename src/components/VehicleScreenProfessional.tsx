import React, { useState, useEffect, useRef } from "react";
import { Geolocation } from '@capacitor/geolocation';
import { CapacitorHttp } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Course } from "../types";
import { getVehicleCourses, logout, API_BASE_URL } from "../services/api";
import { clearToken, storeVehicleNumber, getStoredVehicleNumber, clearStoredVehicleNumber } from "../services/storage";
import { logAPI } from "../services/appLogger";

import CourseStatsModal from "./CourseStatsModal";
import CourseDetailCard from "./CourseDetailCard";
import AdminPanel from "./AdminPanel";
import ToastNotification from "./ToastNotification";
import { useToast } from "../hooks/useToast";
import SettingsModal from "./SettingsModal";
import AboutModal from "./AboutModal";
import VehicleNumberDropdown from "./VehicleNumberDropdown";
import { themeService, Theme } from "../services/themeService";

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

// Urmărirea curselor active - pentru Android BackgroundGPSService (gestionată în serviciul nativ)

// Funcții GPS Android directe - BackgroundGPSService gestionează totul nativ
const updateCourseStatus = async (courseId: string, courseUit: string, newStatus: number, authToken: string, vehicleNumber: string) => {
  try {
    // PASUL 1: Actualizează serverul prin API
    console.log(`🌐 === TRIMITERE ACTUALIZARE STATUS ===`);
    console.log(`📊 Course ID (unic): ${courseId}`);
    console.log(`📊 UIT (server): ${courseUit}`);
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
      uit: courseUit,
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
    
    console.log(`✅ STATUS ${newStatus} TRIMIS CU SUCCES LA SERVER: ${response.status}`);
    console.log(`📊 Răspuns server:`, response.data);
    console.log(`🎯 SUCCES COMPLET pentru UIT ${courseUit} - Nu se mai trimite nimic!`);
    
    // CRITICAL FIX: NU TRIMITE ANDROID UPDATE AICI - se făcea DUPLICATE!
    // AndroidGPS update se face DOAR în funcțiile GPS start/stop din onStatusUpdate
    console.log(`🚫 SKIP Android update - se gestionează în onStatusUpdate GPS logic`);
    
    return `SUCCES: Status ${newStatus} actualizat pentru ${courseUit}`;
    
  } catch (error) {
    console.error(`❌ EROARE SERVER pentru status ${newStatus} - UIT ${courseUit}:`, error);
    
    // CRITICAL FIX: NU TRIMITE ANDROID UPDATE AICI - cauza DUPLICATE!
    // Serviciul Android se gestionează prin GPS start/stop logic DOAR
    console.log(`🚫 SKIP Android fallback - evit duplicate status transmission`);
    
    console.warn('Server update failed - aplicația va continua cu UI update local');
    throw error;
  }
};

const startAndroidGPS = (course: Course, vehicleNumber: string, token: string) => {
  console.log("🚀 === SENIOR SAFE GPS START ===");
  
  // SENIOR DEVELOPER FIX: Comprehensive safety checks
  if (!course) {
    console.error("❌ SAFETY CHECK FAILED: Course object is null/undefined");
    return "ERROR: Invalid course object";
  }
  
  if (!course.ikRoTrans && !course.uit) {
    console.error("❌ SAFETY CHECK FAILED: Course missing both ikRoTrans and uit");
    return "ERROR: Course missing identifiers";
  }
  
  if (!vehicleNumber?.trim()) {
    console.error("❌ SAFETY CHECK FAILED: Vehicle number is empty");
    return "ERROR: Invalid vehicle number";
  }
  
  if (!token?.trim()) {
    console.error("❌ SAFETY CHECK FAILED: Auth token is empty");
    return "ERROR: Invalid auth token";
  }
  
  console.log("📱 SAFE Android Bridge Check:", {
    androidGpsAvailable: !!(window.AndroidGPS),
    startGPSFunction: !!(window.AndroidGPS?.startGPS),
    courseId: course.id,
    ikRoTrans: course.ikRoTrans,
    realUIT: course.uit,
    vehicleNumber: vehicleNumber
  });
  
  if (window.AndroidGPS && window.AndroidGPS.startGPS) {
    console.log("✅ AndroidGPS.startGPS disponibil - pornesc BackgroundGPSService");
    console.log("📋 IMPORTANT: BackgroundGPSService acceptă MULTIPLE curse - se adaugă la lista activă");
    console.log("🔄 Fiecare cursă ACTIVĂ (status 2) va fi urmărită simultan cu același GPS");
    
    // Folosește ikRoTrans ca identificator unic pentru HashMap Android
    const ikRoTransKey = course.ikRoTrans ? String(course.ikRoTrans) : course.uit;
    
    const result = window.AndroidGPS.startGPS(
      ikRoTransKey,              // ikRoTrans ca identificator unic
      vehicleNumber,
      course.uit,                // UIT-ul real pentru server
      token,
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

const stopAndroidGPS = (course: Course) => {
  console.log("🛑 === SENIOR SAFE GPS STOP ===");
  
  // SENIOR DEVELOPER FIX: Comprehensive safety checks
  if (!course) {
    console.error("❌ SAFETY CHECK FAILED: Course object is null/undefined");
    return "ERROR: Invalid course object";
  }
  
  if (!course.ikRoTrans && !course.uit) {
    console.error("❌ SAFETY CHECK FAILED: Course missing both ikRoTrans and uit");
    return "ERROR: Course missing identifiers";
  }
  
  console.log("📱 SAFE Android Bridge Check:", {
    androidGpsAvailable: !!(window.AndroidGPS),
    stopGPSFunction: !!(window.AndroidGPS?.stopGPS),
    courseId: course.id,
    ikRoTrans: course.ikRoTrans,
    uit: course.uit
  });
  
  if (window.AndroidGPS && window.AndroidGPS.stopGPS) {
    console.log("✅ AndroidGPS.stopGPS disponibil - opresc BackgroundGPSService pentru cursă");
    
    // Folosește ikRoTrans ca identificator unic pentru HashMap Android
    const ikRoTransKey = course.ikRoTrans ? String(course.ikRoTrans) : course.uit;
    
    const result = window.AndroidGPS.stopGPS(ikRoTransKey);
    
    console.log("🔥 BackgroundGPSService Stop Result:", result);
    console.log("📊 GPS service a oprit urmărirea pentru această cursă specifică");
    return result;
  } else {
    console.error("❌ AndroidGPS.stopGPS nu este disponibil!");
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
  const [clickCount, setClickCount] = useState(0);
  const [showDebugPage, setShowDebugPage] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<number | 'all'>('all');
  
  // SENIOR DEVELOPER FIX: Race condition protection și concurrency control
  const [loadingCourses, setLoadingCourses] = useState(new Set<string>());
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentVehicleRef = useRef<string>('');

  // Offline GPS count handled by BackgroundGPSService natively
  const [offlineGPSCount] = useState(0);
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
              console.log('⚠️ Nu s-au putut încărca cursele automat:', error);
            }
          } else {
            console.log('⚠️ Nu pot auto-încărca cursele - lipsește token-ul');
          }
        } else {
          console.log('ℹ️ PRIMA INSTALARE sau vehicul invalid - se va cere input');
          // Pentru prima instalare sau dacă vehiculul stocat este invalid (IL02ADD), forțează afișarea paginii de input
          if (storedVehicle && (storedVehicle.trim() === 'IL02ADD' || storedVehicle.trim().length <= 2)) {
            console.log(`🗑️ Vehicul invalid "${storedVehicle}" șters din storage`);
            await clearStoredVehicleNumber();
          }
          setCoursesLoaded(false);
          setVehicleNumber('');
        }
      } catch (error) {
        console.error('Eroare la inițializarea aplicației:', error);
      }
    };
    
    initializeApp();
  }, []); // Empty dependency array - runs only once on mount

  // SENIOR DEVELOPER FIX: Memory leak protection și cleanup
  useEffect(() => {
    // Update current vehicle ref for race condition protection
    currentVehicleRef.current = vehicleNumber;
    
    return () => {
      // CRITICAL: Cancel any pending API requests when vehicleNumber changes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        console.log('🔧 CLEANUP: API requests cancelled for vehicle switch');
      }
      
      // Clear loading states
      setLoadingCourses(new Set());
      console.log('🔧 CLEANUP: Loading states cleared');
    };
  }, [vehicleNumber, token, coursesLoaded, offlineGPSCount]);

  // SENIOR DEVELOPER FIX: Race condition protected course loading
  const handleLoadCourses = async () => {
    if (!vehicleNumber.trim()) {
      setError("Te rog să introduci un număr de înmatriculare valid");
      setLoading(false);
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const currentRequest = vehicleNumber; // Capture current vehicle for validation

    setLoading(true);
    setError("");
    console.log(`🔍 ÎNCEPUT ÎNCĂRCARE: ${vehicleNumber}`);
    
    try {
      const response = await getVehicleCourses(vehicleNumber, token);
      
      // CRITICAL: Validate that vehicle hasn't changed during API call
      if (currentRequest !== currentVehicleRef.current) {
        console.log(`🚫 RACE PREVENTED: Vehicle changed during API call (${currentRequest} → ${currentVehicleRef.current})`);
        setLoading(false);
        return; // Abandon this response
      }
      
      if (response && Array.isArray(response) && response.length > 0) {
        setCourses(response);
        setCoursesLoaded(true);
        
        // Store valid vehicle number pentru următoarea sesiune
        await storeVehicleNumber(vehicleNumber);
        console.log(`✅ SUCCESS: ${response.length} curse încărcate pentru ${vehicleNumber}`);
        
        // Log successful load
        await logAPI(`Curse încărcate: ${response.length} pentru ${vehicleNumber}`);
      } else {
        console.log(`⚠️ Nu s-au găsit curse pentru ${vehicleNumber}`);
        setError("Nu au fost găsite curse pentru acest vehicul");
        setCourses([]);
        setCoursesLoaded(false);
      }
    } catch (error) {
      // Only set error if this request is still current
      if (currentRequest === currentVehicleRef.current) {
        console.error(`❌ EROARE încărcare curse pentru ${vehicleNumber}:`, error);
        setError("Eroare la încărcarea curselor. Verifică conexiunea și încearcă din nou.");
        setCourses([]);
        setCoursesLoaded(false);
      }
    } finally {
      // GUARANTEED loading stop
      setTimeout(() => {
        setLoading(false);
        console.log(`🏁 LOADING STOP pentru ${currentRequest}`);
      }, 500);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all GPS tracking on logout
      await logoutClearAllGPS();
      
      // Clear stored data
      await clearToken();
      await clearStoredVehicleNumber();
      
      // Attempt server logout (non-blocking)
      try {
        await logout(token);
      } catch (logoutError) {
        console.warn('Server logout failed, continuing with local cleanup:', logoutError);
      }
      
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      onLogout(); // Force logout even if there are errors
    }
  };

  // Vehicle number input screen - design optimizat
  if (!coursesLoaded) {
    return (
      <div style={{ 
        minHeight: '100dvh',
        background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        paddingTop: 'max(env(safe-area-inset-top), 40px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 40px)'
      }}>
        <div style={{
          background: 'rgba(45, 55, 72, 0.98)',
          backdropFilter: 'blur(25px)',
          borderRadius: '24px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '800',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textAlign: 'center'
          }}>
            iTrack GPS
          </h2>
          <p style={{
            color: '#e2e8f0',
            textAlign: 'center',
            marginBottom: '32px',
            fontSize: '16px',
            opacity: 0.8
          }}>
            Selectează vehiculul pentru a începe
          </p>
          
          <input
            type="text"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
            placeholder="ex: IL02ABC"
            style={{
              width: '100%',
              background: 'rgba(74, 85, 104, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '18px 20px',
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              textAlign: 'center',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.border = '2px solid #3b82f6';
              e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.border = '2px solid rgba(255, 255, 255, 0.2)';
              e.target.style.boxShadow = 'none';
            }}
          />

          {vehicleNumber && (
            <p style={{
              color: '#94a3b8',
              fontSize: '15px',
              textAlign: 'center',
              marginTop: '20px',
              marginBottom: '0',
              background: 'rgba(59, 130, 246, 0.1)',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              Vehicul selectat: <strong style={{ color: '#60a5fa' }}>{vehicleNumber}</strong>
            </p>
          )}

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '16px',
              marginTop: '20px',
              color: '#fca5a5',
              fontSize: '15px',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLoadCourses}
            disabled={!vehicleNumber.trim() || loading}
            style={{
              width: '100%',
              background: !vehicleNumber.trim() || loading 
                ? '#4a5568'
                : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '18px',
              fontSize: '18px',
              fontWeight: '700',
              marginTop: '24px',
              cursor: !vehicleNumber.trim() || loading ? 'not-allowed' : 'pointer',
              boxShadow: !vehicleNumber.trim() || loading ? 'none' : '0 8px 24px rgba(59, 130, 246, 0.3)'
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Se încarcă cursele...
              </div>
            ) : (
              'Încarcă Cursele'
            )}
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#94a3b8',
              border: '2px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              marginTop: '16px',
              cursor: 'pointer'
            }}
          >
            Deconectare
          </button>
        </div>
      </div>
    );
  }

  // Main courses interface - Design conform poza originală
  return (
    <div style={{ 
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      color: '#ffffff'
    }}>
      {/* Header optimizat și frumos */}
      <div style={{ 
        paddingTop: 'max(env(safe-area-inset-top), 20px)', 
        background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ 
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo și titlu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '700',
              color: 'white'
            }}>
              i
            </div>
            <span style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff'
            }}>
              iTrack
            </span>
          </div>

          {/* Dropdown vehicul - afișează numărul selectat */}
          <VehicleNumberDropdown 
            currentVehicle={vehicleNumber}
            onVehicleSelect={async (number) => {
              console.log(`🔄 Vehicul selectat: ${number}`);
              setVehicleNumber(number);
              setCoursesLoaded(false);
              setCourses([]);
              setError('');
              setLoading(false); // Reset loading state
              
              // Delay mic pentru UI update, apoi încarcă cursele
              setTimeout(() => {
                handleLoadCourses();
              }, 100);
            }}
            theme="header"
          />
        </div>

        {/* Row cu butoane funcționalități - design frumos */}
        <div style={{
          padding: '0 24px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Settings */}
          <button 
            onClick={() => setShowSettings(true)}
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}>
            <i className="fas fa-cog" style={{ fontSize: '20px', color: '#e2e8f0' }}></i>
          </button>

          {/* Info */}
          <button 
            onClick={() => setShowAbout(true)}
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(66, 153, 225, 0.3)'
            }}>
            <i className="fas fa-info" style={{ fontSize: '20px', color: 'white' }}></i>
          </button>

          {/* Online indicator */}
          <div style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(72, 187, 120, 0.3)'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              background: '#ffffff',
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}></div>
          </div>

          {/* Stats/Analytics - design frumos */}
          <button 
            onClick={() => setShowStatsModal(true)}
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #805ad5 0%, #6b46c1 100%)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(128, 90, 213, 0.3)'
            }}>
            <i className="fas fa-chart-bar" style={{ fontSize: '20px', color: '#e2e8f0' }}></i>
          </button>
        </div>
      </div>

      {/* Grid cu carduri status - design optimizat și frumos */}
      <div style={{ 
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px'
      }}>
        {/* Card TOTAL */}
        <div 
          onClick={() => setSelectedStatusFilter('all')}
          style={{
            background: selectedStatusFilter === 'all' 
              ? 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)'
              : 'rgba(74, 85, 104, 0.3)',
            border: selectedStatusFilter === 'all' 
              ? '2px solid #4299e1' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: selectedStatusFilter === 'all' ? 'rgba(255, 255, 255, 0.2)' : '#4299e1',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-list" style={{ 
                  fontSize: '16px', 
                  color: selectedStatusFilter === 'all' ? 'white' : 'white'
                }}></i>
              </div>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: selectedStatusFilter === 'all' ? 'white' : '#cbd5e0'
              }}>
                TOTAL
              </span>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: selectedStatusFilter === 'all' ? 'white' : '#ffffff'
            }}>
              {courses.length}
            </div>
          </div>
        </div>

        {/* Card ACTIV */}
        <div 
          onClick={() => setSelectedStatusFilter(2)}
          style={{
            background: selectedStatusFilter === 2 
              ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)'
              : 'rgba(74, 85, 104, 0.3)',
            border: selectedStatusFilter === 2 
              ? '2px solid #48bb78' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: selectedStatusFilter === 2 ? 'rgba(255, 255, 255, 0.2)' : '#48bb78',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-play" style={{ 
                  fontSize: '16px', 
                  color: 'white'
                }}></i>
              </div>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: selectedStatusFilter === 2 ? 'white' : '#cbd5e0'
              }}>
                ACTIV
              </span>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: selectedStatusFilter === 2 ? 'white' : '#ffffff'
            }}>
              {courses.filter(c => c.status === 2).length}
            </div>
          </div>
        </div>

        {/* Card PAUZĂ */}
        <div 
          onClick={() => setSelectedStatusFilter(3)}
          style={{
            background: selectedStatusFilter === 3 
              ? 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)'
              : 'rgba(74, 85, 104, 0.3)',
            border: selectedStatusFilter === 3 
              ? '2px solid #ed8936' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: selectedStatusFilter === 3 ? 'rgba(255, 255, 255, 0.2)' : '#ed8936',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-pause" style={{ 
                  fontSize: '16px', 
                  color: 'white'
                }}></i>
              </div>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: selectedStatusFilter === 3 ? 'white' : '#cbd5e0'
              }}>
                PAUZĂ
              </span>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: selectedStatusFilter === 3 ? 'white' : '#ffffff'
            }}>
              {courses.filter(c => c.status === 3).length}
            </div>
          </div>
        </div>

        {/* Card DISPONIBIL */}
        <div 
          onClick={() => setSelectedStatusFilter(1)}
          style={{
            background: selectedStatusFilter === 1 
              ? 'linear-gradient(135deg, #805ad5 0%, #6b46c1 100%)'
              : 'rgba(74, 85, 104, 0.3)',
            border: selectedStatusFilter === 1 
              ? '2px solid #805ad5' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: selectedStatusFilter === 1 ? 'rgba(255, 255, 255, 0.2)' : '#805ad5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-circle" style={{ 
                  fontSize: '16px', 
                  color: 'white'
                }}></i>
              </div>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: selectedStatusFilter === 1 ? 'white' : '#cbd5e0'
              }}>
                DISPONIBIL
              </span>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: selectedStatusFilter === 1 ? 'white' : '#ffffff'
            }}>
              {courses.filter(c => c.status === 1).length}
            </div>
          </div>
        </div>
      </div>

      {/* Mesaj când nu există curse sau text informativ */}
      {courses.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#a0aec0'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(74, 85, 104, 0.3)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: '2px dashed rgba(255, 255, 255, 0.2)'
          }}>
            <i className="fas fa-ellipsis-v" style={{ fontSize: '24px', color: '#4299e1' }}></i>
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: '8px'
          }}>
            Nicio cursă găsită
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#a0aec0',
            lineHeight: '1.5'
          }}>
            Nu există curse pentru vehiculul selectat.
            <br />
            📍 Verifică numărul vehiculului sau <br />contactează administratorul.
          </p>
        </div>
      ) : (
        /* Lista de curse - design optimizat */
        <div style={{ padding: '0 24px 120px' }}>
          {(selectedStatusFilter === 'all' 
            ? courses 
            : courses.filter(c => c.status === selectedStatusFilter)
          ).map((course) => (
            <CourseDetailCard
              key={course.id}
              course={course}
              onStatusUpdate={async (courseId, courseUit, newStatus) => {
                // ULTIMATE PROTECTION: Dubla verificare pentru concurrency
                if (loadingCourses.has(courseId)) {
                  console.log(`🚫 CONCURRENCY BLOCK: Course ${courseId} update already in progress`);
                  toast.error('Actualizare în curs', 'Așteaptă finalizarea operației anterioare');
                  return;
                }
                
                // IMMEDIATE BLOCK: Setează loading înainte de orice altceva
                setLoadingCourses(prev => new Set([...prev, courseId]));
                
                try {
                  // Găsește cursa pentru GPS handling
                  const courseForGPS = courses.find(c => c.id === courseId);
                  const oldStatus = courseForGPS?.status;
                  
                  console.log(`🔄 PROTECTED STATUS UPDATE: ${oldStatus} → ${newStatus} pentru courseId: ${courseId}`);
                  
                  // SINGLE API CALL - NO optimistic update pentru a evita race conditions
                  await updateCourseStatus(courseId, courseUit, newStatus, token, vehicleNumber);
                  console.log(`✅ STATUS UPDATE SUCCESS: ${courseId} → ${newStatus}`);
                  
                  // Update UI DUPĂ success API
                  setCourses(prev => prev.map(c => 
                    c.id === courseId ? { ...c, status: newStatus } : c
                  ));
                  
                  // GPS HANDLING COMPLET pentru toate tranzițiile
                  if (courseForGPS) {
                    // PORNIRE GPS: start (1→2) sau resume (3→2)
                    if (newStatus === 2 && (oldStatus === 1 || oldStatus === 3)) {
                      console.log(`🚀 SAFE GPS START pentru cursă ${courseId} (${oldStatus}→2)`);
                      startAndroidGPS(courseForGPS, vehicleNumber, token);
                    }
                    
                    // OPRIRE GPS: pause (2→3), stop din activ (2→4), sau stop din pauză (3→4)
                    else if ((newStatus === 3 && oldStatus === 2) || 
                             (newStatus === 4 && (oldStatus === 2 || oldStatus === 3))) {
                      console.log(`🛑 SAFE GPS STOP pentru cursă ${courseId} (${oldStatus}→${newStatus})`);
                      stopAndroidGPS(courseForGPS);
                    }
                  }
                  
                } catch (error) {
                  console.error('PROTECTED Status update error:', error);
                  toast.error('Eroare actualizare status', 'Nu s-a putut actualiza statusul');
                } finally {
                  // Remove from loading set - GARANTAT
                  setLoadingCourses(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(courseId);
                    return newSet;
                  });
                }
              }}
              isLoading={loadingCourses.has(course.id)}
              currentTheme={currentTheme}
            />
          ))}
          
          {/* Mesaj când nu sunt curse pentru filtru specific */}
          {selectedStatusFilter !== 'all' && 
           courses.filter(c => c.status === selectedStatusFilter).length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#a0aec0',
              fontSize: '16px'
            }}>
              Nu sunt curse {
                selectedStatusFilter === 1 ? 'DISPONIBILE' :
                selectedStatusFilter === 2 ? 'ACTIVE' : 
                selectedStatusFilter === 3 ? 'ÎN PAUZĂ' : 'OPRITE'
              }
            </div>
          )}
          
          {/* Debug panel inline sub lista de curse */}
          {showDebugPage && (
            <div style={{ 
              margin: '20px 0',
              borderTop: '2px solid rgba(66, 153, 225, 0.3)',
              paddingTop: '20px'
            }}>
              <AdminPanel
                isOpen={true}
                onClose={() => setShowDebugPage(false)}
                currentTheme={currentTheme}
                isInline={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Footer premium cu timestamp și iconița stilizată pentru debug loguri */}
      <div style={{
        position: 'fixed',
        bottom: '0px',
        left: 0,
        right: 0,
        zIndex: 1000,
        background: currentTheme === 'dark' 
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)' 
          : 'linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.95) 100%)',
        backdropFilter: 'blur(25px)',
        borderTop: `2px solid ${currentTheme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
        padding: '20px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: currentTheme === 'dark' 
          ? '0 -10px 40px rgba(0, 0, 0, 0.3)' 
          : '0 -10px 40px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Timestamp partea stângă */}
        <div style={{
          fontSize: '12px',
          color: currentTheme === 'dark' ? '#94a3b8' : '#64748b',
          fontWeight: '500',
          letterSpacing: '0.5px'
        }}>
          v{new Date().toLocaleDateString('ro-RO')}
        </div>

        {/* Iconița debug centrală - stilizată premium */}
        <div
          onClick={() => {
            setClickCount(prev => {
              const newCount = prev + 1;
              
              if (newCount >= 50) {
                setShowDebugPage(true);
                setClickCount(0);
                toast.success('Debug Mode Activat!', 'Logurile apar sub cursele active');
              }
              
              return newCount;
            });
          }}
          style={{
            width: '32px',
            height: '32px',
            background: clickCount >= 30 
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
              : currentTheme === 'dark'
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: clickCount >= 30
              ? '0 8px 32px rgba(245, 158, 11, 0.4), 0 4px 16px rgba(245, 158, 11, 0.2)'
              : currentTheme === 'dark'
                ? '0 8px 32px rgba(59, 130, 246, 0.3), 0 4px 16px rgba(59, 130, 246, 0.1)'
                : '0 8px 32px rgba(99, 102, 241, 0.3), 0 4px 16px rgba(99, 102, 241, 0.1)',
            position: 'relative',
            border: clickCount >= 30 
              ? '2px solid rgba(245, 158, 11, 0.5)' 
              : '2px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Iconița principală */}
          <i className={clickCount >= 30 ? "fas fa-bug" : "fas fa-code"} style={{
            fontSize: '12px',
            color: '#ffffff'
          }}></i>
          
          {/* Badge cu numărul de click-uri */}
          {clickCount >= 20 && (
            <div style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: clickCount >= 40 
                ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' 
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              fontSize: '10px',
              padding: '3px 6px',
              borderRadius: '8px',
              fontWeight: '700',
              minWidth: '20px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              border: '1.5px solid rgba(255, 255, 255, 0.3)'
            }}>
              {clickCount}
            </div>
          )}
          

        </div>

        {/* Status partea dreaptă cu iconiță */}
        <div style={{
          fontSize: '12px',
          color: currentTheme === 'dark' ? '#94a3b8' : '#64748b',
          fontWeight: '500',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {showDebugPage ? (
            <>
              <i className="fas fa-tools" style={{ fontSize: '10px' }}></i>
              <span>Debug</span>
            </>
          ) : (
            'iTrack'
          )}
        </div>
      </div>

      {/* TOATE MODALURILE */}
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
        currentTheme={currentTheme}
      />

      <CourseStatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        courses={courses}
        vehicleNumber={vehicleNumber}
        currentTheme={currentTheme}
      />

      <ToastNotification
        toasts={toast.toasts}
        onRemove={toast.removeToast}
      />
    </div>
  );
};

export default VehicleScreen;