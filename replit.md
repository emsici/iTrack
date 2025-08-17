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

### **VERIFICARE COMPLETĂ APLICAȚIE MULTI-COURSE (August 17, 2025)**

#### **Componente Verificate Exhaustiv:**

**FRONTEND (18 fișiere TypeScript/TSX - 9,269 linii exacte verificate):**
- `VehicleScreenProfessional.tsx` (2345 linii) - Dashboard principal cu activeCourses Map pentru management multi-course
- `CourseDetailCard.tsx` (1066 linii) - Carduri individuale cu butoane START/PAUSE/RESUME/STOP per cursă
- `LoginScreen.tsx` (867 linii) - Autentificare securizată cu API etsm_prod/login.php
- `CourseStatsModal.tsx` (614 linii) - Modal statistici individuale per cursă cu analytics separate
- `AdminPanel.tsx` (355 linii) - Debug panel cu logs GPS în timp real pentru toate cursele
- `api.ts` (621 linii) - Client API cu CapacitorHttp pentru toate endpoint-urile etsm_prod
- `courseAnalytics.ts` (434 linii) - Serviciu analytics per cursă cu pauseCourseTracking() și resumeCourseTracking()
- `offlineGPS.ts` (346 linii) - Manager GPS offline cu batch sync pentru coordonate cached

**BACKEND ANDROID NATIV (2 fișiere Java - 1,109 linii exacte verificate):**
- `BackgroundGPSService.java` (759 linii) - Serviciu GPS multi-course cu Map<String, Integer> courseStatuses
- `MainActivity.java` (350 linii) - Bridge WebView cu startGPS/updateStatus/stopGPS pentru comunicare JavaScript-Android

#### **FUNCȚIONALITĂȚI MULTI-COURSE VERIFICATE:**

**GPS MANAGEMENT PER CURSĂ:**
- `Map<String, Integer> courseStatuses` în BackgroundGPSService pentru status individual per UIT
- `transmitGPSDataForActiveCourses()` transmite GPS doar pentru curse cu status = 2 (ACTIV)
- Funcțiile PAUSE (3) și RESUME (2) operează independent pentru fiecare UIT
- STOP (4) elimină cursa complet din courseStatuses Map

**WORKFLOW COMPLET FUNCȚIONAL:**
- **START**: `activeCourses.set(uit, {status: 2})` + `courseStatuses.put(uit, 2)` → GPS pornește
- **PAUSE**: `activeCourses.set(uit, {status: 3})` + GPS skip pentru UIT-ul respectiv  
- **RESUME**: `activeCourses.set(uit, {status: 2})` + GPS reactivat pentru UIT
- **STOP**: `activeCourses.delete(uit)` + `courseStatuses.remove(uit)` → eliminare completă

**REAL SENSOR DATA INTEGRATION:**
- `getNetworkSignal()` pentru detectarea signal strength autentic (WiFi vs Cellular)
- `getLastKnownLocation()` pentru coordonate GPS reale în status updates 3/4
- Eliminat complet valorile hardcodate (battery 50%, gsm_signal 4, GPS dummy)

**SYSTEM ARCHITECTURE COMPLETĂ VERIFICATĂ:**
- **Frontend**: React 19.1.0 + TypeScript + Bootstrap 5.3.6 + 6 teme profesionale
- **Mobile**: Capacitor 7.3.0 pentru bridge JavaScript-Android
- **GPS Core**: BackgroundGPSService cu ScheduledExecutorService la 10 secunde interval
- **API**: etsm_prod endpoints cu CapacitorHttp + fetch fallback
- **Offline**: Cache GPS inteligent cu batch sync și retry logic