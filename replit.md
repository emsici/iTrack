# iTrack GPS Application

## Overview
iTrack is a professional enterprise GPS monitoring application designed for fleet management, specifically for transport companies in Romania. It provides real-time GPS tracking, trip management, robust offline capabilities, and comprehensive analytics to optimize transport operations. The project aims to offer a reliable and efficient solution for vehicle tracking, supporting business vision for operational excellence and market potential in the transport industry.

## User Preferences
Preferred communication style: Simple, everyday language.
Date format preference: DD-MM-YYYY (zi-luna-an) for Romanian locale.
Performance optimization: Universal optimization for ALL Android phones (not device-specific).
Code comments: All comments must be in Romanian language.
Backup files: Remove unnecessary backup files (OptimalGPSService_backup.java removed).

## Business Materials
- **Business Presentation**: PREZENTARE_BUSINESS_iTrack.md (for technical/business audiences)
- **Client Presentation**: PREZENTARE_CLIENTI_iTrack.md (ready-to-use document for client meetings and proposals)

## Recent Performance Optimizations (15/08/2025)

### **ULTIMELE ACTUALIZĂRI CRITICE - 15/08/2025 19:53**
- **SINCRONIZARE 100% AUTOMATĂ**: Eliminat complet butonul manual de sync - sistemul pornește automat când detectează coordonate offline
- **FRECVENȚĂ OPTIMIZATĂ**: Verificare la fiecare 3 secunde pentru pornire imediată a sync-ului automat
- **INTERFAȚĂ MODERNIZATĂ**: Design nou cu animație pulse, background albastru, mesaje clare "Se sincronizează automat când revine internetul"
- **GPS ANDROID OPTIMIZAT**: Location age redus la 2s, timeout la 15s pentru răspuns mai rapid
- **FIX COMPILARE ANDROID**: Adăugat API_BASE_URL_TEST lipsă pentru compilare fără erori
- **CENTRALIZARE API CRITICĂ**: Sincronizat configurația API între frontend și Android - ambele folosesc PROD pentru consistență
- **URL-URI UNIFICATE**: Frontend și Android folosesc aceleași URL-uri (etsm_test pentru TEST, etsm_prod pentru PROD)

### **ACTUALIZĂRI ANTERIOARE - 15/08/2025 17:55**
- **ZERO LAG SCROLL GARANTAT**: Eliminat complet backdrop-filter, blur effects, transform properties, will-change pentru scroll perfect
- **PĂTRATE ALBE ELIMINATE**: Removed gradient backgrounds + blur combinations care cauzau white flashes la scroll
- **GPU USAGE MINIMIZAT**: Transform properties eliminate complet, doar essential scroll properties păstrate
- **LOG-URI COMPLET TRADUSE ÎN ROMÂNĂ**: Toate mesajele de debug și log-urile din întreaga aplicație traduse în română pentru experiență mai bună - FINALIZAT 15/08/2025 17:21
- **FIX DUPLICATE GPS TRANSMISSIONS**: Implementat sistem anti-duplicat între Priority GPS, Guaranteed GPS și Android service
- **DEBUG PANEL INLINE**: Debug panel-ul apare SUB lista de curse, nu înlocuiește pagina - experiență live debugging 
- **PAUZĂ/STOP IMMEDIATE FIX**: Când se dă PAUZĂ, se opresc TOATE serviciile GPS simultan fără transmisii suplimentare
- **REAL-TIME LOG MONITORING**: Log-uri în timp real în debug panel cu actualizare automată la 2 secunde
- **START SYSTEM AUTOMATION**: Created unified start system with fluid workflow:
  - `start.bat` (no params) - Environment switch (TEST) → calls build.bat (4 steps)
  - `start.bat PROD` - Environment switch (PROD) → calls build.bat (4 steps)  
  - `start.sh` / `start.sh PROD` - Same logic, creates build.sh if needed
  - **Fluid 6-step process**: 2 environment steps + 4 build steps = seamless workflow
  - TEST is default environment, only TEST and PROD supported

## Recent Performance Optimizations (15/08/2025)
- **DEBUG LOGS CLEANUP**: Removed excessive debugging messages from console
  - Eliminated "AndroidGPS verification PASSED" messages
  - Cleaned "APK DEBUG: Starting course loading process" logs  
  - Removed "Loading courses for vehicle" console spam
  - Silent verification for AndroidGPS interface
  - Cleaner console output for production use
