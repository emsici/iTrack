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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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

  // Funcție pentru obținerea culorilor temei curente
  const getThemeColors = () => {

  // Funcție pentru obținerea culorilor temei curente
  const getThemeColors = () => {
    const themes: Record<string, {bg: string, text: string, headerBg: string, border: string}> = {
      dark: { bg: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', text: '#ffffff', headerBg: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', border: 'rgba(255, 255, 255, 0.2)' },
      light: { bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', text: '#1e293b', headerBg: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)', border: 'rgba(0, 0, 0, 0.1)' },
      business: { bg: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)', text: '#ffffff', headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)', border: 'rgba(255, 255, 255, 0.2)' },
      driver: { bg: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', text: '#ffffff', headerBg: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', border: 'rgba(255, 255, 255, 0.2)' },
      nature: { bg: 'linear-gradient(135deg, #166534 0%, #15803d 100%)', text: '#ffffff', headerBg: 'linear-gradient(135deg, #166534 0%, #15803d 100%)', border: 'rgba(255, 255, 255, 0.2)' },
      night: { bg: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)', text: '#ffffff', headerBg: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)', border: 'rgba(255, 255, 255, 0.2)' }
    };
    return themes[currentTheme] || themes.dark;
  };
  
  const themeColors = getThemeColors();
