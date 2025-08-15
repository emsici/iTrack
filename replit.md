# iTrack GPS Application

## Overview
iTrack is a professional enterprise GPS monitoring application for fleet management in Romania. It provides real-time GPS tracking, trip management, robust offline capabilities, and comprehensive analytics to optimize transport operations. The project aims to offer a reliable and efficient solution for vehicle tracking, supporting operational excellence and market potential in the transport industry.

## User Preferences
Preferred communication style: Simple, everyday language.
Date format preference: DD-MM-YYYY (zi-luna-an) for Romanian locale.
Performance optimization: Universal optimization for ALL Android phones (not device-specific).
Code comments: All comments must be in Romanian language.
Backup files: Remove unnecessary backup files (OptimalGPSService_backup.java removed).
UI Performance: Remove heavy animations (rainbow flows, floating animations, gradient shifts, pulse effects) that may affect performance on Android devices.

## System Architecture

### Frontend
- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5
- **UI Framework**: Bootstrap 5.3.6 with custom CSS featuring glassmorphism and modern animations
- **Mobile Framework**: Capacitor 7.3.0 for native cross-platform deployment (primarily Android)
- **UI/UX Decisions**: Corporate design with glassmorphism effects, gradient backgrounds, and intuitive iconography. Responsive layouts for various devices, including safe area padding for native Android bars. Zero lag scroll optimization and removal of white flashes during scrolling.

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
- **Advanced GPS Tracking**: Native Android service for continuous background tracking (5-second interval), offline caching of coordinates with batch synchronization, and high-precision data. Offline system is fully functional, supporting automatic synchronization on network return with visual progress.
- **Professional Trip Management**: Vehicle number input, loading of vehicle-specific trips, real-time status management (Available, Active, Pause, Stopped), and an optimized driver interface.
- **Enterprise Analytics**: Dedicated modals for detailed trip statistics (distance, time, speed) using the Haversine formula, and cumulative reports.
- **Advanced Debug Panel**: Accessible via 50 clicks on the timestamp, providing persistent logging (GPS, API, OFFLINE_SYNC, APP, ERROR categories) and export functions. Displays logs in real-time.
- **Robust Offline Management**: Automatic online/offline status detection, intelligent GPS coordinate caching, visual synchronization progress, automatic recovery, and retry logic for data transmission. Batch synchronization of 50 coordinates with chronological sorting.
- **Centralized API Configuration**: Flexible API_CONFIG system for easy environment switching (PROD/TEST/DEV).
- **Simplified GPS Architecture**: DirectAndroidGPS → GuaranteedGPS → Android Service for streamlined operation.

### Technical Implementations
- **GPS Logic**: OptimalGPSService runs persistently in the background, acquiring WakeLock for deep sleep prevention. Redundant GPS services ensure transmission even if native Android GPS is unavailable. Ensures consistent coordinate transmission order via LinkedHashMap + sorting. All GPS services use a shared timestamp for consistency.
- **Error Handling**: Comprehensive error logging, non-blocking GPS operations, graceful degradation for network issues, and clear user guidance for permissions.
- **Automated Build Process**: Unified `start.bat` (and `start.sh`) for environment switching (TEST/PROD) and build process.

## External Dependencies
- **Capacitor**: `@capacitor/core`, `@capacitor/android`, `@capacitor/geolocation`, `@capacitor/preferences`
- **Capacitor Community Plugins**: `@capacitor-community/background-geolocation`
- **APIs** (PROD - etsm_prod):
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/login.php` (Authentication)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/logout.php` (Logout)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/vehicul.php` (Course Management)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php` (GPS Data Transmission - TOATE statusurile: 2, 3, 4)
    - `https://www.euscagency.com/etsm_prod/platforme/transport/apk/rezultate.php` (GPS Result Verification)
- **UI Libraries**: Bootstrap 5.3.6