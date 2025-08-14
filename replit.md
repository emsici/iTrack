# iTrack GPS Application

## Overview
iTrack is a professional enterprise GPS monitoring application designed for fleet management, specifically for transport companies in Romania. It provides real-time GPS tracking, trip management, robust offline capabilities, and comprehensive analytics to optimize transport operations. The project aims to offer a reliable and efficient solution for vehicle tracking, supporting business vision for operational excellence and market potential in the transport industry.

## User Preferences
Preferred communication style: Simple, everyday language.
Date format preference: DD-MM-YYYY (zi-luna-an) for Romanian locale.

## Business Materials
- **Business Presentation**: PREZENTARE_BUSINESS_iTrack.md (for technical/business audiences)
- **Client Presentation**: PREZENTARE_CLIENTI_iTrack.md (ready-to-use document for client meetings and proposals)

## Recent Performance Optimizations (14/08/2025)
- **CRITICAL GPS ORDER FIX**: Replaced HashMap with LinkedHashMap + sorting in Android service to ensure consistent coordinate transmission order
- **SHARED TIMESTAMP SYSTEM**: Implemented SharedTimestampService for perfect synchronization across all GPS services
- **TIMESTAMP SYNCHRONIZATION**: All GPS services now use shared timestamp for coordinates within same interval 
- **CROSS-SERVICE CONSISTENCY**: garanteedGPS, directAndroidGPS, and Android service all use synchronized timestamps
- **Scroll Performance**: Optimized intervals (connectivity 30s, GPS monitor 20s, offline check 15s)
- **Hardware Acceleration**: Added CSS GPU rendering with transform3d and will-change  
- **Individual Course Control**: Fixed bug where starting one course affected all courses
- **GPS Transmission**: Verified only courses with status 2 (In Progress) transmit GPS data

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