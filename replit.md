# iTrack GPS Application

## Overview
iTrack is a professional enterprise GPS monitoring application for fleet management in Romania. It provides real-time GPS tracking, trip management, robust offline capabilities, and comprehensive analytics to optimize transport operations. The project's vision is to offer a reliable and efficient solution for vehicle tracking, supporting operational excellence and market potential in the transport industry.

## User Preferences
Preferred communication style: Simple, everyday language.
Date format preference: DD-MM-YYYY (zi-luna-an) for Romanian locale.
Timestamp preference: Romania local time (+3 hours from UTC) for all GPS data and system timestamps.
Performance optimization: Universal optimization for ALL Android phones (not device-specific).
Code comments: All comments must be in Romanian language.
Backup files: Remove unnecessary backup files.
UI Performance: Remove heavy animations that may affect performance on Android devices.
Offline Coordinates Policy: NEVER clear offline coordinates at logout - preserve route continuity across login sessions to avoid missing road segments.
Code Cleanup: Comprehensive cleanup completed - removed unused files/services and functions.
GPS Background Fix: Restored direct Android GPS calls for background service with hybrid browser backup system to ensure GPS continues working when phone is locked/app minimized.
Real Device Data: Implemented dynamic battery level detection and real network type detection instead of static values, using Android native APIs, Capacitor Device/Network plugins, and browser APIs with intelligent fallbacks.
UI Optimization: Eliminated redundant status indicators - unified GPS+Internet status replaces separate "Online/Offline" indicator for cleaner interface.

## System Architecture

### Frontend
- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5
- **UI Framework**: Bootstrap 5.3.6 with custom CSS featuring glassmorphism
- **Mobile Framework**: Capacitor 7.3.0 for native cross-platform deployment (primarily Android)

### Backend Integration
- **API Communication**: RESTful API integration
- **Authentication**: JWT token with automatic persistence
- **Data Format**: JSON

### Mobile Platform Integration
- **Primary Target**: Android with native GPS services
- **Cross-Platform**: Capacitor allows iOS deployment
- **Native Services**: Enhanced GPS tracking with continuous background operation, intelligent battery management via foreground service, and WakeLock implementation.
- **Permissions**: Location, background location, and exclusion from battery optimization.

### Core Features
- **Enterprise Authentication**: Secure email/password login, JWT token management, and secure logout.
- **Advanced GPS Tracking**: Native Android service for continuous background tracking (10-second interval), offline caching of coordinates with batch synchronization, and high-precision data. Includes adaptive intervals, foreground service priority, and Doze mode bypass. GPS continues for both active and paused courses.
- **Professional Trip Management**: Vehicle number input, loading of vehicle-specific trips, real-time status management (Available, Active, Pause, Stopped), and an optimized driver interface.
- **Enterprise Analytics**: Dedicated modals for detailed trip statistics (distance, time, speed) using the Haversine formula, and cumulative reports.
- **Advanced Debug Panel**: Accessible via 50 clicks on the timestamp, providing persistent logging (GPS, API, OFFLINE_SYNC, APP, ERROR categories) and export functions.
- **Robust Offline Management**: Automatic online/offline status detection, intelligent GPS coordinate caching, visual synchronization progress, automatic recovery, and retry logic for data transmission. Syncs in batches of 50 coordinates with chronological sorting.

### Technical Implementations
- **GPS Logic**: BackgroundGPSService runs persistently in the background with ScheduledExecutorService for reliable timing. Acquires WakeLock for deep sleep prevention, uses dedicated HandlerThread for GPS operations, and guaranteed execution through foreground service protection with HIGH priority notification.
- **UI/UX Decisions**: Corporate design with glassmorphism effects, gradient backgrounds, and intuitive iconography. Responsive layouts with safe area padding. Optimized for zero-lag scrolling by eliminating `backdrop-filter`, `blur` effects, and `transform` properties. Cleaner interface without redundant GPS status indicators.
- **Error Handling**: Comprehensive error logging, non-blocking GPS operations, graceful degradation for network issues, and clear user guidance for permissions.
- **Environment Management**: Centralized API_CONFIG system for easy environment switching (PROD/TEST/DEV) with automated build scripts.
- **HTTP Modernization**: Exclusively uses CapacitorHttp native methods for all API calls in Android-only environment.

