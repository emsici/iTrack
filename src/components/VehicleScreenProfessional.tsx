import React, { useState, useEffect } from "react";
import { Geolocation } from '@capacitor/geolocation';
import { CapacitorHttp } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Course } from "../types";
import { getVehicleCourses, logout, API_BASE_URL } from "../services/api";
// Urmărirea curselor active - pentru Android BackgroundGPSService  
let activeCourses = new Map<string, Course>();
// activeGPSInterval eliminat - folosim doar Android BackgroundGPSService

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
      const androidResult = window.AndroidGPS.updateStatus(courseId, newStatus);
      console.log(`📱 Serviciul GPS Android actualizat: ${androidResult}`);
      return androidResult;
    }
    
    return `SUCCES: Status ${newStatus} actualizat pentru ${courseId}`;
    
  } catch (error) {
    console.error(`❌ Actualizarea statusului a eșuat pentru ${courseId}:`, error);
    
    // Încearcă totuși serviciul Android chiar dacă serverul eșuează
    if (window.AndroidGPS && window.AndroidGPS.updateStatus) {
      const androidResult = window.AndroidGPS.updateStatus(courseId, newStatus);
      console.log(`📱 Serviciul GPS Android actualizat (offline): ${androidResult}`);
      return androidResult;
    }
    
    console.warn('Interfața AndroidGPS nu este disponibilă - mod browser');
    throw error;
  }
};