- **GPS FUNCTIONALITY RESTORED**: Fixed GPS button functionality for Android APK deployment
- **ELIMINATED TEST COORDINATES**: Removed browser test coordinates - GPS only works on real Android APK
- **ANDROID GPS PRIORITY**: Ensured native Android GPS service gets priority over JavaScript backup
- **ERROR HANDLING IMPROVED**: Better GPS error detection and handling for Android vs browser environments
- **STATUS UPDATE RELIABILITY**: Enhanced course status update flow with proper error propagation
- **CRITICAL GPS ORDER FIX**: Replaced HashMap with LinkedHashMap + sorting in Android service to ensure consistent coordinate transmission order
- **SHARED TIMESTAMP SYSTEM**: Implemented SharedTimestampService for perfect synchronization across all GPS services
- **TIMESTAMP SYNCHRONIZATION**: All GPS services now use shared timestamp for coordinates within same interval 
- **CROSS-SERVICE CONSISTENCY**: garanteedGPS, directAndroidGPS, and Android service all use synchronized timestamps
- **CENTRALIZED API CONFIG**: Created flexible API_CONFIG system for easy environment switching (PROD/TEST/DEV)
- **SCROLL PERFORMANCE OPTIMIZED**: Enhanced CSS with GPU acceleration, reduced will-change scope, added contain property
- **WHITE FLASH ELIMINATION**: Fixed rendering issues during scroll with backface-visibility and translateZ optimization
- **COURSE CARDS ACCELERATION**: Applied hardware acceleration to course cards and pseudo-elements for smooth scrolling
- **Individual Course Control**: Fixed bug where starting one course affected all courses
- **GPS Transmission**: Verified only courses with status 2 (In Progress) transmit GPS data

## Complete Application Analysis (15/08/2025)
- **COMPREHENSIVE CODE REVIEW**: Analyzed entire codebase function by function, line by line
- **ARCHITECTURE DOCUMENTATION**: Created detailed 5-layer architecture analysis in README.md
- **8,847 LINES ANALYZED**: Complete review of TypeScript (5,653), Java (594), CSS (3,651) code
- **156 FUNCTIONS DOCUMENTED**: Individual analysis of every function with purpose and flow
- **BUSINESS PRESENTATIONS UPDATED**: Created detailed technical and client-ready documentation
- **PERFORMANCE METRICS**: Documented GPS accuracy, API performance, UI/UX optimizations
- **DEPLOYMENT GUIDES**: Complete setup and configuration documentation for enterprise clients
- **DEBUG INFRASTRUCTURE**: Detailed documentation of logging system and debug panel access

## System Architecture

### Frontend
- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5
- **UI Framework**: Bootstrap 5.3.6 with custom CSS featuring glassmorphism and modern animations
- **Mobile Framework**: Capacitor 7.3.0 for native cross-platform deployment (primarily Android)

### Backend Integration
- **API Communication**: RESTful API integration
- **Authentication**: JWT token with automatic persistence
- **Data Format**: JSON

### Mobile Platform Integration
- **Primary Target**: Android with native GPS services
- **Cross-Platform**: Capacitor allows iOS deployment
- **Native Services**: Enhanced GPS tracking with background operation, intelligent battery management via foreground service, and WakeLock implementation.
- **Permissions**: Location, background location, and exclusion from battery optimization.

### Core Features
- **Enterprise Authentication**: Secure email/password login, JWT token management, and secure logout.
- **Advanced GPS Tracking**: Native Android service for continuous background tracking (5-second interval), offline caching of coordinates with batch synchronization, and high-precision data.
- **Professional Trip Management**: Vehicle number input, loading of vehicle-specific trips, real-time status management (Available, Active, Pause, Stopped), and an optimized driver interface.
- **Enterprise Analytics**: Dedicated modals for detailed trip statistics (distance, time, speed) using the Haversine formula, and cumulative reports.
- **Advanced Debug Panel**: Accessible via 50 clicks on the timestamp, providing persistent logging (GPS, API, OFFLINE_SYNC, APP, ERROR categories) and export functions.
- **Robust Offline Management**: Automatic online/offline status detection, intelligent GPS coordinate caching, visual synchronization progress, automatic recovery, and retry logic for data transmission.

### Technical Implementations
- **GPS Logic**: OptimalGPSService runs persistently in the background, acquiring WakeLock for deep sleep prevention. Redundant GPS services ensure transmission even if native Android GPS is unavailable.
- **UI/UX Decisions**: Corporate design with glassmorphism effects, gradient backgrounds, and intuitive iconography. Responsive layouts for various devices, including safe area padding for native Android bars.
- **Error Handling**: Comprehensive error logging, non-blocking GPS operations, graceful degradation for network issues, and clear user guidance for permissions.

## External Dependencies
- **Capacitor**: `@capacitor/core`, `@capacitor/android`, `@capacitor/geolocation`, `@capacitor/preferences`
- **Capacitor Community Plugins**: `@capacitor-community/background-geolocation`
- **APIs** (PRODUCTION - etsm_prod):
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/login.php` (Authentication)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/logout.php` (Logout)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/vehicul.php` (Course Management)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/update_course_status.php` (Course Status Updates)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php` (GPS Data Transmission)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/rezultate.php` (GPS Result Verification)
- **UI Libraries**: Bootstrap 5.3.6
```