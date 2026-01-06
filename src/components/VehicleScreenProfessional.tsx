import React, { useState, useEffect, useRef } from "react";
import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { Course } from "../types";
import { getVehicleCourses, logout, sendGPSData } from "../services/api";
import { clearToken, storeVehicleNumber, getStoredVehicleNumber, clearStoredVehicleNumber } from "../services/storage";
import { logAPI } from "../services/appLogger";

import CourseStatsModal from "./CourseStatsModal";
import CourseDetailCard from "./CourseDetailCard";
import AdminPanel from "./AdminPanel";
import SettingsModal from "./SettingsModal";
import AboutModal from "./AboutModal";
import CourseDetailsModal from "./CourseDetailsModal";
import VehicleNumberDropdown from "./VehicleNumberDropdown";
import { themeService, Theme } from "../services/themeService";
import { courseAnalyticsService } from "../services/courseAnalytics";
import { offlineGPSService } from "../services/offlineGPS";
import OfflineSyncMonitor from "./OfflineSyncMonitor";
import { courseStateManager } from "../services/courseStateManager";
import nativeNotificationService from "../services/nativeNotifications";

// Interfață TypeScript pentru AndroidGPS și iOSGPS bridge
declare global {
  interface Window {
    AndroidGPS?: {
      startGPS: (ikRoTrans: string, vehicleNumber: string, realUit: string, token: string, status: number) => string;
      stopGPS: (courseId: string) => string;
      updateStatus: (courseId: string, status: number, vehicleNumber: string) => string;
      clearAllOnLogout: () => string;
      markManualPause: (ikRoTrans: string) => string;
      // Handler pentru mesaje GPS din serviciul Android
      onGPSMessage?: (message: string) => void;
      // Native notification methods
      showPersistentNotification?: (title: string, message: string, persistent: boolean) => Promise<void>;
      hidePersistentNotification?: () => Promise<void>;
      showQuickNotification?: (title: string, message: string, duration: number) => Promise<void>;
    };
    // iOS GPS Bridge (identic cu AndroidGPS)
    iOSGPS?: {
      startGPS: (ikRoTrans: string, vehicleNumber: string, realUit: string, token: string, status: number) => Promise<string>;
      stopGPS: (courseId: string) => Promise<string>;
      updateStatus: (courseId: string, status: number, vehicleNumber: string) => Promise<string>;
      clearAllOnLogout: () => Promise<string>;
      markManualPause: (ikRoTrans: string) => Promise<string>;
      // Native notification methods iOS
      showPersistentNotification?: (title: string, message: string, persistent: boolean) => Promise<void>;
      hidePersistentNotification?: () => Promise<void>;
      showQuickNotification?: (title: string, message: string, duration: number) => Promise<void>;
    };
    courseAnalyticsService?: any;
  }
}

// Urmărirea curselor active - pentru Android/iOS BackgroundGPSService (gestionată în serviciul nativ)

const startAndroidGPS = (course: Course, vehicleNumber: string, token: string) => {
  if (!course) {
    console.error("Cursă invalidă pentru GPS");
    return "Eroare: Cursă invalidă";
  }
  
  if (!course.ikRoTrans && !course.uit) {
    console.error("Cursă fără identificatori pentru GPS");
    return "Eroare: Identificatori lipsă";
  }
  
  if (!vehicleNumber?.trim()) {
    console.error("Numărul vehiculului lipsește pentru GPS");
    return "Eroare: Vehicul invalid";
  }
  
  if (!token?.trim()) {
    console.error("Token lipsă pentru GPS");
    return "Eroare: Token invalid";
  }
  
  if (window.AndroidGPS && window.AndroidGPS.startGPS) {
    console.log("GPS Android pornit pentru cursă");
    
    // CONFLICT PREVENTION: Identificator complet unic pentru a evita conflictele între utilizatori
    const baseKey = course.ikRoTrans ? String(course.ikRoTrans) : course.uit;
    // Hash simplu pentru token în JavaScript
    const tokenHash = token.split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff, 0);
    const ikRoTransKey = `${baseKey}_${vehicleNumber}_${Math.abs(tokenHash).toString().substring(0, 8)}`;
    
    // CRITICAL FIX: Trimite baseKey ca fallback pentru server dacă course.uit e null
    const serverUit = course.uit || baseKey; // baseKey = ikRoTrans sau uit simplu pentru server
    
    const result = window.AndroidGPS.startGPS(
      ikRoTransKey,
      vehicleNumber,
      serverUit,
      token,
      2
    );
    
    console.log("Rezultat serviciu GPS:", result);
    return result;
  } else {
    console.error("AndroidGPS indisponibil");
    return "Eroare: AndroidGPS indisponibil";
  }
};

// iOS GPS - funcții identice cu Android
const startiOSGPS = async (course: Course, vehicleNumber: string, token: string) => {
  if (!course) {
    console.error("Cursă invalidă pentru GPS");
    return "Eroare: Cursă invalidă";
  }
  
  if (!course.ikRoTrans && !course.uit) {
    console.error("Cursă fără identificatori pentru GPS");
    return "Eroare: Identificatori lipsă";
  }
  
  if (!vehicleNumber?.trim()) {
    console.error("Numărul vehiculului lipsește pentru GPS");
    return "Eroare: Vehicul invalid";
  }
  
  if (!token?.trim()) {
    console.error("Token lipsă pentru GPS");
    return "Eroare: Token invalid";
  }
  
  if (window.iOSGPS && window.iOSGPS.startGPS) {
    console.log("GPS iOS pornit pentru cursă");
    
    // CONFLICT PREVENTION: Identificator complet unic (identic cu Android)
    const baseKey = course.ikRoTrans ? String(course.ikRoTrans) : course.uit;
    const tokenHash = token.split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff, 0);
    const ikRoTransKey = `${baseKey}_${vehicleNumber}_${Math.abs(tokenHash).toString().substring(0, 8)}`;
    
    const serverUit = course.uit || baseKey;
    
    const result = await window.iOSGPS.startGPS(
      ikRoTransKey,
      vehicleNumber,
      serverUit,
      token,
      2
    );
    
    console.log("Rezultat serviciu GPS iOS:", result);
    return result;
  } else {
    console.error("iOSGPS indisponibil");
    return "Eroare: iOSGPS indisponibil";
  }
};