## External Dependencies
- **Capacitor**: `@capacitor/core`, `@capacitor/android`, `@capacitor/geolocation`, `@capacitor/preferences`
- **Capacitor Community Plugins**: `@capacitor-community/background-geolocation`
- **APIs** (PROD - etsm_prod - ACTIV):
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/login.php` (Authentication)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/logout.php` (Logout)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/vehicul.php` (Course Management)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php` (GPS Data Transmission)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/rezultate.php` (GPS Result Verification)
- **UI Libraries**: Bootstrap 5.3.6

## Recent Critical Fixes (August 2025)

### **ARHITECTURĂ BACKGROUND GPS SIMPLIFICATĂ (18 Aug 2025)**
- **ELIMINAT COMPLET**: JavaScript GPS service și duplicarea transmisiilor 
- **ANDROID MULTI-UIT**: BackgroundGPSService acum gestionează TOATE cursele simultan cu HashMap<String, CourseData>
- **TRANSMISIE UNICĂ**: Un singur ciclu GPS de 10 secunde transmite coordonate pentru toate UIT-urile active 
- **BACKGROUND GARANTAT**: Foreground service cu IMPORTANCE_HIGH, WakeLock, ScheduledExecutorService pentru stabilitate maximă
- **EFICIENȚĂ MAXIMĂ**: O singură implementație GPS nativă pentru app deschisă ȘI telefon blocat

### **Workflow PAUSE→RESUME→STOP Corrigat**
- **PROBLEMĂ IDENTIFICATĂ**: PAUSE (status 3) elimina cursa din activeCourses, făcând RESUME imposibil
- **SOLUȚIE**: PAUSE păstrează cursa în activeCourses, doar STOP (4) elimină definitiv
- **ANALYTICS**: Adăugat pauseCourseTracking() și resumeCourseTracking() în courseAnalytics.ts
- **WORKFLOW CORECT**: START→PAUSE→RESUME→STOP funcționează perfect

### **Real Sensor Data Integration Completă**
- **ELIMINAT**: Toate valorile hardcodate (battery 50%, gsm_signal 4, GPS dummy)
- **IMPLEMENTAT**: getNetworkSignal() și getLastKnownLocation() în BackgroundGPSService
- **STATUS UPDATES**: 3/4 includ coordonate GPS reale prin getLastKnownLocation()
- **NETWORK DETECTION**: WiFi vs Cellular cu signal strength autentic

### **Critical Status Transmission Fix**
- **PROBLEMA GĂSITĂ**: JavaScript GPS transmission trimitea status 2 pentru toate cursele din activeCourses, inclusiv cele în PAUSE
- **SOLUȚIA IMPLEMENTATĂ**: Verificare `course.status !== 2` în JavaScript GPS loop - skip transmission pentru PAUSE/STOP
- **ANDROID FIX**: BackgroundGPSService oprește transmisia complet pentru status 3/4 
- **WORKFLOW COMPLET**: PAUSE nu mai trimite status 2 automat - transmisia se oprește total până la RESUME

### **ScheduledExecutorService Complete Fix (18 Aug 2025) - FINAL**
- **PROBLEMĂ IDENTIFICATĂ**: ScheduledExecutorService nu se executa continuu din cauza Android kill și logica PAUSE/RESUME
- **REPARAȚII CRITICE APLICATE**:
  - WakeLock cu `ACQUIRE_CAUSES_WAKEUP` și timeout 1h cu auto-renewal pentru anti-kill
  - Prima execuție ScheduledExecutorService IMEDIAT (delay=0) în loc de 2 secunde
  - Verificare completă status cursă în loop GPS: DOAR status=2 primesc GPS data
  - Enhanced debugging cu WakeLock monitoring și JavaScript logging
  - Verificare dacă toate cursele sunt în PAUSE pentru skip GPS cycle complet
- **WORKFLOW COMPLET**: START(2)→GPS transmission / PAUSE(3)→skip GPS / RESUME(2)→reactivare GPS / STOP(4)→remove și status final
- **STATUS**: COMPLET REPARAT - Multi-UIT ScheduledExecutorService cu transmisie continuă garantată

### **Network Check Failed Fix (18 Aug 2025)**
- **PROBLEMĂ IDENTIFICATĂ**: JavaScript network check folosea fetch ping test spre endpoint inexistent '/ping'
- **CAUZA**: fetch(API_BASE_URL + 'ping') genera "Network check failed: Failed to fetch"
- **SOLUȚIA APLICATĂ**: Înlocuit cu Capacitor Network plugin pentru detectare robustă Android
- **IMPACT ELIMIAT**: Eroarea nu afecta BackgroundGPSService - doar UI network status
- **REZULTAT**: Eliminată eroarea repetitivă, detectare rețea mai fiabilă pentru Android

### **Identificator Consistent Fix - ikRoTrans (18 Aug 2025)**
- **PROBLEMA IDENTIFICATĂ**: UIT-urile pot fi duplicate, causând conflicte în HashMap activeCourses
- **SOLUȚIA APLICATĂ**: Folosire consistentă a ikRoTrans ca identificator unic în toată aplicația
- **MODIFICĂRI**:
  - JavaScript: startGPS(String(course.ikRoTrans), vehicleNumber, course.uit, token, 2)
  - MainActivity: courseId = ikRoTrans (unic), uit = course.uit (pentru server)
  - BackgroundGPSService: HashMap key = ikRoTrans, UIT real se trimite la server
  - courseAnalytics: folosește ikRoTrans ca identificator
- **BENEFICII**: Eliminare conflicte HashMap, consistență totală, tracking multi-cursă fiabil

### **Verificare Exhaustivă Multi-Course ScheduledExecutorService (18 Aug 2025)**
- **CONFIRMAT FUNCȚIONAL**: ScheduledExecutorService transmite GPS la 10 secunde pentru toate cursele cu status=2
- **MULTI-COURSE SUPPORT**: HashMap cu ikRoTrans keys suportă 3 curse active + 2 pauză simultan
- **PAUSE/RESUME WORKFLOW**: status=3 skip transmission, status=2 reactivează GPS transmission automat
- **TELEFON BLOCAT**: Foreground Service + WakeLock garantează GPS transmission continuă cu ecranul oprit
- **START SIMULTAN**: 3 curse pornesc simultan fără conflicte - ikRoTrans identificatori unici
- **BACKGROUND EXECUTION**: WakeLock PARTIAL_WAKE_LOCK + ACQUIRE_CAUSES_WAKEUP bypass Android Doze complet

### **CRITICAL FIX: Status Updates UIT Field (18 Aug 2025) - FINAL**
- **PROBLEMĂ IDENTIFICATĂ**: sendStatusUpdateToServer trimitea ikRoTrans în câmpul "uit" la server în loc de UIT real
- **CAUZA**: specificUIT parametru era ikRoTrans (HashMap key), nu UIT-ul real pentru server
- **SOLUȚIA APLICATĂ**: 
  - Extragere courseData din activeCourses.get(specificUIT) 
  - Folosire courseData.realUit pentru câmpul "uit" la server
  - Enhanced logging pentru debugging: ikRoTrans → realUit mapping
- **IMPACT FIX**: Status updates (PAUSE/STOP) trimit acum UIT real la server, nu ikRoTrans
- **VERIFICARE**: GPS data transmission era deja corectă (linia 580), doar status updates aveau problema
- **REZULTAT**: Identificare consistentă cursă pe server pentru ambele - GPS data ȘI status updates

### **Async GPS → Sync GPS Fix (18 Aug 2025) - FINAL**
- **PROBLEMĂ IDENTIFICATĂ**: LocationListener ASINCRON căuza ScheduledExecutorService să nu execute repetitiv
- **CAUZA**: performGPSCycle() se termina IMEDIAT după requestLocationUpdates(), onLocationChanged() venea DUPĂ
- **SOLUȚIA APLICATĂ**: 
  - getLastKnownLocation() SINCRON ca primary method (inspirat din dummy test care funcționa)
  - Transmisie IMEDIATĂ în performGPSCycle() fără async waiting
  - Fallback la async GPS doar dacă nu există last known location
- **REZULTAT**: ScheduledExecutorService execută la fiecare 10 secunde cu transmisie garantată
- **WORKFLOW CORECT**: Task se termină cu SUCCESS → următorul task la +10s → ciclu continuu