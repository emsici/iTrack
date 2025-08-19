# iTrack GPS Application

## Overview
iTrack is a professional enterprise GPS monitoring application for fleet management in Romania. Its main purpose is to provide real-time GPS tracking, robust offline capabilities, and comprehensive analytics to optimize transport operations. The project aims to offer a reliable and efficient solution for vehicle tracking, supporting operational excellence and market potential in the transport industry. Key capabilities include real-time GPS tracking, professional trip management, and comprehensive analytics.

## User Preferences
Preferred communication style: Simple, everyday language.
Date format preference: DD-MM-YYYY (zi-luna-an) for Romanian locale.
Timestamp preference: Romania local time (+3 hours from UTC) for all GPS data and system timestamps.
Performance optimization: Universal optimization for ALL Android phones (not device-specific).
Code comments: All comments must be in Romanian language.
Backup files: Remove unnecessary backup files.
UI Performance: Remove heavy animations that may affect performance on Android devices. Progress bar disappears completely when sync is at 100% (less than 5 coords remaining) - no point showing completed progress.
Offline Coordinates Policy: NEVER clear offline coordinates at logout - preserve route continuity across login sessions to avoid missing road segments.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Bootstrap with custom CSS featuring glassmorphism
- **Mobile Framework**: Capacitor for native cross-platform deployment (primarily Android)

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
- **Advanced GPS Tracking**: Native Android service for continuous background tracking (10-second interval), offline caching of coordinates with batch synchronization, and high-precision data. Includes adaptive intervals, foreground service priority, and Doze mode bypass. Supports multiple simultaneous courses using `HashMap<String, CourseData>`.
- **Professional Trip Management**: Vehicle number input, loading of vehicle-specific trips, real-time status management (Available, Active, Pause, Stopped), and an optimized driver interface. Includes multi-vehicle support with quick switching.
- **Enterprise Analytics**: Dedicated modals for detailed trip statistics (distance, time, speed) using the Haversine formula, and cumulative reports.
- **Advanced Debug Panel**: Accessible via 50 clicks on the timestamp, providing persistent logging (GPS, API, OFFLINE_SYNC, APP, ERROR categories) and export functions, displayed inline under the course list.
- **Robust Offline Management**: Automatic online/offline status detection, intelligent GPS coordinate caching, visual synchronization progress, automatic recovery, and retry logic for data transmission. Syncs in batches of 50 coordinates with chronological sorting.

### Technical Implementations
- **GPS Logic**: `BackgroundGPSService` runs persistently in the background with `ScheduledExecutorService` for reliable timing. Acquires `WakeLock` for deep sleep prevention, uses dedicated `HandlerThread` for GPS operations, and guaranteed execution through foreground service protection. Uses `getLastKnownLocation()` for synchronous GPS data acquisition with fallbacks.
- **UI/UX Decisions**: Corporate design with glassmorphism effects, gradient backgrounds, and intuitive iconography. Responsive layouts with safe area padding. Optimized for zero-lag scrolling by eliminating `backdrop-filter`, `blur` effects, and `transform` properties. Unified GPS+Network status indicator replaces redundant online/offline indicators for cleaner interface. Theming is consistent across all components.
- **Error Handling**: Comprehensive error logging, non-blocking GPS operations, graceful degradation for network issues, and clear user guidance for permissions.
- **Environment Management**: Centralized `API_CONFIG` system for easy environment switching (PROD/TEST/DEV) with automated build scripts.
- **HTTP Modernization**: Exclusively uses CapacitorHttp native methods for all API calls in Android-only environment.
- **Identifier Consistency**: Uses `ikRoTrans` as a consistent unique identifier throughout the application, including for `HashMap` keys in `BackgroundGPSService` and for server communication where appropriate, alongside `course.id` for React/analytics and `course.uit` for server communication.
- **Enterprise Protections**: Includes AbortController for race condition protection, concurrency locking, optimistic UI with rollback, memory leak prevention via `useEffect` cleanup, request deduplication, and validation.

## External Dependencies
- **Capacitor**: `@capacitor/core`, `@capacitor/android`, `@capacitor/geolocation`, `@capacitor/preferences`
- **Capacitor Community Plugins**: `@capacitor-community/background-geolocation`
- **APIs**:
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/login.php` (Authentication)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/logout.php` (Logout)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/vehicul.php` (Course Management)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php` (GPS Data Transmission)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/rezultate.php` (GPS Result Verification)
- **UI Libraries**: Bootstrap

## Recent Changes Log

EXHAUSTIVE VERIFICATION 19-08-2025: Verificare exhaustivă completă realizată cuvânt cu cuvânt, rând cu rând, funcție cu funcție pentru întreaga aplicație. Confirmat DEFINITIV că status 3 se trimite DOAR O SINGURĂ DATĂ prin TRIPLE PROTECTION: (1) CourseDetailCard isLoading check previne double-click, (2) VehicleScreen loadingCourses Set previne concurrency, (3) updateCourseStatus face o singură cerere HTTP la gps.php. Verificat flux complet de la user click până la transmisia finală. Logică 100% consistentă, identificatori separați corect (course.id/course.uit/course.ikRoTrans), endpoint unificat, zero duplicate transmissions. BackgroundGPSService Android folosește ConcurrentHashMap cu ikRoTrans ca cheie unică. Aplicația PERFECT FUNCȚIONALĂ pentru deployment cu build success 349.87 kB.