// Funcții GPS native directe - BackgroundGPSService gestionează totul nativ
const updateCourseStatus = async (courseId: string, courseUit: string, newStatus: number, authToken: string, vehicleNumber: string) => {
  try {
    console.log(`Actualizez status cursă ${courseId} la ${newStatus}`);
    
    // CRITICAL: Obține coordonate GPS REALE sau eșuează complet - ZERO TOLERANCE pentru date false
    let gpsData = null;
    
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000, // Creștem timeout pentru GPS adevărat
        maximumAge: 5000 // Reducem age pentru coordonate mai fresh
      });
      
      gpsData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        alt: position.coords.altitude || 0,
        acc: position.coords.accuracy || 0,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0
      };
      
      console.log(`GPS obținut: ${gpsData.lat}, ${gpsData.lng}`);
    } catch (gpsError) {
      console.error('GPS INDISPONIBIL - actualizare status respinsă pentru protejarea datelor reale');
      throw new Error('Actualizare status imposibilă - GPS necesar pentru coordonate reale');
    }
    
    // CRITICAL FIX: GARANTEAZĂ trimiterea status-ului la server
    // Trimite direct prin sendGPSData pentru a garanta că ajunge 
    const realBattery = await getBatteryLevel();
    const realSignal = await getNetworkSignal();
    
    const gpsPayload = {
      uit: courseUit,
      numar_inmatriculare: vehicleNumber,
      lat: gpsData.lat,
      lng: gpsData.lng,
      viteza: Math.round((gpsData.speed || 0) * 3.6), // m/s to km/h
      directie: Math.round(gpsData.heading || 0),
      altitudine: Math.round(gpsData.alt || 0),
      hdop: Math.round(gpsData.acc || 0),
      gsm_signal: typeof realSignal === 'number' ? realSignal : parseInt(String(realSignal).replace('%', '')) || 75,
      baterie: parseInt(realBattery.replace('%', '')) || 100, // Real battery or fallback
      status: newStatus,
      timestamp: new Intl.DateTimeFormat('ro-RO', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Europe/Bucharest',
        hour12: false
      }).format(new Date()).replace(/(\d{2})\.(\d{2})\.(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1 $4:$5:$6')
    };
    
    const statusSent = await sendGPSData(gpsPayload, authToken);
    
    if (statusSent) {
      console.log(`✅ STATUS ${newStatus} trimis la server pentru cursă ${courseId}`);
    } else {
      console.error(`❌ Eroare trimitere status ${newStatus} la server`);
      throw new Error('Status update failed to reach server');
    }
    
  } catch (error) {
    console.error(`Eroare actualizare status pentru cursă ${courseId}:`, error);
    logAPI('Eroare actualizare status');
    throw error as Error;
  }
};

// ELIMINAT stopAndroidGPS - folosim updateStatus pentru multi-course support
// pentru pauză și stop individual, iar stopGPS doar pentru clearAll la logout

