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
UI Performance: Remove heavy animations that may affect performance on Android devices. Progress bar disappears completely when sync is at 100% (less than 5 coords remaining) - no point showing completed progress.
Offline Coordinates Policy: NEVER clear offline coordinates at logout - preserve route continuity across login sessions to avoid missing road segments.
Code Cleanup: Comprehensive cleanup completed - removed unused files/services and functions.
GPS Background Fix: Restored direct Android GPS calls for background service with hybrid browser backup system to ensure GPS continues working when phone is locked/app minimized.
Real Device Data: Implemented dynamic battery level detection and real network type detection instead of static values, using Android native APIs, Capacitor Device/Network plugins, and browser APIs with intelligent fallbacks.
UI Optimization: Eliminated redundant status indicators - unified GPS+Internet status replaces separate "Online/Offline" indicator for cleaner interface.
PAUSE GPS Fix: GPS transmission is now correctly blocked for paused courses (status 3) - only ACTIVE courses (status 2) can transmit GPS data.
Vehicle Dropdown Redesign: Compact dropdown with stored vehicle numbers, remove function, and "Add New" button leading to dedicated input page for better UX.

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
- **Advanced GPS Tracking**: Native Android service for continuous background tracking (10-second interval), offline caching of coordinates with batch synchronization, and high-precision data. Includes adaptive intervals, foreground service priority, and Doze mode bypass. GPS continues for both active and paused courses. Supports multiple simultaneous courses using `HashMap<String, CourseData>`.
- **Professional Trip Management**: Vehicle number input, loading of vehicle-specific trips, real-time status management (Available, Active, Pause, Stopped), and an optimized driver interface. Includes multi-vehicle support with quick switching, history management, and quick switch UI.
- **Enterprise Analytics**: Dedicated modals for detailed trip statistics (distance, time, speed) using the Haversine formula, and cumulative reports.
- **Advanced Debug Panel**: Accessible via 50 clicks on the timestamp, providing persistent logging (GPS, API, OFFLINE_SYNC, APP, ERROR categories) and export functions.
- **Robust Offline Management**: Automatic online/offline status detection, intelligent GPS coordinate caching, visual synchronization progress, automatic recovery, and retry logic for data transmission. Syncs in batches of 50 coordinates with chronological sorting.

### Technical Implementations
- **GPS Logic**: `BackgroundGPSService` runs persistently in the background with `ScheduledExecutorService` for reliable timing. Acquires `WakeLock` for deep sleep prevention, uses dedicated `HandlerThread` for GPS operations, and guaranteed execution through foreground service protection with HIGH priority notification. Uses `getLastKnownLocation()` for synchronous GPS data acquisition with fallbacks.
- **UI/UX Decisions**: Corporate design with glassmorphism effects, gradient backgrounds, and intuitive iconography. Responsive layouts with safe area padding. Optimized for zero-lag scrolling by eliminating `backdrop-filter`, `blur` effects, and `transform` properties. Unified GPS+Network status indicator (SimpleGPSIndicator) replaces redundant online/offline indicators for cleaner interface.
- **Error Handling**: Comprehensive error logging, non-blocking GPS operations, graceful degradation for network issues, and clear user guidance for permissions.
- **Environment Management**: Centralized `API_CONFIG` system for easy environment switching (PROD/TEST/DEV) with automated build scripts.
- **HTTP Modernization**: Exclusively uses CapacitorHttp native methods for all API calls in Android-only environment.
- **Identifier Consistency**: Uses `ikRoTrans` as a consistent unique identifier throughout the application, including for `HashMap` keys in `BackgroundGPSService` and for server communication where appropriate.

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
```