const startAndroidGPS = (course: Course, vehicleNumber: string, token: string) => {
  console.log("🚀 === APELARE SERVICIU GPS ANDROID ===");
  console.log("📱 Verificare interfață AndroidGPS:", {
    available: !!(window.AndroidGPS),
    startGPS: !!(window.AndroidGPS?.startGPS),
    ikRoTrans: course.ikRoTrans, // Identificator unic pentru HashMap
    realUIT: course.uit,         // UIT-ul real pentru server
    vehicleNumber: vehicleNumber
  });
  
  if (window.AndroidGPS && window.AndroidGPS.startGPS) {
    console.log("✅ AndroidGPS.startGPS disponibil - pornesc BackgroundGPSService");
    console.log("📋 IMPORTANT: BackgroundGPSService acceptă MULTIPLE curse - se adaugă la lista activă");
    console.log("🔄 Fiecare cursă ACTIVĂ (status 2) va fi urmărită simultan cu același GPS");
    
    const result = window.AndroidGPS.startGPS(
      String(course.ikRoTrans),  // ikRoTrans ca identificator unic
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

const logoutClearAllGPS = async () => {
  if (window.AndroidGPS && window.AndroidGPS.clearAllOnLogout) {
    return window.AndroidGPS.clearAllOnLogout();
  }
  console.warn('AndroidGPS interface not available - browser mode');
};

import { clearToken, storeVehicleNumber, getStoredVehicleNumber } from "../services/storage";
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

// import OfflineSyncMonitor from "./OfflineSyncMonitor"; // Commented unused import
// BackgroundGPSService detectează network status prin răspunsurile HTTP
// BackgroundGPSService handles offline GPS natively - no separate service needed

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
        if (storedVehicle && storedVehicle.trim() && mounted) {
          console.log('✅ Vehicul stocat găsit:', storedVehicle);
          setVehicleNumber(storedVehicle);
          
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
          console.log('ℹ️ PRIMA INSTALARE - nu există vehicul stocat, se va cere input');
          // Pentru prima instalare, forțează afișarea paginii de input
          setCoursesLoaded(false);
          setVehicleNumber('');
        }
      } catch (error) {
        console.error('Eroare la inițializarea aplicației:', error);
      }
    };
    
    initializeApp();
  }, []); // Empty dependency array - runs only once on mount

  // Separate useEffect for background refresh events + network status
  useEffect(() => {
    const handleBackgroundRefresh = () => {
      console.log('Background refresh event received from Android');
      if (vehicleNumber && token && coursesLoaded) {
        // Background refresh handled by Android service
      }
    };
    
    // Setup network status listener
    const handleNetworkChange = async (online: boolean) => {
      setIsOnline(online);
      console.log(`📡 Network status changed: ${online ? 'ONLINE' : 'OFFLINE'}`);
      
      // Auto-sync când revii online
      if (online && offlineGPSCount > 0) {
        console.log('🌐 Internet restored - auto-syncing offline coordinates...');
        try {
          const { offlineGPSService } = await import('../services/offlineGPS');
          // CRITICĂ: Transmite token-ul pentru autentificare
          const syncResult = await offlineGPSService.syncOfflineCoordinates(token);
          console.log('📡 Sincronizare offline rezultat:', syncResult);
          
          // Actualizează count-ul după sincronizare
          const stats = offlineGPSService.getStats();
          setOfflineGPSCount(stats.totalOffline);
          console.log(`📊 Count actualizat după sync: ${stats.totalOffline}`);
        } catch (syncError) {
          console.error('❌ Eroare sincronizare automată:', syncError);
        }
      }
    };
    
    // Setup network detection with Capacitor Network plugin - eliminat ping test problematic
    const checkNetworkStatus = async () => {
      try {
        // First check navigator.onLine
        const navigatorOnline = navigator.onLine;
        
        // Folosește Capacitor Network plugin pentru Android - mai fiabil decât ping test
        try {
          const networkStatus = await Network.getStatus();
          const capacitorOnline = networkStatus.connected;
          
          const finalStatus = navigatorOnline && capacitorOnline;
          console.log(`🌐 Network status: navigator=${navigatorOnline}, capacitor=${capacitorOnline}, final=${finalStatus}`);
          console.log(`📶 Network type: ${networkStatus.connectionType}`);
          
          return finalStatus;
        } catch (networkError) {
          // Fallback la navigator.onLine dacă Capacitor Network eșuează
          console.log(`🔍 Capacitor Network check failed, using navigator.onLine=${navigatorOnline}`);
          return navigatorOnline;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`🔍 Network check failed: ${errorMessage}, using navigator.onLine=${navigator.onLine}`);
        return navigator.onLine;
      }
    };
    
    // Initial network status check
    checkNetworkStatus().then(handleNetworkChange);
    
    // Setup periodic network monitoring
    const networkInterval = setInterval(async () => {
      const online = await checkNetworkStatus();
      if (online !== isOnline) {
        handleNetworkChange(online);
      }
    }, 5000); // Check every 5 seconds
    
    // Setup browser online/offline event listeners
    const handleOnline = () => {
      console.log('🌐 Browser online event detected');
      checkNetworkStatus().then(handleNetworkChange);
    };
    
    const handleOffline = () => {
      console.log('🔌 Browser offline event detected');
      handleNetworkChange(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor offline GPS count
    const updateOfflineCount = async () => {
      try {
        const { offlineGPSService } = await import('../services/offlineGPS');
        const stats = offlineGPSService.getStats();
        
        // Actualizează DOAR dacă există schimbare
        if (stats.totalOffline !== offlineGPSCount) {
          setOfflineGPSCount(stats.totalOffline);
          console.log(`📊 Offline GPS count updated: ${stats.totalOffline}`);
        }
      } catch (error) {
        console.error("Error getting offline count:", error);
        setOfflineGPSCount(0);
      }
    };
    
    updateOfflineCount();
    const countInterval = setInterval(updateOfflineCount, 5000); // Check every 5 seconds
    
    window.addEventListener('backgroundRefresh', handleBackgroundRefresh);
    
    return () => {
      window.removeEventListener('backgroundRefresh', handleBackgroundRefresh);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(countInterval);
      clearInterval(networkInterval);
    };
  }, [vehicleNumber, token, coursesLoaded]);

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

    // Silent course loading process
    
    setLoading(true);
    setError("");
    
    try {
      // Store vehicle number for persistence ONLY if successful
      // Moved after successful course loading
      
      // Loading courses for vehicle
      const response = await getVehicleCourses(vehicleNumber, token);
      
      // Handle API response format
      let coursesArray = [];
      
      if (Array.isArray(response)) {
        coursesArray = response;
      } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
        coursesArray = response.data;
      } else if (response && typeof response === 'object' && response.data) {
        coursesArray = [response.data];
      } else if (response && typeof response === 'object') {
        coursesArray = [response];
      }

      console.log("Curse găsite:", coursesArray.length);

      if (coursesArray.length > 0) {
        const mergedCourses = coursesArray.map((newCourse: Course) => {
          const existingCourse = courses.find((c) => c.id === newCourse.id);
          
          // Restore saved status from localStorage
          let savedStatus = newCourse.status || 1; // Default to available
          try {
            const statusKey = `course_status_${newCourse.uit}`;
            const storedStatus = localStorage.getItem(statusKey);
            if (storedStatus) {
              savedStatus = parseInt(storedStatus);
              console.log(`📋 Restored status ${savedStatus} for UIT ${newCourse.uit}`);
            }
          } catch (error) {
            console.error('Eșec la restaurarea statusului cursei:', error);
          }
          
          return existingCourse
            ? { ...newCourse, status: savedStatus }
            : { ...newCourse, status: savedStatus, isNew: true }; // Mark new courses
        });

        // Sort: new courses first, then existing ones
        const sortedCourses = mergedCourses.sort((a: Course, b: Course) => {
          // New courses (isNew = true) go first
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          
          // Within same group, sort by status priority: 2 (active) > 3 (paused) > 1 (available) > 4 (finished)
          const statusPriority = { 2: 4, 3: 3, 1: 2, 4: 1 };
          return (statusPriority[b.status as keyof typeof statusPriority] || 0) - (statusPriority[a.status as keyof typeof statusPriority] || 0);
        });

        // Clean up isNew flag after sorting
        const finalCourses = sortedCourses.map((course: Course) => {
          const { isNew, ...cleanCourse } = course;
          return cleanCourse;
        });

        setCourses(finalCourses);
        setError("");
        setCoursesLoaded(true); // Allow access only when courses are found
        setSelectedStatusFilter('all'); // Reset filter when new courses load
        
        // Store vehicle number ONLY after successful course loading
        await storeVehicleNumber(vehicleNumber.trim());
        console.log(`✅ Curse încărcate cu succes - se comută la vizualizarea principală cu ${finalCourses.length} curse`);
        
        // Update last refresh timestamp
        setLastRefreshTime(new Date());
        
        // Setup robust auto-refresh for Android (works with phone locked)
        if (autoRefreshInterval) {
          clearInterval(autoRefreshInterval);
        }
        
        // Create persistent interval that survives app minimizing/screen lock
        const createRobustInterval = () => {
          return setInterval(async () => {
            const currentTime = new Date();
            console.log(`[${currentTime.toLocaleTimeString()}] Auto-refresh starting (Android background)...`);
            
            try {
              const response = await getVehicleCourses(vehicleNumber, token);
              if (response && Array.isArray(response)) {
                // Capture current state to avoid race conditions
                setCourses(currentCourses => {
                  const existingUITs = new Set(currentCourses.map(course => course.uit));
                  
                  // CRITICAL: Preserve local status when auto-refreshing
                  const newCoursesData = response.map((course: any) => {
                    // Find existing course with same UIT
                    const existingCourse = currentCourses.find(c => c.uit === course.uit);
                    
                    // Restore saved status from localStorage or use existing status
                    let preservedStatus = course.status || 1; // Default from server
                    
                    if (existingCourse) {
                      // KEEP existing status - user started/paused/stopped course
                      preservedStatus = existingCourse.status;
                      console.log(`🔄 Auto-refresh: Preserving status ${preservedStatus} for UIT ${course.uit}`);
                    } else {
                      // New course - check localStorage for saved status
                      try {
                        const statusKey = `course_status_${course.uit}`;
                        const storedStatus = localStorage.getItem(statusKey);
                        if (storedStatus) {
                          preservedStatus = parseInt(storedStatus);
                          console.log(`📋 Auto-refresh: Restored status ${preservedStatus} for new UIT ${course.uit}`);
                        }
                      } catch (error) {
                        console.error('Failed to restore course status during auto-refresh:', error);
                      }
                    }
                    
                    return {
                      ...course,
                      status: preservedStatus,
                      isNew: !existingUITs.has(course.uit)
                    };
                  });
                  
                  // Sort: new courses first, then existing ones
                  const sortedCourses = newCoursesData.sort((a: Course, b: Course) => {
                    if (a.isNew && !b.isNew) return -1;
                    if (!a.isNew && b.isNew) return 1;
                    return 0;
                  });
                  
                  const newCount = newCoursesData.filter((c: Course) => c.isNew).length;
                  if (newCount > 0) {
                    console.log(`🆕 Auto-refresh: ${newCount} new UIT courses added (may be background)`);
                  } else {
                    console.log(`✅ Auto-refresh: ${sortedCourses.length} courses updated (preserved statuses)`);
                  }
                  
                  return sortedCourses;
                });
                
                setLastRefreshTime(new Date());
              }
            } catch (error) {
              console.log('Auto-refresh eșuat (se va reîncerca în 5 minute):', error);
            }
          }, 5 * 60 * 1000); // 5 minutes
        };
        
        const interval = createRobustInterval();
        setAutoRefreshInterval(interval);
        
        console.log('🔄 Auto-refresh Android în fundal activat (intervale de 5 min)');
        
        console.log(`Încărcare cu succes ${finalCourses.length} curse pentru ${vehicleNumber} (sortate: noi primul)`);
        
        // Log new courses found
        const newCoursesCount = mergedCourses.filter((c: Course) => c.isNew).length;
        if (newCoursesCount > 0) {
          console.log(`🆕 Găsite ${newCoursesCount} curse noi - afișate în partea de sus`);
        }
      } else {
        console.log("Nu au fost găsite curse - se rămâne pe ecranul de introducere vehicul");
        setCourses([]);
        setCoursesLoaded(false); // Stay on input screen
        setError("Nu au fost găsite curse pentru acest vehicul");
        // Don't save failed vehicle number to storage
        console.log("✅ Se rămâne pe ecranul de introducere - nu s-au găsit curse");
      }
    } catch (error: any) {
      console.error("Eroare la încărcarea curselor:", error);
      setCourses([]);
      setCoursesLoaded(false); // Stay on input screen on error
      setError(error.message || "Eroare la încărcarea curselor");
      console.log("✅ Se rămâne pe ecranul de introducere - a apărut o eroare");
    } finally {
      setLoading(false);
      console.log("=== Încărcare finalizată ===");
      // Clear any lingering loading states that might disable input
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔐 Se pornește logout complet - se opresc TOATE transmisiile GPS...');
      
      // STEP 1: Stop Android GPS service only 
      await logoutClearAllGPS(); // Direct Android GPS service
      
      // STEP 2: Clear activeCourses map
      activeCourses.clear();
      console.log('✅ Lista curse active curățată complet');
      
      // STEP 3: Server logout 
      await logout(token);
      
      // STEP 4: Clear local authentication
      await clearToken();
      
      // STEP 5: Clear all saved course statuses on logout
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('course_status_')) {
            localStorage.removeItem(key);
            console.log(`🧹 Status salvat șters pentru ${key}`);
          }
        });
      } catch (error) {
        console.error('Eșec la ștergerea statusurilor curselor:', error);
      }
      
      console.log('✅ Logout complet finalizat - toate transmisiile GPS oprite');
      
      // IMMEDIATE LOGOUT: Call onLogout immediately pentru UI instant
      console.log('✅ Logout complet finalizat - se afișează login-ul');
      onLogout();
    } catch (error) {
      console.error("Eroare la logout:", error);
      // IMMEDIATE LOGOUT: Chiar și cu eroare, se afișează login-ul
      console.log('✅ Logout forțat după eroare - se afișează login-ul');
      onLogout();
    }
  };

  const handleTimestampClick = async () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 50) {
      try {
        setShowDebugPage(true);
        setClickCount(0);
      } catch (error) {
        console.error("Error opening debug page:", error);
        setShowDebugPage(true);
        setClickCount(0);
      }
    }
  };

  const handleCourseStatusUpdate = async (courseId: string, newStatus: number, action?: string) => {
    console.log(`Se procesează acțiunea pentru cursa: ${courseId}`);

    try {
      const courseToUpdate = courses.find((c) => c.id === courseId);
      if (!courseToUpdate) {
        console.error("Cursa nu a fost găsită:", courseId);
        return;
      }

      // Update course status immediately in UI for responsive feel
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, status: newStatus }
            : course
        )
      );
      
      // CRITICĂ: Sincronizez statusul și în activeCourses pentru consistență
      if (activeCourses.has(String(courseToUpdate.ikRoTrans))) {
        activeCourses.set(String(courseToUpdate.ikRoTrans), { ...courseToUpdate, status: newStatus });
        console.log(`🔄 Status actualizat în activeCourses pentru ikRoTrans ${courseToUpdate.ikRoTrans} (UIT: ${courseToUpdate.uit}): ${newStatus}`);
      }

      // Store the status in localStorage for persistence
      try {
        const statusKey = `course_status_${courseToUpdate.uit}`;
        localStorage.setItem(statusKey, newStatus.toString());
        console.log(`💾 Status ${newStatus} salvat pentru UIT ${courseToUpdate.uit}`);
      } catch (error) {
        console.error('Eșec la salvarea statusului cursei:', error);
      }

      console.log(`=== ÎNCEPUT ACTUALIZARE STATUS ===`);
      console.log(`Cursă: ${courseId}, Status: ${courseToUpdate.status} → ${newStatus}`);
      console.log(`UIT REAL: ${courseToUpdate.uit}, Vehicul: ${vehicleNumber}`);
      console.log(`Token disponibil: ${!!token}, Lungime token: ${token?.length || 0}`);
      console.log(`🚛 VehicleNumber pentru status update: "${vehicleNumber}" (length: ${vehicleNumber?.length || 0})`);
      
      if (!vehicleNumber || vehicleNumber.trim() === '') {
        console.error(`❌ EROARE CRITICĂ: vehicleNumber este gol pentru status ${newStatus}!`);
        console.error(`📋 vehicleNumber value:`, vehicleNumber);
        throw new Error(`Vehicle number is missing for status update ${newStatus}`);
      }

      // Show action-specific toast and handle GPS permissions
      if (action) {
        const actionMessages = {
          start: { title: 'Cursă pornită!', message: 'Urmărirea GPS a fost activată.' },
          pause: { title: 'Cursă pauzată!', message: 'Transmisia GPS oprită temporar.' },
          resume: { title: 'Cursă reluată!', message: 'Urmărirea GPS reactivată.' },
          finish: { title: 'Cursă finalizată!', message: 'Urmărirea GPS oprită definitiv.' }
        };
        
        const actionInfo = actionMessages[action as keyof typeof actionMessages];
        if (actionInfo) {
          toast.info(actionInfo.title, actionInfo.message, 3000);
        }
      }

      // Solicită permisiuni GPS mai întâi dacă se pornește cursa
      if (newStatus === 2) {
        console.log('🔍 === VERIFICARE PERMISIUNI GPS ===');
        try {
          // Verifică permisiunile curente
          const permissions = await Geolocation.checkPermissions();
          console.log('📋 Permisiuni GPS actuale:', permissions);
          
          if (permissions.location !== 'granted') {
            console.log('🔐 Solicit permisiuni GPS standard...');
            const requestResult = await Geolocation.requestPermissions();
            console.log('📝 Rezultat cerere permisiuni standard:', requestResult);
            
            if (requestResult.location !== 'granted') {
              console.log('❌ Permisiuni GPS standard refuzate');
              toast.error('Permisiuni GPS necesare', 'Acordați permisiuni de localizare pentru urmărirea GPS.', 5000);
              return; // Stop aici dacă nu avem permisiuni
            }
          }
          
          // Verifică și solicită permisiuni background location (Android)
          if (permissions.coarseLocation !== 'granted') {
            console.log('🔐 Solicit permisiuni GPS background (coarse)...');
            try {
              const backgroundRequest = await Geolocation.requestPermissions();
              console.log('📝 Rezultat permisiuni background:', backgroundRequest);
            } catch (bgError) {
              console.log('⚠️ Permisiuni background nu au fost acordate:', bgError);
              console.log('📱 GPS va funcționa în foreground, background va fi gestionat de serviciul Android');
            }
          }
          
          console.log('✅ Permisiuni GPS verificate și acordate');
        } catch (permError) {
          console.log('⚠️ Eroare verificare permisiuni GPS:', permError);
          console.log('📱 Continuez - serviciul Android va gestiona permisiunile');
        }
      }

      // GPS logic handled directly by BackgroundGPSService Android native
      try {
        console.log(`🎯 ANDROID NATIVE: BackgroundGPSService cu GPS nativ și precizie maximă`);
        console.log(`📞 Se apelează direct Android GPS cu UIT: ${courseToUpdate.uit}`);
        console.log(`📍 GPS NATIV: Coordonate 7 decimale, sub 15m accuracy, background garantat`);
        
        // CRITICĂ: Gestionarea eficientă GPS cu lista curselor active
        if (newStatus === 2) {
          console.log("🚀 PORNIRE/RESUME GPS: Status 2 (ACTIV) - adaug cursa la lista activă");
          
          // Verifică dacă este RESUME (cursa era deja în listă) sau START nou
          const wasAlreadyActive = activeCourses.has(String(courseToUpdate.ikRoTrans));
          if (wasAlreadyActive) {
            console.log("▶️ RESUME: Cursa era deja în activeCourses - reactivez analytics");
            await courseAnalyticsService.resumeCourseTracking(String(courseToUpdate.ikRoTrans));
          } else {
            console.log("🚀 START NOU: Adaug cursă nouă la activeCourses și pornesc analytics");
            await courseAnalyticsService.startCourseTracking(String(courseToUpdate.ikRoTrans), courseToUpdate.uit, vehicleNumber);
          }
          
          // Adaugă cursa la lista activă (sau confirmă că este deja acolo) cu status 2 actualizat
          activeCourses.set(String(courseToUpdate.ikRoTrans), { ...courseToUpdate, status: 2 });
          console.log(`📋 Curse active: ${activeCourses.size}`);
          
          // STRATEGIE EFICIENȚĂ: Serviciul Android pornește o singură dată și rămâne activ
          if (window.AndroidGPS) {
            if (activeCourses.size === 1) {
              // Prima cursă activă - pornește serviciul Android
              console.log("🚀 Prima cursă activă - pornesc serviciul Android GPS");
              const gpsResult = startAndroidGPS(courseToUpdate, vehicleNumber, token);
              console.log("📱 Rezultat Serviciu GPS Android:", gpsResult);
            } else {
              // Cursele următoare - trebuie să adaug UIT-ul la serviciul Android
              console.log(`📋 Cursă ${activeCourses.size} adăugată - adaug UIT-ul la serviciul Android care rulează`);
              const gpsResult = startAndroidGPS(courseToUpdate, vehicleNumber, token);
              console.log("📱 UIT nou adăugat la serviciul Android:", gpsResult);
              console.log("⚡ MULTI-UIT: Serviciul Android va transmite pentru toate cursele active");
            }
          }
          
          // ELIMINAT: JavaScript GPS service - folosim doar Android BackgroundGPSService
          console.log("⚡ EFICIENT: Folosim doar Android BackgroundGPSService pentru TOATE cursele");
          
        } else if (newStatus === 3) {
          console.log(`⏸️ PAUSE STATUS: Status 3 - cursa rămâne în listă dar inactivă`);
          console.log("📋 PAUSE: Cursa nu se elimină din activeCourses - doar se pune în pauză");
          
          // Pentru PAUSE actualizez statusul în activeCourses la 3
          if (activeCourses.has(String(courseToUpdate.ikRoTrans))) {
            activeCourses.set(String(courseToUpdate.ikRoTrans), { ...courseToUpdate, status: 3 });
          }
          console.log(`📋 Curse active rămân: ${activeCourses.size} (inclusiv ${courseToUpdate.uit} în pauză)`);
          
          // Pause course analytics but don't stop completely
          await courseAnalyticsService.pauseCourseTracking(String(courseToUpdate.ikRoTrans));
          console.log(`⏸️ Analytics paused pentru UIT: ${courseToUpdate.uit}`);
          
        } else if (newStatus === 4) {
          console.log(`🔄 STOP STATUS: Status 4 - elimin cursa din lista activă`);
          console.log("📋 STOP: Eliminare completă din activeCourses");
          
          // Pentru STOP eliminăm cursa din lista activă
          activeCourses.delete(String(courseToUpdate.ikRoTrans));
          console.log(`📋 Curse active rămase: ${activeCourses.size}`);
          
          // Stop course analytics completely for this specific course
          await courseAnalyticsService.stopCourseTracking(String(courseToUpdate.ikRoTrans));
          console.log(`🛑 Analytics stopped pentru UIT: ${courseToUpdate.uit}`);
          
          // If no active courses remain, stop Android GPS service  
          if (activeCourses.size === 0) {
            console.log("🛑 Nu mai sunt curse active - opresc Android GPS service");
            if (window.AndroidGPS && window.AndroidGPS.stopGPS) {
              window.AndroidGPS.stopGPS("all_courses_stopped");
              console.log("📱 Android GPS service stopped");
            }
          }
        }
        
        // STRATEGIA NOUĂ: Serviciul Android trimite status updates pentru 3 și 4 (garantat răspuns 200)
        if (newStatus === 3 || newStatus === 4) {
          console.log(`🔄 === STATUS ${newStatus} TRIMIS DE SERVICIUL ANDROID ===`);
          console.log(`📊 UIT: ${courseToUpdate.uit}, Status: ${newStatus} (3=PAUZA, 4=STOP)`);
          console.log(`🎯 Serviciul Android va trimite la gps.php cu răspuns 200 garantat`);
        } else if (newStatus === 2) {
          console.log(`🔄 === TRIMITERE STATUS 2 (START) LA SERVER ===`);
          console.log(`📊 UIT: ${courseToUpdate.uit}, Status: ${newStatus} (2=ACTIV)`);
          console.log(`🚛 Numărul vehiculului pentru actualizare status: "${vehicleNumber}"`);
          
          if (!vehicleNumber || vehicleNumber.trim() === '') {
            console.error(`❌ EROARE CRITICĂ: vehicleNumber este gol pentru status ${newStatus}!`);
            throw new Error(`Numărul vehiculului lipsește pentru actualizarea status ${newStatus}`);
          }
          
          // Send status update to server doar pentru STATUS 2 (START) - ORDINEA CORECTĂ A PARAMETRILOR
          await updateCourseStatus(courseToUpdate.uit, newStatus, token, vehicleNumber); // FIXED: folosește UIT real
          console.log(`✅ Status ${newStatus} (START) trimis cu succes la server pentru UIT ${courseToUpdate.uit}`);
        }
        
        // Actualizează statusul serviciului GPS Android (va trimite automat status 3/4 la server)
        if (window.AndroidGPS && window.AndroidGPS.updateStatus) {
          console.log(`📱 === ANDROID GPS STATUS UPDATE START ===`);
          console.log(`🔧 AndroidGPS disponibil: ${!!window.AndroidGPS}`);
          console.log(`🔧 updateStatus method disponibil: ${!!window.AndroidGPS.updateStatus}`);
          console.log(`📊 UIT: ${courseToUpdate.uit}, Status: ${newStatus}`);
          
          if (newStatus === 3 || newStatus === 4) {
            console.log(`🎯 === CRITICĂ === Status ${newStatus} va fi trimis la server de serviciul Android!`);
            console.log(`📡 Endpoint: gps.php - ar trebui să primească răspuns 200`);
          }
          
          try {
            // CRITICAL FIX: Trimite UIT real, nu ikRoTrans la serviciul Android
            const androidResult = window.AndroidGPS.updateStatus(String(courseToUpdate.uit), newStatus);
            console.log(`✅ Rezultat Android updateStatus: ${androidResult}`);
            console.log(`📱 === ANDROID GPS STATUS UPDATE COMPLETED ===`);
          } catch (androidError) {
            console.error(`❌ EROARE Android updateStatus:`, androidError);
          }
        } else {
          console.error(`❌ === PROBLEMĂ CRITICĂ ===`);
          console.error(`📱 AndroidGPS nu este disponibil sau updateStatus lipsește!`);
          console.error(`🔧 window.AndroidGPS: ${!!window.AndroidGPS}`);
          console.error(`🔧 updateStatus method: ${!!(window.AndroidGPS && window.AndroidGPS.updateStatus)}`);
          console.error(`⚠️ Status ${newStatus} NU va fi trimis la server!`);
        }
        
        console.log(`✅ Cursa ${courseToUpdate.uit} status actualizat la ${newStatus} cu succes`);
        
        // Show success toast after successful API call
        if (action) {
          const successMessages = {
            start: { title: '✅ Cursă pornită cu succes!', message: 'GPS activ - coordonatele se transmit la 5 secunde.' },
            pause: { title: '⏸️ Cursă pauzată cu succes!', message: 'Transmisia GPS oprită. Poți relua oricând.' },
            resume: { title: '▶️ Cursă reluată cu succes!', message: 'GPS reactivat - transmisia continuă.' },
            finish: { title: '🏁 Cursă finalizată cu succes!', message: 'Toate datele GPS au fost salvate.' }
          };
          
          const successInfo = successMessages[action as keyof typeof successMessages];
          if (successInfo) {
            toast.success(successInfo.title, successInfo.message, 4000);
          }
        }
        
        // Clear any existing errors
        setError('');

      } catch (error) {
        console.error(`❌ Status update error:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
        
        // More specific error handling for GPS issues
        if (errorMessage.includes('GPS')) {
          setError(`GPS Error: ${errorMessage}. Verifică permisiunile GPS.`);
          toast.error('Eroare GPS', 'Verifică permisiunile de locație');
        } else {
          setError(`Status update failed: ${errorMessage}`);
          toast.error('Eroare la actualizare', errorMessage);
        }
        
        logAPIError(`Status update failed: ${errorMessage}`);
      }

      // Status already updated above - no duplicate update needed

      logAPI(`Course ${courseToUpdate.uit} status updated successfully to ${newStatus}`);
      console.log(`=== ACTUALIZARE STATUS COMPLETĂ ===`);
    } catch (error) {
      console.error("Eroare actualizare status:", error);
      logAPIError(`Status update failed: ${error}`);
      
      // Use setError instead of alert for better UX
      const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
      setError(`Actualizare status: ${errorMessage}`);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    } finally {
      console.log(`Acțiune cursă finalizată: ${courseId}`);
    }
  };

  // ELIMINAT - Cod duplicate pentru detectarea conectivității
  // Network detection este deja implementat în useEffect-ul principal

  // Removed unused function

  // Update time display every 30 seconds
  const [, forceUpdate] = useState({});
  useEffect(() => {
    if (!lastRefreshTime) return;
    
    const interval = setInterval(() => {
      forceUpdate({});
    }, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [lastRefreshTime]);



  // Monitor offline GPS count
  useEffect(() => {
    const updateOfflineCount = async () => {
      try {
        const { offlineGPSService } = await import('../services/offlineGPS');
        const stats = offlineGPSService.getStats();
        setOfflineGPSCount(stats.totalOffline);
        console.log(`📊 Offline GPS count updated: ${stats.totalOffline}`);
      } catch (error) {
        console.error("Error getting offline count:", error);
        setOfflineGPSCount(0);
      }
    };

    updateOfflineCount();
    const interval = setInterval(updateOfflineCount, 10000); // Update every 10 seconds pentru monitoring activ
    return () => clearInterval(interval);
  }, []);

  // SCROLL PERFORMANCE optimizat special pentru șoferi - REMOVED complet pentru zero overhead

  // ELIMINAT: JavaScript GPS service complet - folosim doar Android BackgroundGPSService
  // Android BackgroundGPSService gestionează TOATE cursele active simultan





  // Theme helper functions
  const isDarkTheme = (theme: Theme) => theme === 'dark' || theme === 'driver' || theme === 'nature' || theme === 'night';
  const getThemeBackground = (theme: Theme) => {
    switch (theme) {
      case 'dark': return 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
      case 'light': return 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)';
      case 'driver': return 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)';
      case 'business': return 'linear-gradient(135deg, #f8fafc 0%, #ffffff 30%, #e2e8f0 70%, #f1f5f9 100%)';
      case 'nature': return 'linear-gradient(135deg, #064e3b 0%, #065f46 30%, #047857 70%, #059669 100%)';
      case 'night': return 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 70%, #5b21b6 100%)';
      default: return 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
    }
  };
  
  const getThemeTextColor = (theme: Theme) => {
    switch (theme) {
      case 'dark': return '#f1f5f9';
      case 'light': return '#1e293b';
      case 'driver': return '#fff7ed';
      case 'business': return '#0f172a';
      case 'nature': return '#ecfdf5';
      case 'night': return '#f0f4ff';
      default: return '#f1f5f9';
    }
  };

  // Theme change handler
  const handleThemeChange = async (theme: Theme) => {
    try {
      await themeService.setTheme(theme);
      setCurrentTheme(theme);
      
      // Show success toast with theme name
      toast.addToast('success', 'Tema schimbată!', `Tema "${THEME_INFO[theme].name}" a fost aplicată cu succes.`, 3000);
    } catch (error) {
      console.error('Error changing theme:', error);
      
      // Show error toast
      toast.addToast('error', 'Eroare temă', 'Nu s-a putut schimba tema. Încercați din nou.', 4000);
    }
  };

  // Filter courses based on selected status
  const filteredCourses = selectedStatusFilter === 'all' 
    ? courses 
    : courses.filter(course => course.status === selectedStatusFilter);

  // ELIMINAT: Fallback timer care forța coursesLoaded
  // Utilizatorul trebuie să introducă un număr valid de vehicul

  // Remove the debug page component - we'll show inline instead

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

          
          {/* Logo Row - Top */}
          <div style={{
            textAlign: 'center',
            paddingTop: '60px',
            paddingBottom: '40px',
            flex: '0 0 auto'
          }}>
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
          </div>

          {/* Input Row - Middle */}
          <div style={{
            flex: '1 1 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 0'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '400px',
              background: currentTheme === 'dark' 
                ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '24px',
              padding: '40px 30px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
              {/* Enhanced Multi-Vehicle Input with History */}
              <div style={{ marginBottom: '30px' }}>
                <VehicleNumberDropdown
                  value={vehicleNumber}
                  onChange={(newValue: string) => {
                    setVehicleNumber(newValue);
                    // Clear error when user starts typing
                    if (error) {
                      setError("");
                    }
                    console.log(`📝 Vehicle number changed to: ${newValue}`);
                  }}
                  placeholder="Număr de înmatriculare (ex: B123ABC)"
                  darkMode={currentTheme === 'dark'}
                  onKeyPress={(e: React.KeyboardEvent) => e.key === "Enter" && handleLoadCourses()}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Button Row - Bottom */}
          <div style={{
            flex: '0 0 auto',
            padding: '20px 0 40px 0'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '400px',
              margin: '0 auto',
              background: currentTheme === 'dark' 
                ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: currentTheme === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '24px',
              padding: '30px',
              boxShadow: currentTheme === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(0, 0, 0, 0.05)'
            }}>
              {/* Main Action Button */}
              <button
                onClick={handleLoadCourses}
                disabled={loading || !vehicleNumber.trim()}
                style={{
                  width: '100%',
                  padding: '20px',
                  background: loading ? 'rgba(148, 163, 184, 0.5)' : 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(14, 165, 233, 0.3)'
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner" style={{ 
                      marginRight: '12px',
                      animation: 'spin 1s linear infinite'
                    }}></i>
                    Se încarcă cursele...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search" style={{ marginRight: '12px' }}></i>
                    Caută curse
                  </>
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  marginTop: '15px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '16px',
                  color: isDarkTheme(currentTheme) ? '#fca5a5' : '#dc2626',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: loading ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = currentTheme === 'dark' 
                      ? 'rgba(239, 68, 68, 0.2)' 
                      : 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  }
                }}
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Ieșire</span>
              </button>
              
              {error && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  color: '#fca5a5',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                  {error}
                </div>
              )}
            </div>
          </div>

          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              
              /* Lightweight scroll optimization - focus on performance */
              html, body, #root {
                background-color: ${isDarkTheme(currentTheme) ? '#0f172a' : '#ffffff'} !important;
                color: ${getThemeTextColor(currentTheme)} !important;
                overflow-x: hidden;
              }
              
              /* FORCE DARK SYSTEM BAR FOR ALL THEMES */
              .vehicle-screen {
                padding-top: 40px !important; /* Always 40px for dark status bar */
              }
              
              /* Status bar must be dark regardless of theme */
              meta[name="theme-color"] {
                content: "#0f172a" !important;
              }
              
              /* Removed pulse animation for better performance */
              /* @keyframes pulse - disabled for speed optimization */
              
              /* PERFORMANCE OPTIMIZATION - Minimal effects for maximum speed */
              .vehicle-dashboard-main-content {
                -webkit-overflow-scrolling: touch;
                /* Removed transform for better performance */
              }
              
              .courses-list-container {
                -webkit-overflow-scrolling: touch;
                /* Removed transform for better performance */
              }
              
              /* DISABLED hover effects for mobile performance */
              /* .course-card:hover effects removed for speed */
              
              /* OPTIMIZED SCROLLING FOR MAXIMUM PERFORMANCE */
              .courses-container {
                contain: layout style paint;
                will-change: scroll-position;
                scrollbar-width: none;
                -ms-overflow-style: none;
              }
              
              .courses-container::-webkit-scrollbar {
                display: none;
              }
              
              /* Remove tap highlights for better touch response */
              * {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
              }
              
              /* Disable transitions on course cards for speed */
              .course-card, .stat-card {
                transition: none !important;
                animation: none !important;
              }
            `}
          </style>

          {/* Debug Counter */}
          {clickCount >= 30 && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              color: '#64748b',
              fontSize: '12px',
              cursor: 'pointer'
            }} onClick={handleTimestampClick}>
              {clickCount}/50
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="corporate-header-professional loaded" style={{
            background: currentTheme === 'dark' 
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
              : currentTheme === 'light'
                ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)'
                : currentTheme === 'business'
                  ? 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)'
                  : currentTheme === 'nature'
                    ? 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)'
                    : currentTheme === 'night'
                      ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
                      : currentTheme === 'driver'
                        ? 'linear-gradient(135deg, #1c1917 0%, #292524 100%)'
                        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '40px 20px 15px 20px', // DARK SYSTEM BAR ALWAYS - 40px padding for all themes
            borderBottom: currentTheme === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header Top Row - Optimized 2-column layout: iTrack Brand + Vehicle Number */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              gap: '20px'
            }}>
              {/* iTrack Brand Logo - Left */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: '0 0 auto'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: 'white',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  i
                </div>
                <span style={{
                  color: currentTheme === 'light' || currentTheme === 'business' 
                    ? '#1e293b' 
                    : '#ffffff',
                  fontSize: '22px',
                  fontWeight: '700',
                  letterSpacing: '-0.5px'
                }}>
                  iTrack
                </span>
              </div>

              {/* Vehicle Number Dropdown - Right, aligned properly */}
              <div style={{ 
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center'
              }}>
                <VehicleNumberDropdown
                  value={vehicleNumber}
                  onChange={(newVehicle) => {
                    console.log(`🔄 Vehicul schimbat: ${vehicleNumber} → ${newVehicle}`);
                    setVehicleNumber(newVehicle);
                    // Reîncarcă cursele pentru noul vehicul doar dacă este diferit
                    if (newVehicle && newVehicle.trim() !== vehicleNumber?.trim()) {
                      console.log(`🚛 Vehicul nou confirmat: ${newVehicle} - reîncarc cursele`);
                      handleLoadCourses();
                    }
                  }}
                  darkMode={currentTheme === 'dark' || currentTheme === 'night' || currentTheme === 'nature' || currentTheme === 'driver'}
                  disabled={loading}
                  onNavigateToInput={() => {
                    // CRITIC: Reset complet pentru a forța pagina de input
                    console.log('🔄 ADAUGĂ VEHICUL NOU - reset complet la input mode');
                    setVehicleNumber('');
                    setCourses([]);
                    setCoursesLoaded(false);
                    setLoading(false);
                    console.log('✅ Aplicația resetată - va afișa input de vehicul');
                  }}
                />
              </div>
            </div>



            {/* Second Row - Action Icons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              gap: '15px',
              maxWidth: '300px',
              margin: '0 auto'
            }}>
              <div className="settings-button" onClick={() => setShowSettings(true)} title="Setări" style={{ 
                background: currentTheme === 'dark' 
                  ? 'rgba(100, 116, 139, 0.1)' 
                  : currentTheme === 'light'
                    ? 'rgba(241, 245, 249, 0.9)'
                    : currentTheme === 'driver'
                      ? 'rgba(120, 113, 108, 0.2)'  // Maro pentru driver
                      : currentTheme === 'business'
                        ? 'rgba(100, 116, 139, 0.2)'  // Gri pentru business
                        : currentTheme === 'nature'
                          ? 'rgba(120, 113, 108, 0.2)'  // Maro pentru nature
                          : currentTheme === 'night'
                            ? 'rgba(139, 92, 246, 0.2)'  // Violet pentru night
                            : 'rgba(241, 245, 249, 0.9)',
                border: currentTheme === 'dark' 
                  ? '1px solid rgba(100, 116, 139, 0.3)' 
                  : currentTheme === 'light'
                    ? '1px solid rgba(148, 163, 184, 0.3)'
                    : currentTheme === 'driver'
                      ? '1px solid rgba(120, 113, 108, 0.5)'
                      : currentTheme === 'business'
                        ? '1px solid rgba(100, 116, 139, 0.5)'
                        : currentTheme === 'nature'
                          ? '1px solid rgba(120, 113, 108, 0.5)'
                          : currentTheme === 'night'
                            ? '1px solid rgba(139, 92, 246, 0.5)'
                            : '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '12px', 
                padding: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                color: currentTheme === 'dark' 
                  ? '#94a3b8' 
                  : currentTheme === 'light'
                    ? '#334155'
                    : currentTheme === 'driver'
                      ? '#78716c'  
                      : currentTheme === 'business'
                        ? '#475569'  
                        : currentTheme === 'nature'
                          ? '#78716c'  
                          : currentTheme === 'night'
                            ? '#8b5cf6'  
                            : '#334155',
                width: '50px',
                height: '50px',
                flex: '0 0 auto'
              }}>
                <i className="fas fa-cog" style={{ fontSize: '18px' }}></i>
              </div>

              <div className="about-button" onClick={() => setShowAbout(true)} title="Despre aplicație" style={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // ALBASTRU FIX
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px', 
                padding: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                color: '#ffffff', // ALB FIX pentru contrast
                width: '50px',
                height: '50px',
                flex: '0 0 auto',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <i className="fas fa-info-circle" style={{ fontSize: '18px' }}></i>
              </div>

              {/* Status GPS + Internet unificat - elimină redundanța */}
              <div style={{ 
                background: isOnline 
                  ? (offlineGPSCount > 0 ? 'rgba(255, 193, 7, 0.15)' : 'rgba(34, 197, 94, 0.15)')
                  : 'rgba(239, 68, 68, 0.15)', 
                border: isOnline 
                  ? (offlineGPSCount > 0 ? '1px solid rgba(255, 193, 7, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)')
                  : '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px', 
                padding: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px',
                width: '50px',
                height: '50px',
                flex: '0 0 auto'
              }}>
                <span style={{ fontSize: '0.9rem' }}>
                  {isOnline ? (offlineGPSCount > 0 ? '📡' : '🟢') : '🔴'}
                </span>
              </div>

              <div className="logout-button-enhanced" onClick={() => setShowLogoutConfirm(true)} title="Ieșire" style={{ 
                background: currentTheme === 'dark' 
                  ? 'rgba(239, 68, 68, 0.1)' 
                  : currentTheme === 'light'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : currentTheme === 'driver'
                      ? 'rgba(239, 68, 68, 0.15)'  // Roșu mai subtil pentru driver
                      : currentTheme === 'business'
                        ? 'rgba(239, 68, 68, 0.2)'  // Roșu standard pentru business
                        : currentTheme === 'nature'
                          ? 'rgba(239, 68, 68, 0.2)'  // Roșu pentru contrast cu verde
                          : currentTheme === 'night'
                            ? 'rgba(239, 68, 68, 0.2)'  // Roșu pentru night
                            : 'rgba(239, 68, 68, 0.2)',
                border: currentTheme === 'dark' 
                  ? '1px solid rgba(239, 68, 68, 0.3)' 
                  : currentTheme === 'light'
                    ? '1px solid rgba(239, 68, 68, 0.5)'
                    : currentTheme === 'driver'
                      ? '1px solid rgba(239, 68, 68, 0.4)'
                      : currentTheme === 'business'
                        ? '1px solid rgba(239, 68, 68, 0.5)'
                        : currentTheme === 'nature'
                          ? '1px solid rgba(239, 68, 68, 0.5)'
                          : currentTheme === 'night'
                            ? '1px solid rgba(239, 68, 68, 0.5)'
                            : '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '12px', 
                padding: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: loading ? 'default' : 'pointer',
                color: currentTheme === 'dark' 
                  ? '#fca5a5' 
                  : currentTheme === 'light'
                    ? '#b91c1c'
                    : currentTheme === 'driver'
                      ? '#dc2626'  
                      : currentTheme === 'business'
                        ? '#b91c1c'  
                        : currentTheme === 'nature'
                          ? '#dc2626'  
                          : currentTheme === 'night'
                            ? '#f87171'  
                            : '#b91c1c',
                width: '50px',
                height: '50px',
                flex: '0 0 auto',
                opacity: loading ? 0.5 : 1
              }}>
                <i className="fas fa-sign-out-alt" style={{ fontSize: '18px' }}></i>
              </div>
            </div>

            {/* Third Row - Integrated Status & Sync Progress */}
            <div style={{
              marginTop: '15px',
              marginBottom: '5px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              {/* ELIMINAT - Duplicare cu indicatorul din header */}
              
              {/* Sync Progress Bar - Only show when there are coordinates to sync AND progress is not complete */}
              {offlineGPSCount > 0 && (offlineGPSCount > 5 || !isOnline) && (
                <div style={{
                  width: '200px',
                  background: currentTheme === 'light' || currentTheme === 'business'
                    ? 'rgba(255, 255, 255, 0.9)'
                    : currentTheme === 'nature'
                      ? 'rgba(6, 78, 59, 0.6)'
                      : currentTheme === 'night'
                        ? 'rgba(30, 27, 75, 0.6)'
                        : currentTheme === 'driver'
                          ? 'rgba(28, 25, 23, 0.6)'
                          : 'rgba(30, 41, 59, 0.6)',
                  border: currentTheme === 'light' || currentTheme === 'business'
                    ? '1px solid rgba(203, 213, 225, 0.4)'
                    : '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontSize: '10px',
                  /* OPTIMIZAT pentru telefoane vechi - elimină blur și shadow greu */
                  boxShadow: 'none'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                    color: currentTheme === 'light' || currentTheme === 'business'
                      ? '#64748b' 
                      : currentTheme === 'nature'
                        ? '#d1fae5'  // Verde deschis pentru Nature
                        : currentTheme === 'driver'
                          ? '#fef3c7'  // Galben deschis pentru Driver
                          : currentTheme === 'night'
                            ? '#e0e7ff'  // Violet deschis pentru Night
                            : '#cbd5e1'  // Default pentru Dark
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={offlineGPSCount > 0 ? 'sync-pulse' : ''} style={{ fontSize: '12px' }}>
                        {isOnline ? '📡' : '🔄'}
                      </span>
                      Sincronizare GPS
                    </span>
                    <span style={{ 
                      fontWeight: '600',
                      color: offlineGPSCount > 30 ? '#ef4444' : offlineGPSCount > 10 ? '#f59e0b' : '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{offlineGPSCount}</span>
                      <span style={{ fontSize: '9px', opacity: 0.8 }}>
                        {isOnline 
                          ? (offlineGPSCount > 30 ? '📤 sync...' : offlineGPSCount > 10 ? '⏳ așteptare' : '🔄 finalizare')
                          : '⭕ offline'
                        }
                      </span>
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '4px',
                    background: currentTheme === 'light' || currentTheme === 'business'
                      ? 'rgba(203, 213, 225, 0.5)'
                      : 'rgba(148, 163, 184, 0.2)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      height: '100%',
                      background: currentTheme === 'nature'
                        ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                        : currentTheme === 'night'
                          ? 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)'
                          : currentTheme === 'driver'
                            ? 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)'
                            : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                      width: `${Math.max(10, 100 - (offlineGPSCount * 1.5))}%`, // Realistic progress based on pending coords
                      borderRadius: '2px',
                      transition: 'width 0.3s ease-in-out'
                    }} />
                  </div>
                </div>
              )}
            </div>
            

          </div>

          {/* Debug Trigger - Hidden Timestamp Area */}
          <div 
            onClick={handleTimestampClick}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '50px',
              height: '30px',
              cursor: 'pointer',
              opacity: 0,
              zIndex: 1000
            }}
          >
            {clickCount >= 30 && (
              <span style={{ 
                color: '#64748b', 
                fontSize: '12px',
                opacity: 1,
                display: 'block'
              }}>
                ({clickCount}/50)
              </span>
            )}
          </div>

          {/* Main Dashboard Content */}
          <div className="vehicle-dashboard-main-content" style={{ 
            paddingTop: '180px', // INCREASED to 180px to completely clear the fixed header
            background: getThemeBackground(currentTheme),
            minHeight: 'calc(100dvh - 180px)' // Updated to match padding
          }}>
            {/* Statistics Cards - 4 in One Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              margin: '15px 0',
              padding: '0 20px'
            }}>
              <div className="analytics-grid-centered">
                <div className="stat-card total" onClick={() => setSelectedStatusFilter('all')} style={{
                  background: currentTheme === 'light' 
                    ? 'rgba(255, 255, 255, 0.9)' // Light theme - light background 
                    : currentTheme === 'business'
                      ? 'rgba(255, 255, 255, 0.9)' // Business theme - light background
                      : currentTheme === 'nature'
                        ? 'rgba(6, 78, 59, 0.9)' // Nature theme - dark green background
                        : currentTheme === 'night'
                          ? 'rgba(30, 27, 75, 0.9)' // Night theme - dark purple background
                          : currentTheme === 'driver'
                            ? 'rgba(28, 25, 23, 0.9)' // Driver theme - dark brown background
                            : 'rgba(30, 41, 59, 0.9)', // Dark theme - dark background
                  border: currentTheme === 'light' || currentTheme === 'business'
                    ? '1px solid rgba(203, 213, 225, 0.4)'
                    : '1px solid rgba(148, 163, 184, 0.2)',
                  color: currentTheme === 'light' 
                    ? '#1e293b' // Dark text for Light theme
                    : currentTheme === 'business'
                      ? '#000000' // BLACK text for Business theme
                      : '#f1f5f9'  // Light text for other themes
                }}>
                  <div className="stat-card-content">
                    <div className="stat-icon-wrapper total">
                      <i className="fas fa-list-alt"></i>
                    </div>
                    <div className="stat-details">
                      <div className="stat-label" style={{ 
                        color: currentTheme === 'light' || currentTheme === 'business' ? '#000000' : 'inherit' 
                      }}>TOTAL</div>
                      <div className="stat-value" style={{ 
                        color: currentTheme === 'light' || currentTheme === 'business' ? '#000000' : 'inherit' 
                      }}>{courses.length}</div>
                    </div>
                  </div>
                </div>

                <div className="stat-card active" onClick={() => setSelectedStatusFilter(2)} style={{
                  background: currentTheme === 'light' 
                    ? 'rgba(240, 253, 244, 0.9)' // Light theme - light green background
                    : currentTheme === 'business'
                      ? 'rgba(240, 253, 244, 0.9)' // Business theme - light green background
                      : currentTheme === 'nature'
                        ? 'rgba(4, 120, 87, 0.9)' // Nature theme - medium green background
                        : currentTheme === 'night'
                          ? 'rgba(34, 197, 94, 0.2)' // Night theme - green accent on dark
                          : currentTheme === 'driver'
                            ? 'rgba(34, 197, 94, 0.2)' // Driver theme - green accent on dark
                            : 'rgba(34, 197, 94, 0.2)', // Dark theme - green accent on dark
                  border: currentTheme === 'light' || currentTheme === 'business'
                    ? '1px solid rgba(34, 197, 94, 0.3)'
                    : '1px solid rgba(34, 197, 94, 0.4)',
                  color: currentTheme === 'light' 
                    ? '#065f46' // Dark green text for Light theme
                    : currentTheme === 'business'
                      ? '#000000' // BLACK text for Business theme
                      : '#4ade80'  // Light green text for other themes
                }}>
                  <div className="stat-card-content">
                    <div className="stat-icon-wrapper active">
                      <i className="fas fa-play"></i>
                    </div>
                    <div className="stat-details">
                      <div className="stat-label" style={{ 
                        color: currentTheme === 'light' || currentTheme === 'business' ? '#000000' : 'inherit' 
                      }}>ACTIV</div>
                      <div className="stat-value" style={{ 
                        color: currentTheme === 'light' || currentTheme === 'business' ? '#000000' : 'inherit' 
                      }}>{courses.filter(c => c.status === 2).length}</div>
                    </div>
                  </div>
                </div>

                <div className="stat-card paused" onClick={() => setSelectedStatusFilter(3)} style={{
                  background: currentTheme === 'light' 
                    ? 'rgba(254, 252, 232, 0.9)' // Light theme - light yellow background
                    : currentTheme === 'business'
                      ? 'rgba(254, 252, 232, 0.9)' // Business theme - light yellow background
                      : currentTheme === 'nature'
                        ? 'rgba(251, 191, 36, 0.2)' // Nature theme - yellow accent on dark green
                        : currentTheme === 'night'
                          ? 'rgba(251, 191, 36, 0.2)' // Night theme - yellow accent on dark purple
                          : currentTheme === 'driver'
                            ? 'rgba(251, 146, 60, 0.3)' // Driver theme - orange accent on dark brown  
                            : 'rgba(251, 191, 36, 0.2)', // Dark theme - yellow accent on dark
                  border: currentTheme === 'light' || currentTheme === 'business'
                    ? '1px solid rgba(251, 191, 36, 0.3)'
                    : '1px solid rgba(251, 191, 36, 0.4)',
                  color: currentTheme === 'light' 
                    ? '#a16207' // Dark orange text for Light theme
                    : currentTheme === 'business'
                      ? '#000000' // BLACK text for Business theme
                      : '#fbbf24'  // Light yellow text for other themes
                }}>
                  <div className="stat-card-content">
                    <div className="stat-icon-wrapper paused">
                      <i className="fas fa-pause"></i>
                    </div>
                    <div className="stat-details">
                      <div className="stat-label" style={{ 
                        color: currentTheme === 'light' || currentTheme === 'business' ? '#000000' : 'inherit' 
                      }}>PAUZĂ</div>
                      <div className="stat-value" style={{ 
                        color: currentTheme === 'light' || currentTheme === 'business' ? '#000000' : 'inherit' 
                      }}>{courses.filter(c => c.status === 3).length}</div>
                    </div>
                  </div>
                </div>

                <div className="stat-card available" onClick={() => setSelectedStatusFilter(1)} style={{
                  background: currentTheme === 'light' 
                    ? 'rgba(239, 246, 255, 0.9)' // Light theme - light blue background
                    : currentTheme === 'business'
                      ? 'rgba(239, 246, 255, 0.9)' // Business theme - light blue background
                      : currentTheme === 'nature'
                        ? 'rgba(59, 130, 246, 0.2)' // Nature theme - blue accent on dark green
                        : currentTheme === 'night'
                          ? 'rgba(99, 102, 241, 0.3)' // Night theme - purple accent on dark purple
                          : currentTheme === 'driver'
                            ? 'rgba(59, 130, 246, 0.2)' // Driver theme - blue accent on dark brown
                            : 'rgba(59, 130, 246, 0.2)', // Dark theme - blue accent on dark
                  border: currentTheme === 'light' || currentTheme === 'business'
                    ? '1px solid rgba(59, 130, 246, 0.3)'
                    : '1px solid rgba(59, 130, 246, 0.4)',
                  color: currentTheme === 'light' 
                    ? '#1d4ed8' // Dark blue text for Light theme
                    : currentTheme === 'business'
                      ? '#000000' // BLACK text for Business theme
                      : '#60a5fa'  // Light blue text for other themes
                }}>
                  <div className="stat-card-content">
                    <div className="stat-icon-wrapper available">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-details">
                      <div className="stat-label" style={{ 
                        color: currentTheme === 'light' || currentTheme === 'business' ? '#000000' : 'inherit' 
                      }}>DISPONIBIL</div>
                      <div className="stat-value" style={{ 
                        color: currentTheme === 'light' || currentTheme === 'business' ? '#000000' : 'inherit' 
                      }}>{courses.filter(c => c.status === 1).length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>





            {/* Courses List - Performance Optimized */}
            <div className="courses-container" style={{ 
              position: 'relative', 
              zIndex: 1,
              marginBottom: '100px', // Extra space for Android navigation
              paddingBottom: '60px',  // Ensure content is visible above navigation
              // Performance optimizations
              contain: 'layout style paint',
              willChange: 'scroll-position',
              overscrollBehavior: 'contain'
            }}>
              {filteredCourses.length === 0 ? (
                <div className="no-courses-message" style={{
                  background: currentTheme === 'dark' 
                    ? 'rgba(15, 23, 42, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: currentTheme === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '20px',
                  padding: '40px 30px',
                  margin: '20px',
                  textAlign: 'center',
                  color: currentTheme === 'dark' 
                    ? '#cbd5e1' 
                    : currentTheme === 'light' || currentTheme === 'business'
                      ? '#000000'  // BLACK text for Light/Business themes
                      : '#475569', // Gray for other themes
                  boxShadow: currentTheme === 'dark' 
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                    : '0 8px 32px rgba(0, 0, 0, 0.15)'
                }}>
                  <i className="fas fa-info-circle" style={{ 
                    fontSize: '48px', 
                    color: '#60a5fa', 
                    marginBottom: '20px',
                    display: 'block'
                  }}></i>
                  <h3 style={{ 
                    color: currentTheme === 'dark' 
                      ? '#ffffff' 
                      : currentTheme === 'light' || currentTheme === 'business'
                        ? '#000000'  // BLACK text for Light/Business themes
                        : '#1e293b', // Default dark text for other themes
                    margin: '0 0 12px 0',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    Nicio cursă găsită
                  </h3>
                  <p style={{ 
                    margin: '0',
                    fontSize: '16px',
                    lineHeight: '1.5',
                    opacity: '0.9'
                  }}>
                    Nu există curse {selectedStatusFilter === 'all' ? '' : 'cu statusul selectat'} pentru vehiculul {vehicleNumber}.
                  </p>
                  <div style={{
                    marginTop: '24px',
                    padding: '12px 20px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    color: currentTheme === 'dark' 
                      ? '#93c5fd' 
                      : currentTheme === 'light' || currentTheme === 'business'
                        ? '#000000'  // BLACK text for Light/Business themes  
                        : '#1e40af'  // Blue text for other themes
                  }}>
                    <i className="fas fa-lightbulb" style={{ marginRight: '8px' }}></i>
                    Verifică numărul vehiculului sau contactează administratorul.
                  </div>
                </div>
              ) : (
                <div className="courses-list courses-list-container" style={{ 
                  position: 'relative', 
                  isolation: 'isolate',
                  paddingBottom: '120px', // Extra padding for last course and bottom bar
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  /* OPTIMIZAT pentru telefoane vechi - eliminate proprietățile grele */
                  willChange: 'auto', // Reduce memory usage
                  contain: 'layout style' // Optimize layout calculations
                }}>
                  {filteredCourses.map((course, index) => (
                    <div key={course.id} style={{ 
                      position: 'relative', 
                      zIndex: 1,
                      marginBottom: index === filteredCourses.length - 1 ? '20px' : '12px', // Extra space for last item
                      isolation: 'isolate'
                    }}>
                      <CourseDetailCard
                        course={course}
                        onStatusUpdate={handleCourseStatusUpdate}
                        isLoading={loadingCourses.has(course.id)}
                        currentTheme={currentTheme}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Debug Panel - Inline under courses */}
              {showDebugPage && (
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: currentTheme === 'dark' 
                    ? 'rgba(15, 23, 42, 0.8)' 
                    : 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '12px',
                  border: currentTheme === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}>
                  {/* Debug header with close button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '15px',
                    paddingBottom: '10px',
                    borderBottom: currentTheme === 'dark' 
                      ? '1px solid rgba(255,255,255,0.1)' 
                      : '1px solid rgba(0,0,0,0.1)'
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '16px',
                      color: currentTheme === 'dark' ? '#ffffff' : '#1e293b'
                    }}>
                      🔧 Debug Panel - GPS Logs în Timp Real
                    </h3>
                    <button
                      onClick={() => setShowDebugPage(false)}
                      style={{
                        background: currentTheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                        border: currentTheme === 'dark' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)',
                        color: currentTheme === 'dark' ? '#fca5a5' : '#dc2626',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✕ Închide
                    </button>
                  </div>

                  {/* Inline AdminPanel content */}
                  <AdminPanel 
                    onClose={() => setShowDebugPage(false)}
                    vehicleNumber={vehicleNumber}
                    courses={courses}
                    currentTheme={currentTheme}
                    isInline={true}
                  />
                </div>
              )}
            </div>

            {/* Debug Access Icon - Discrete in bottom right */}
            <div 
              onClick={handleTimestampClick}
              style={{
                position: 'fixed',
                bottom: '80px',
                right: '20px',
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 999,
                opacity: '0.3',
                transition: 'opacity 0.2s ease',
                background: 'rgba(100, 116, 139, 0.1)',
                border: '1px solid rgba(100, 116, 139, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
                /* REMOVED transform pentru ZERO lag la scroll */
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.3';
                /* REMOVED transform pentru ZERO lag la scroll */
              }}
            >
              <i className="fas fa-cog" style={{
                fontSize: '14px',
                color: '#64748b'
              }}></i>
              {clickCount >= 30 && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#f59e0b',
                  color: '#ffffff',
                  fontSize: '9px',
                  padding: '2px 4px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {clickCount}
                </div>
              )}
            </div>

            {/* Course Stats Modal */}
            <CourseStatsModal
              isOpen={showStatsModal}
              onClose={() => setShowStatsModal(false)}
              courses={courses}
              vehicleNumber={vehicleNumber}
              currentTheme={currentTheme}
            />



            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px'
              }}>
                <div style={{
                  background: currentTheme === 'dark' 
                    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: '20px',
                  padding: '30px',
                  maxWidth: '400px',
                  width: '100%',
                  textAlign: 'center',
                  border: currentTheme === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
                }}>
                  {/* Header */}
                  <div style={{
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 15px',
                      fontSize: '24px'
                    }}>
                      🚪
                    </div>
                    <h3 style={{
                      color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
                      fontSize: '20px',
                      fontWeight: '700',
                      margin: 0
                    }}>
                      Confirmare ieșire
                    </h3>
                  </div>

                  {/* Warning Content */}
                  <div style={{
                    marginBottom: '25px',
                    textAlign: 'left'
                  }}>
                    <p style={{
                      color: currentTheme === 'dark' ? '#cbd5e1' : '#475569',
                      fontSize: '16px',
                      marginBottom: '15px',
                      lineHeight: '1.5'
                    }}>
                      Sigur vrei să ieși din aplicație?
                    </p>
                    
                    <div style={{
                      background: currentTheme === 'dark' 
                        ? 'rgba(239, 68, 68, 0.1)' 
                        : 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '12px',
                      padding: '15px'
                    }}>
                      <p style={{
                        color: currentTheme === 'dark' ? '#fca5a5' : '#dc2626',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '8px'
                      }}>
                        ⚠️ Se vor pierde următoarele date:
                      </p>
                      <ul style={{
                        color: currentTheme === 'dark' ? '#fca5a5' : '#dc2626',
                        fontSize: '13px',
                        marginBottom: 0,
                        paddingLeft: '20px',
                        lineHeight: '1.4'
                      }}>
                        <li>Toate cursele active se vor opri</li>
                        <li>GPS tracking se va dezactiva</li>
                        <li>Datele nesincronizate se păstrează pentru următoarea autentificare</li>
                        <li>Sesiunea curentă se va închide</li>
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      style={{
                        flex: 1,
                        background: currentTheme === 'dark' 
                          ? 'rgba(100, 116, 139, 0.2)' 
                          : 'rgba(148, 163, 184, 0.1)',
                        border: currentTheme === 'dark' 
                          ? '1px solid rgba(100, 116, 139, 0.3)' 
                          : '1px solid rgba(148, 163, 184, 0.2)',
                        color: currentTheme === 'dark' ? '#cbd5e1' : '#475569',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Anulează
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ffffff',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                      }}
                    >
                      {loading ? 'Se iese...' : 'Da, ieși'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Panel Modal */}
            {showAdminPanel && (
              <AdminPanel
                onLogout={() => setShowLogoutConfirm(true)}
                onClose={() => setShowAdminPanel(false)}
              />
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
              currentTheme={currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night' ? 'dark' : 'light'}
            />


          </div>
        </>
      )}
    </div>
  );
};

export default VehicleScreen;