const logoutClearAllGPS = async () => {
  try {
    // Ascunde notificările persistente la logout (protejat)
    try {
      await nativeNotificationService.hidePersistentTracking();
    } catch (notifError) {
      console.warn('Eroare ascundere notificări:', notifError);
    }
    
    // Android GPS clear
    if (window.AndroidGPS && window.AndroidGPS.clearAllOnLogout) {
      try {
        return window.AndroidGPS.clearAllOnLogout();
      } catch (androidError) {
        console.warn('Eroare clearAllOnLogout Android:', androidError);
      }
    }
    
    // iOS GPS clear
    if (window.iOSGPS && window.iOSGPS.clearAllOnLogout) {
      try {
        return await window.iOSGPS.clearAllOnLogout();
      } catch (iosError) {
        console.warn('Eroare clearAllOnLogout iOS:', iosError);
      }
    }
    
    console.warn('GPS interface not available - browser mode');
    return "GPS interface not available";
  } catch (error) {
    console.error('Eroare generală logoutClearAllGPS:', error);
    return "Eroare la logout GPS";
  }
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
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  
  // LOGOUT PROTECTION: Previne apăsări multiple și crash-uri
  const logoutInProgressRef = useRef<boolean>(false);

  // Network and offline monitoring
  const [isOnline, setIsOnline] = useState(true);
  
  // Network status monitoring
  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        const status = await Network.getStatus();
        setIsOnline(status.connected);
      } catch (error) {
        console.error('Network status check failed:', error);
      }
    };

    checkNetworkStatus();

    const networkListener = Network.addListener('networkStatusChange', async (status) => {
      setIsOnline(status.connected);
      if (status.connected) {
        console.log('🌐 Conexiune restabilită - aplicația este din nou online');
        
        // CRITICAL FIX: Auto-sincronizare când rețeaua revine!
        try {
          console.log('🔄 Pornesc sincronizarea automată offline...');
          const success = await offlineGPSService.syncOfflineCoordinates(token);
          if (success) {
            nativeNotificationService.showQuickNotification(
              'iTrack GPS', 
              'Coordonate offline sincronizate cu succes',
              5000
            );
          }
        } catch (error) {
          console.error('❌ Eroare sincronizare automată:', error);
        }
      } else {
        console.log('📴 Conexiune pierdută - aplicația funcționează offline');
        nativeNotificationService.showQuickNotification(
          'iTrack GPS',
          'Offline - datele GPS se salvează local',
          7000
        );
      }
    });

    return () => {
      networkListener.then(listener => listener.remove());
    };
  }, []);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>('dark');
  const [gpsStatus, setGpsStatus] = useState<'active' | 'inactive' | 'unknown'>('unknown');

  

  // EXPUNE courseAnalyticsService la global window pentru Android bridge
  useEffect(() => {
    window.courseAnalyticsService = courseAnalyticsService;
    
    return () => {
      window.courseAnalyticsService = undefined;
    };
  }, []);

  // Native notifications pentru cursele active
  useEffect(() => {
    const activeCourses = courses.filter(course => course.status === 2); // Status 2 = în progres
    nativeNotificationService.updateTrackingNotification(activeCourses);
  }, [courses]);

  // Periodic offline sync check (every 5 minutes)
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const networkStatus = await Network.getStatus();
        if (networkStatus.connected && token) {
          const stats = await offlineGPSService.getStats();
          if (stats.totalOffline > 0 && !stats.syncInProgress) {
            console.log('🔄 Încercare sincronizare periodică...');
            await offlineGPSService.syncOfflineCoordinates(token);
          }
        }
      } catch (error) {
        console.error('❌ Eroare sync periodic:', error);
      }
    }, 5 * 60 * 1000); // 5 minute

    return () => clearInterval(syncInterval);
  }, [token]);

  // GPS MESSAGE HANDLER pentru alertele din serviciul Android
  useEffect(() => {
    // Setup handler pentru mesajele GPS (Android build)
    if (window.AndroidGPS) {
      window.AndroidGPS.onGPSMessage = (message: string) => {
        console.log('GPS Message din Android:', message);
        
        // BRIDGE: Offline GPS save pentru consistență între Android și JavaScript
        if (message.startsWith('GPS_OFFLINE_SAVE:')) {
          try {
            const gpsDataStr = message.replace('GPS_OFFLINE_SAVE:', '');
            const gpsData = JSON.parse(gpsDataStr);
            
            console.log('🌉 BRIDGE: Primesc GPS din Android pentru offline save:', gpsData);
            offlineGPSService.saveOfflineCoordinate(gpsData);
          } catch (error) {
            console.error('❌ Bridge error GPS offline save:', error);
          }
          
        // UNIFIED OFFLINE: Nu mai avem Android queue messages - totul unified în JavaScript
          
        // CRITICAL GPS→MAP: Interceptează coordonatele GPS pentru hartă
        } else if (message.startsWith('GPS_ANALYTICS:')) {
          try {
            const gpsDataStr = message.replace('GPS_ANALYTICS:', '');
            const gpsData = JSON.parse(gpsDataStr);
            
            // FIXED: Extrage TOATE identificatorii din GPS data
            const activeUit = gpsData.uit;
            const realUit = gpsData.realUit || activeUit;
            const ikRoTrans = gpsData.ikRoTrans || activeUit;
            const uniqueKey = gpsData.uniqueKey;
            
            console.log(`📍 GPS→HARTA: Primesc coordonate pentru UIT=${activeUit}, realUit=${realUit}, ikRoTrans=${ikRoTrans}`);
            console.log(`📋 Coordonate: (${gpsData.lat}, ${gpsData.lng}) viteză=${gpsData.viteza}km/h`);
            
            // CRITICAL FIX: Caută cursa după toate identificatorii posibili
            const activeCourse = courses.find((course: Course) => 
              course.uit === activeUit || 
              course.uit === realUit ||
              course.ikRoTrans === activeUit ||
              course.ikRoTrans === ikRoTrans ||
              course.id === activeUit
            );
            
            console.log(`🔍 Caut cursă pentru UIT=${activeUit}, realUit=${realUit}, ikRoTrans=${ikRoTrans}, uniqueKey=${uniqueKey}`);
            console.log(`📋 ${courses.length} curse în listă:`, courses.map(c => `${c.id}(uit:${c.uit}, ikRo:${c.ikRoTrans}, status:${c.status})`));
            if (activeCourse) {
              // Adaugă coordonatele în courseAnalyticsService pentru vizualizare pe hartă
              courseAnalyticsService.updateCourseStatistics(
                activeCourse.id,
                gpsData.lat,
                gpsData.lng,
                gpsData.viteza, // Viteza rămâne în km/h - FIX BUG CRITIC
                gpsData.hdop,
                false // not manual pause
              );
              console.log(`✅ GPS→HARTA: Coordonate salvate pentru cursa ${activeCourse.id}`);
            } else {
              console.warn(`⚠️ GPS→HARTA: Nu găsesc cursa activă pentru UIT ${activeUit}`);
              console.warn(`📋 Curse în listă:`, courses.map(c => `${c.id}(${c.uit}/${c.ikRoTrans})`));
              
              // FALLBACK: încearcă cu primul curs activ (status 2)
              const firstActiveCourse = courses.find(c => c.status === 2);
              if (firstActiveCourse) {
                console.log(`🔄 FALLBACK: Folosesc primul curs activ ${firstActiveCourse.id}`);
                courseAnalyticsService.updateCourseStatistics(
                  firstActiveCourse.id,
                  gpsData.lat,
                  gpsData.lng,
                  gpsData.viteza, // Viteza rămâne în km/h - FIX BUG CRITIC
                  gpsData.hdop,
                  false
                );
              }
            }
          } catch (e) {
            console.error('❌ Eroare GPS→Analytics parsing:', e);
          }
        }
        
        if (message.includes('GPS dezactivat') || message.includes('GPS DEZACTIVAT')) {
          setGpsStatus('inactive');
          nativeNotificationService.showQuickNotification(
            'iTrack GPS',
            'GPS dezactivat - activează GPS în setări',
            7000
          );
        } else if (message.includes('GPS NATIV activ') || message.includes('GPS HIGH-PRECISION')) {
          setGpsStatus('active');
          if (message.includes('GPS NATIV activ')) {
            nativeNotificationService.showQuickNotification(
              'iTrack GPS',
              'GPS activ - tracking de înaltă precizie pornit',
              5000
            );
          }
        } else if (message.includes('GPS indisponibil')) {
          setGpsStatus('inactive');
          nativeNotificationService.showQuickNotification(
            'iTrack GPS',
            'GPS indisponibil - verifică setările',
            7000
          );
        }
      };
    }

    return () => {
      // Cleanup handler (Android build)
      if (window.AndroidGPS) {
        window.AndroidGPS.onGPSMessage = undefined;
      }
    };
  }, []);

  // CLEANUP pentru timeout-uri la unmount
  useEffect(() => {
    return () => {
      // Curăță toate timeout-urile active la unmount
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current = [];
    };
  }, []);

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
  }, [vehicleNumber, token, coursesLoaded]);

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
        // RESTAUREAZĂ starea salvată pentru acest vehicul
        const savedState = await courseStateManager.restoreCourseState(vehicleNumber);
        const finalCourses = savedState 
          ? courseStateManager.mergeCourseStates(response, savedState)
          : response;
        
        setCourses(finalCourses);
        setCoursesLoaded(true);
        
        // Store valid vehicle number pentru următoarea sesiune
        await storeVehicleNumber(vehicleNumber);
        console.log(`✅ SUCCESS: ${finalCourses.length} curse încărcate pentru ${vehicleNumber}${savedState ? ' (cu stare restaurată)' : ''}`);
        
        // Log successful load
        await logAPI(`Curse încărcate: ${finalCourses.length} pentru ${vehicleNumber}`);
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
      const timeoutId = setTimeout(() => {
        setLoading(false);
        console.log(`🏁 LOADING STOP pentru ${currentRequest}`);
      }, 500);
      timeoutRefs.current.push(timeoutId);
    }
  };

  const handleLogout = async () => {
    // PROTECȚIE: Previne apăsări multiple
    if (logoutInProgressRef.current) {
      console.log('⚠️ Logout deja în progres, ignorăm');
      return;
    }
    logoutInProgressRef.current = true;
    
    console.log('🚪 LOGOUT BUTTON PRESSED');
    
    // Salvăm token-ul ÎNAINTE de a schimba UI-ul
    const savedToken = token;
    
    try {
      // STEP 1: GPS cleanup - apelează serviciul nativ pentru a opri GPS-ul
      // Serviciul are flag isServiceLoggingOut care blochează toate callback-urile
      console.log('🛑 Stopping GPS service...');
      try {
        await logoutClearAllGPS();
        console.log('✅ GPS cleanup done');
      } catch (e) {
        console.warn('GPS cleanup error (ignored):', e);
      }
      
      // STEP 2: Delay CRITIC pentru a permite serviciului să se oprească COMPLET
      // Aceasta dă timp serviciului să proceseze stopSelf() și să nu mai apeleze WebView
      // HTTP requests pot dura până la 15 secunde (timeout), dar flag-ul le blochează imediat
      console.log('⏳ Waiting for service to fully stop...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 secunde delay pentru siguranță
      console.log('✅ Service shutdown complete - safe to navigate');
      
      // STEP 3: Storage cleanup
      try {
        await Promise.allSettled([
          clearToken().catch(() => {}),
          clearStoredVehicleNumber().catch(() => {})
        ]);
        console.log('✅ Storage cleanup done');
      } catch (e) {
        console.warn('Storage cleanup error:', e);
      }
      
      // API logout în background (nu așteptăm)
      if (savedToken) {
        logout(savedToken).catch(() => {});
      }
    } catch (e) {
      console.warn('Logout error (ignored):', e);
    } finally {
      // GARANTAT: Navigăm la login
      console.log('✅ Navigating to login...');
      logoutInProgressRef.current = false;
      onLogout();
    }
  };

  // Funcție pentru obținerea culorilor temei curente
  const getThemeColors = () => {
    const themes: Record<string, {bg: string, text: string, headerBg: string, border: string}> = {
      dark: {
        bg: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
        text: '#ffffff',
        headerBg: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
        border: 'rgba(255, 255, 255, 0.2)'
      },
      light: {
        bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        text: '#1e293b',
        headerBg: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
        border: 'rgba(0, 0, 0, 0.1)'
      },
      business: {
        bg: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
        text: '#ffffff',
        headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
        border: 'rgba(255, 255, 255, 0.2)'
      },
      driver: {
        bg: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
        text: '#ffffff',
        headerBg: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
        border: 'rgba(255, 255, 255, 0.2)'
      },
      nature: {
        bg: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
        text: '#ffffff',
        headerBg: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
        border: 'rgba(255, 255, 255, 0.2)'
      },
      night: {
        bg: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)',
        text: '#ffffff',
        headerBg: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)',
        border: 'rgba(255, 255, 255, 0.2)'
      },
      ocean: {
        bg: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
        text: '#f0f9ff',
        headerBg: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
        border: 'rgba(240, 249, 255, 0.2)'
      },
      carbon: {
        bg: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
        text: '#ecfdf5',
        headerBg: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
        border: 'rgba(236, 253, 245, 0.2)'
      }
    };
    return themes[currentTheme] || themes.dark;
  };

  const themeColors = getThemeColors();

  // Vehicle number input screen - design optimizat
  if (!coursesLoaded) {
    return (
      <div style={{ 
        minHeight: '100dvh',
        background: themeColors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        paddingTop: 'max(env(safe-area-inset-top), 20px)', // Redus pentru Android
        paddingBottom: 'max(env(safe-area-inset-bottom), 20px)'
      }}>
        <div style={{
          background: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(45, 55, 72, 0.98)',
          backdropFilter: 'blur(25px)',
          borderRadius: '24px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          border: `2px solid ${themeColors.border}`,
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
            color: themeColors.text === '#ffffff' ? '#e2e8f0' : '#64748b',
            textAlign: 'center',
            marginBottom: '32px',
            fontSize: '16px',
            opacity: 0.8
          }}>
            Selectează vehiculul pentru a începe
          </p>
          
          <VehicleNumberDropdown
            value={vehicleNumber}
            onChange={setVehicleNumber}
            darkMode={currentTheme === 'dark'}
            currentTheme={currentTheme}
            placeholder="ex: IL02ABC"
          />

          {vehicleNumber && (
            <p style={{
              color: themeColors.text === '#ffffff' ? '#94a3b8' : '#64748b',
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
                ? 'rgba(74, 85, 104, 0.5)' 
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              padding: '18px',
              fontSize: '18px',
              fontWeight: '700',
              marginTop: '24px',
              cursor: !vehicleNumber.trim() || loading ? 'not-allowed' : 'pointer',
              opacity: !vehicleNumber.trim() || loading ? 0.6 : 1,
              transition: 'all 0.3s ease',
              boxShadow: !vehicleNumber.trim() || loading 
                ? 'none' 
                : '0 12px 24px rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Se încarcă...
              </>
            ) : (
              <>
                <i className="fas fa-search"></i>
                Încarcă cursele
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'transparent',
              color: themeColors.text === '#ffffff' ? '#94a3b8' : '#64748b',
              border: `2px solid ${themeColors.border}`,
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
      background: themeColors.bg,
      paddingBottom: 'env(safe-area-inset-bottom)',
      color: themeColors.text
    }}>
      {/* Animație CSS pentru indicator GPS */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>

      {/* Header optimizat și frumos */}
      <div style={{ 
        paddingTop: 'max(env(safe-area-inset-top), 40px)', 
        background: themeColors.headerBg,
        borderBottom: `1px solid ${themeColors.border}`,
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
          {/* Logo și titlu cu indicator GPS */}
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
              color: themeColors.text
            }}>
              iTrack
            </span>
            
            {/* Indicator status GPS */}
            {gpsStatus !== 'unknown' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '12px',
                background: gpsStatus === 'active' 
                  ? 'rgba(34, 197, 94, 0.15)' 
                  : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${gpsStatus === 'active' ? '#22c55e' : '#ef4444'}`
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: gpsStatus === 'active' ? '#22c55e' : '#ef4444',
                  animation: gpsStatus === 'active' ? 'pulse 2s infinite' : 'none'
                }}></div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  color: gpsStatus === 'active' ? '#22c55e' : '#ef4444',
                  textTransform: 'uppercase'
                }}>
                  GPS {gpsStatus === 'active' ? 'ON' : 'OFF'}
                </span>
              </div>
            )}
          </div>

          {/* Dropdown vehicul - afișează numărul selectat */}
          <VehicleNumberDropdown 
            currentVehicle={vehicleNumber}
            currentTheme={currentTheme}
            onVehicleSelect={async (number) => {
              console.log(`🔄 Vehicul selectat: ${number}`);
              
              // SALVEAZĂ starea curselor pentru vehiculul curent înainte să schimbe
              if (vehicleNumber && courses.length > 0) {
                await courseStateManager.saveCourseState(vehicleNumber, courses);
                console.log(`💾 Starea salvată pentru vehiculul precedent: ${vehicleNumber}`);
              }
              
              setVehicleNumber(number);
              setCoursesLoaded(false);
              setCourses([]);
              setError('');
              setLoading(false); // Reset loading state
              
              // Delay mic pentru UI update, apoi încarcă cursele
              const timeoutId = setTimeout(() => {
                handleLoadCourses();
              }, 100);
              timeoutRefs.current.push(timeoutId);
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

          {/* Logout - design cu roșu pentru atenție */}
          <button 
            onClick={() => setShowLogoutModal(true)}
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(229, 62, 62, 0.3)'
            }}>
            <i className="fas fa-sign-out-alt" style={{ fontSize: '20px', color: 'white' }}></i>
          </button>
        </div>

        {/* Offline GPS Sync Monitor - poziționat în header pentru vizibilitate optimă */}
        <div style={{ padding: '0 24px 20px' }}>
          <OfflineSyncMonitor 
            isOnline={isOnline}
            currentTheme={currentTheme}
            className="mb-3"
          />
        </div>
      </div>

      {/* Grid cu carduri status - design modern și profesional */}
      <div style={{ 
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
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
            borderRadius: '16px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: selectedStatusFilter === 'all' ? 'rgba(255, 255, 255, 0.3)' : '#4299e1',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-list" style={{ 
                  fontSize: '12px', 
                  color: 'white'
                }}></i>
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: selectedStatusFilter === 'all' ? 'white' : '#cbd5e0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                TOTAL
              </span>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: selectedStatusFilter === 'all' ? 'white' : '#ffffff',
              lineHeight: '1.2'
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
            borderRadius: '16px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: selectedStatusFilter === 2 ? 'rgba(255, 255, 255, 0.3)' : '#48bb78',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-play" style={{ 
                  fontSize: '12px', 
                  color: 'white'
                }}></i>
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: selectedStatusFilter === 2 ? 'white' : '#cbd5e0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                ACTIV
              </span>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: selectedStatusFilter === 2 ? 'white' : '#ffffff',
              lineHeight: '1.2'
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
            borderRadius: '16px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: selectedStatusFilter === 3 ? 'rgba(255, 255, 255, 0.3)' : '#ed8936',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-pause" style={{ 
                  fontSize: '12px', 
                  color: 'white'
                }}></i>
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: selectedStatusFilter === 3 ? 'white' : '#cbd5e0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                PAUZĂ
              </span>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: selectedStatusFilter === 3 ? 'white' : '#ffffff',
              lineHeight: '1.2'
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
            borderRadius: '16px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: selectedStatusFilter === 1 ? 'rgba(255, 255, 255, 0.3)' : '#805ad5',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-circle" style={{ 
                  fontSize: '12px', 
                  color: 'white'
                }}></i>
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: selectedStatusFilter === 1 ? 'white' : '#cbd5e0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                DISPONIBIL
              </span>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: selectedStatusFilter === 1 ? 'white' : '#ffffff',
              lineHeight: '1.2'
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
        /* Lista de curse - design compact și modern */
        <div style={{ padding: '0 20px 100px' }}>
          {(selectedStatusFilter === 'all' 
            ? courses 
            : courses.filter(c => c.status === selectedStatusFilter)
          ).map((course) => (
            <CourseDetailCard
              key={course.id}
              course={course}
              onDetailsClick={(course) => {
                setSelectedCourse(course);
                setShowDetailsModal(true);
              }}
              onStatusUpdate={async (courseId, courseUit, newStatus) => {
                // ULTIMATE PROTECTION: Dubla verificare pentru concurrency
                if (loadingCourses.has(courseId)) {
                  console.log(`🚫 CONCURRENCY BLOCK: Course ${courseId} update already in progress`);
                  nativeNotificationService.showQuickNotification(
                    'iTrack GPS',
                    'Actualizare în curs - așteaptă finalizarea',
                    5000
                  );
                  return;
                }
                
                // IMMEDIATE BLOCK: Setează loading înainte de orice altceva
                setLoadingCourses(prev => new Set([...prev, courseId]));
                
                try {
                  // Găsește cursa pentru GPS handling
                  const courseForGPS = courses.find(c => c.id === courseId);
                  const oldStatus = courseForGPS?.status;
                  
                  console.log(`Actualizare status: ${oldStatus} → ${newStatus} pentru cursă ${courseId}`);
                  
                  // Actualizează serverul
                  await updateCourseStatus(courseId, courseUit, newStatus, token, vehicleNumber);
                  
                  // Actualizează interfața
                  setCourses(prev => prev.map(c => 
                    c.id === courseId ? { ...c, status: newStatus } : c
                  ));
                  
                  // SALVEAZĂ noua stare în courseStateManager
                  await courseStateManager.updateCourseStatus(vehicleNumber, courseId, newStatus);
                  
                  // Gestionează GPS-ul
                  if (courseForGPS) {
                    // Pornire GPS: start sau resume
                    if (newStatus === 2 && (oldStatus === 1 || oldStatus === 3)) {
                      console.log(`GPS pornit pentru cursă ${courseId}`);
                      
                      // CRITICAL FIX: INIȚIALIZEAZĂ TRACKING STATISTICI
                      if (oldStatus === 1) {
                        // Nouă cursă - start tracking
                        courseAnalyticsService.startCourseTracking(courseId, courseForGPS.uit, vehicleNumber);
                        console.log(`📊 Analytics tracking STARTED pentru cursă ${courseId}`);
                      } else if (oldStatus === 3) {
                        // Resume din pauză - resume tracking
                        courseAnalyticsService.resumeCourseTracking(courseId);
                        console.log(`📊 Analytics tracking RESUMED pentru cursă ${courseId}`);
                      }
                      
                      // Start GPS pe platforma disponibilă
                      startAndroidGPS(courseForGPS, vehicleNumber, token);
                      startiOSGPS(courseForGPS, vehicleNumber, token);
                    }
                    
                    // Oprire GPS: pause sau stop
                    else if ((newStatus === 3 && oldStatus === 2) || 
                             (newStatus === 4 && (oldStatus === 2 || oldStatus === 3))) {
                      const actionType = newStatus === 3 ? 'PAUSE' : 'STOP';
                      console.log(`GPS ${actionType.toLowerCase()} pentru cursă ${courseId}`);
                      
                      // CRITICAL FIX: GESTIONEAZĂ ANALYTICS LA PAUZĂ/STOP
                      if (newStatus === 3) {
                        // Pauză - pause tracking
                        courseAnalyticsService.pauseCourseTracking(courseId);
                        console.log(`📊 Analytics tracking PAUSED pentru cursă ${courseId}`);
                      } else if (newStatus === 4) {
                        // Stop final - stop tracking
                        courseAnalyticsService.stopCourseTracking(courseId);
                        console.log(`📊 Analytics tracking STOPPED pentru cursă ${courseId}`);
                      }
                      
                      // ADAUGĂ PUNCT GPS CU FLAG MANUAL PENTRU PAUZĂ
                      if (newStatus === 3) {
                        // Manual pause pentru Android și iOS
                        const baseKey = courseForGPS.ikRoTrans ? String(courseForGPS.ikRoTrans) : courseForGPS.uit;
                        const tokenHash = token.split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff, 0);
                        const ikRoTransKey = `${baseKey}_${vehicleNumber}_${Math.abs(tokenHash).toString().substring(0, 8)}`;
                        
                        // Android manual pause
                        if (window.AndroidGPS && window.AndroidGPS.markManualPause) {
                          window.AndroidGPS.markManualPause(ikRoTransKey);
                        }
                        // iOS manual pause  
                        if (window.iOSGPS && window.iOSGPS.markManualPause) {
                          window.iOSGPS.markManualPause(ikRoTransKey);
                        }
                      }
                      
                      // GPS status update pentru Android și iOS
                      const baseKey = courseForGPS.ikRoTrans ? String(courseForGPS.ikRoTrans) : courseForGPS.uit;
                      const tokenHash = token.split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff, 0);
                      const ikRoTransKey = `${baseKey}_${vehicleNumber}_${Math.abs(tokenHash).toString().substring(0, 8)}`;
                      
                      // Android status update
                      if (window.AndroidGPS && window.AndroidGPS.updateStatus) {
                        window.AndroidGPS.updateStatus(ikRoTransKey, newStatus, vehicleNumber);
                      }
                      // iOS status update
                      if (window.iOSGPS && window.iOSGPS.updateStatus) {
                        window.iOSGPS.updateStatus(ikRoTransKey, newStatus, vehicleNumber);
                      }
                    }
                  }
                  
                } catch (error) {
                  console.error('Eroare actualizare status:', error);
                  nativeNotificationService.showQuickNotification(
                    'iTrack GPS',
                    'Eroare actualizare status - încearcă din nou',
                    7000
                  );
                } finally {
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
          
          {/* Alertă frumoasă când nu sunt curse pentru filtru specific */}
          {selectedStatusFilter !== 'all' && 
           courses.filter(c => c.status === selectedStatusFilter).length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              margin: '20px',
              background: currentTheme === 'dark' 
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(51, 65, 85, 0.4) 100%)'
                : currentTheme === 'light'
                  ? 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.6) 100%)'
                  : currentTheme === 'business'
                    ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                    : currentTheme === 'driver'
                      ? 'linear-gradient(135deg, rgba(6, 95, 70, 0.2) 0%, rgba(4, 120, 87, 0.1) 100%)'
                      : currentTheme === 'nature'
                        ? 'linear-gradient(135deg, rgba(22, 101, 52, 0.2) 0%, rgba(21, 128, 61, 0.1) 100%)'
                        : currentTheme === 'night'
                          ? 'linear-gradient(135deg, rgba(76, 29, 149, 0.2) 0%, rgba(91, 33, 182, 0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(51, 65, 85, 0.4) 100%)',
              border: currentTheme === 'dark'
                ? '1px solid rgba(148, 163, 184, 0.2)'
                : currentTheme === 'light'
                  ? '1px solid rgba(203, 213, 225, 0.4)'
                  : currentTheme === 'business'
                    ? '1px solid rgba(59, 130, 246, 0.3)'
                    : currentTheme === 'driver'
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : currentTheme === 'nature'
                        ? '1px solid rgba(34, 197, 94, 0.3)'
                        : currentTheme === 'night'
                          ? '1px solid rgba(139, 92, 246, 0.3)'
                          : '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}>
              {/* Icon */}
              <div style={{
                width: '80px',
                height: '80px',
                background: currentTheme === 'dark'
                  ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
                  : currentTheme === 'light'
                    ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
                    : currentTheme === 'business'
                      ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                      : currentTheme === 'driver'
                        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                        : currentTheme === 'nature'
                          ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                          : currentTheme === 'night'
                            ? 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)'
                            : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                color: currentTheme === 'dark'
                  ? '#94a3b8'
                  : currentTheme === 'light'
                    ? '#64748b'
                    : currentTheme === 'business'
                      ? '#3b82f6'
                      : currentTheme === 'driver'
                        ? '#059669'
                        : currentTheme === 'nature'
                          ? '#16a34a'
                          : currentTheme === 'night'
                            ? '#8b5cf6'
                            : '#64748b',
                marginBottom: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                📋
              </div>
              
              {/* Title */}
              <h3 style={{
                color: currentTheme === 'dark'
                  ? '#f1f5f9'
                  : currentTheme === 'light'
                    ? '#1e293b'
                    : currentTheme === 'business'
                      ? '#1e40af'
                      : currentTheme === 'driver'
                        ? '#065f46'
                        : currentTheme === 'nature'
                          ? '#14532d'
                          : currentTheme === 'night'
                            ? '#581c87'
                            : '#1e293b',
                fontSize: '20px',
                fontWeight: '700',
                margin: '0 0 12px 0',
                letterSpacing: '-0.025em'
              }}>
                Nicio cursă găsită
              </h3>
              
              {/* Description */}
              <p style={{
                color: currentTheme === 'dark'
                  ? '#94a3b8'
                  : currentTheme === 'light'
                    ? '#64748b'
                    : currentTheme === 'business'
                      ? '#64748b'
                      : currentTheme === 'driver'
                        ? '#6b7280'
                        : currentTheme === 'nature'
                          ? '#6b7280'
                          : currentTheme === 'night'
                            ? '#a1a1aa'
                            : '#64748b',
                fontSize: '15px',
                margin: '0 0 20px 0',
                lineHeight: '1.5',
                maxWidth: '280px'
              }}>
                Nu există curse {
                  selectedStatusFilter === 1 ? 'disponibile' :
                  selectedStatusFilter === 2 ? 'active' : 
                  selectedStatusFilter === 3 ? 'în pauză' : 'oprite'
                } pentru vehiculul selectat.
              </p>
              
              {/* Action hint */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: currentTheme === 'dark'
                  ? 'rgba(59, 130, 246, 0.1)'
                  : currentTheme === 'light'
                    ? 'rgba(59, 130, 246, 0.05)'
                    : currentTheme === 'business'
                      ? 'rgba(59, 130, 246, 0.1)'
                      : currentTheme === 'driver'
                        ? 'rgba(34, 197, 94, 0.1)'
                        : currentTheme === 'nature'
                          ? 'rgba(34, 197, 94, 0.1)'
                          : currentTheme === 'night'
                            ? 'rgba(139, 92, 246, 0.1)'
                            : 'rgba(59, 130, 246, 0.05)',
                borderRadius: '8px',
                fontSize: '13px',
                color: currentTheme === 'dark'
                  ? '#60a5fa'
                  : currentTheme === 'light'
                    ? '#2563eb'
                    : currentTheme === 'business'
                      ? '#2563eb'
                      : currentTheme === 'driver'
                        ? '#059669'
                        : currentTheme === 'nature'
                          ? '#16a34a'
                          : currentTheme === 'night'
                            ? '#8b5cf6'
                            : '#2563eb',
                fontWeight: '500'
              }}>
                💡 Încearcă să schimbi filtrul sau vehiculul
              </div>
            </div>
          )}
          
          {/* Debug icon sub lista de curse */}
          <div style={{
            padding: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div
              onClick={() => {
                setClickCount(prev => {
                  const newCount = prev + 1;
                  
                  if (newCount >= 50) {
                    setShowDebugPage(true);
                    setClickCount(0);
                    nativeNotificationService.showQuickNotification(
                      'iTrack GPS',
                      'Debug Mode Activat - logurile apar sub cursele active',
                      5000
                    );
                  }
                  
                  return newCount;
                });
              }}
              style={{
                width: '44px',
                height: '44px',
                background: clickCount >= 30 
                  ? 'rgba(245, 158, 11, 0.9)' 
                  : 'rgba(100, 116, 139, 0.7)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                opacity: 0.8,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease'
              }}
            >
              <i className="fas fa-bug" style={{
                fontSize: '16px',
                color: '#ffffff'
              }}></i>
              
              {/* Badge cu numărul de click-uri după 30+ */}
              {clickCount >= 30 && (
                <div style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  background: clickCount >= 45 ? '#dc2626' : '#f59e0b',
                  color: '#ffffff',
                  fontSize: '8px',
                  padding: '2px 4px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  minWidth: '16px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  {clickCount}
                </div>
              )}
            </div>
          </div>

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

      {/* Toast-uri eliminate - folosim doar notificări native */}
      

      {/* Modal Confirmare Logout */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '400px',
            width: '100%',
            border: '2px solid rgba(229, 62, 62, 0.3)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <i className="fas fa-exclamation-triangle" style={{
                fontSize: '48px',
                color: '#e53e3e',
                marginBottom: '16px'
              }}></i>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '12px'
              }}>
                Confirmare Logout
              </h3>
              <p style={{
                color: '#cbd5e0',
                fontSize: '16px',
                lineHeight: '1.5',
                marginBottom: '0'
              }}>
                Ești sigur că vrei să te deconectezi?
              </p>
            </div>

            {/* Informații despre ce se pierde */}
            <div style={{
              background: 'rgba(229, 62, 62, 0.1)',
              border: '1px solid rgba(229, 62, 62, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#f56565',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Ce se va pierde:
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: '0',
                margin: '0',
                color: '#e2e8f0',
                fontSize: '14px'
              }}>
                <li style={{ marginBottom: '4px' }}>
                  <i className="fas fa-times" style={{ color: '#f56565', marginRight: '8px', fontSize: '12px' }}></i>
                  Sesiunea curentă de lucru
                </li>
                <li style={{ marginBottom: '4px' }}>
                  <i className="fas fa-times" style={{ color: '#f56565', marginRight: '8px', fontSize: '12px' }}></i>
                  Starea de autentificare
                </li>
                <li style={{ marginBottom: '4px' }}>
                  <i className="fas fa-check" style={{ color: '#48bb78', marginRight: '8px', fontSize: '12px' }}></i>
                  Coordonatele GPS offline rămân salvate
                </li>
                <li>
                  <i className="fas fa-check" style={{ color: '#48bb78', marginRight: '8px', fontSize: '12px' }}></i>
                  Vehiculul selectat rămâne memorat
                </li>
              </ul>
            </div>

            {/* Butoane */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1,
                  background: 'rgba(74, 85, 104, 0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  color: '#e2e8f0',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Anulează
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                  border: '2px solid #e53e3e',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Deconectează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CourseDetailsModal */}
      {selectedCourse && (
        <CourseDetailsModal
          course={selectedCourse}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCourse(null);
          }}
          currentTheme={currentTheme}
        />
      )}
    </div>
  );
};

export default VehicleScreen;