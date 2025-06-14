# iTrack - Professional Driver Tracking Application

## Overview
This is a professional React-based GPS tracking application built with Capacitor for cross-platform mobile deployment. The application is specifically designed for drivers to track their active transport courses in real-time. It features secure authentication, vehicle course management, and continuous GPS data transmission to the ETSM3 transport management server.

## System Architecture

### Frontend Architecture
- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5 for fast development and optimized builds
- **UI Framework**: Bootstrap 5.3.6 for responsive design
- **Icons**: Font Awesome 6.4.0 for consistent iconography
- **Styling**: CSS modules with custom styling for platform-specific appearance

### Mobile Platform Integration
- **Cross-Platform Framework**: Capacitor 7.3.0 for native mobile app deployment
- **Target Platforms**: Android (primary), with iOS capability
- **Native Plugins**: 
  - Geolocation for GPS tracking
  - Device info for hardware identification
  - Preferences for local data storage

### Backend Integration
- **API Communication**: RESTful API integration with external transport management system
- **Base URL**: `https://www.euscagency.com/etsm3/platforme/transport/apk`
- **Authentication**: Token-based authentication system
- **Data Format**: JSON for API communication

## Key Components

### Authentication System
- Login screen with email/password authentication
- Token-based session management
- Secure token storage using Capacitor Preferences
- Automatic session persistence across app restarts

### GPS Tracking Service
- Native Android location tracking with persistent background operation
- Continues tracking even when phone is locked or app is minimized
- Optimized for battery efficiency with 1-minute interval updates
- Automatic battery optimization exemption requests
- watchPosition implementation for continuous location monitoring
- Robust error handling and recovery mechanisms

### Course Management
- Vehicle-specific course loading
- Course status management (Available, In Progress, Paused, Stopped)
- Real-time course status updates
- Integration with GPS tracking for active courses

### User Interface Components
- **LoginScreen**: Handles user authentication with form validation
- **VehicleScreen**: Main dashboard for vehicle and course management
- **CourseCard**: Individual course display and control component
- Responsive design for various screen sizes

## Data Flow

### Authentication Flow
1. User enters credentials on login screen
2. Credentials sent to authentication API
3. Server returns authentication token
4. Token stored locally using Capacitor Preferences
5. Token used for subsequent API requests

### GPS Tracking Flow
1. User initiates course tracking
2. GPS service requests location permissions
3. Continuous location monitoring begins
4. GPS data collected with timestamp, coordinates, speed, direction
5. Data transmitted to server at regular intervals
6. Local tracking state managed for multiple concurrent courses

### Course Management Flow
1. User enters vehicle identification number
2. System fetches available courses for vehicle
3. User can start, pause, or stop individual courses
4. Course status changes trigger GPS tracking state updates
5. Real-time status updates reflected in UI

## External Dependencies

### Core Dependencies
- **React ecosystem**: react, react-dom, @types/react, @types/react-dom
- **Capacitor platform**: @capacitor/core, @capacitor/cli, @capacitor/android
- **Capacitor plugins**: @capacitor/geolocation, @capacitor/device, @capacitor/preferences
- **Build tools**: vite, @vitejs/plugin-react, typescript
- **UI libraries**: bootstrap for styling

### API Integration
- External transport management system API
- HTTPS-based communication
- JSON data format
- Token-based authentication

### Development Environment
- Node.js 20 runtime
- Android development tools (Android SDK, Gradle)
- Java/OpenJDK for Android compilation

## Deployment Strategy

### Development Environment
- Vite development server on port 5000
- Hot reload for rapid development
- Web-based testing capability

### Android Build Process
1. Web application built using Vite
2. Capacitor sync to prepare Android project
3. Gradle build system for APK generation
4. Android Studio integration for advanced debugging
5. Signed APK generation for distribution

### Build Configuration
- **App ID**: com.euscagency.iTrack
- **App Name**: iTrack
- **Target SDK**: Android API level based on Capacitor requirements
- **Permissions**: Location access, network access, background processing

### Environment Support
- **Native Android**: Full feature support with native GPS and storage
- **Web Browser**: Development and testing mode with fallback implementations
- **Cross-platform**: Single codebase for multiple deployment targets

## Changelog
- June 14, 2025. Initial setup
- June 14, 2025. Fixed GPS background tracking with status reporting (3=pause, 4=finish)
- June 14, 2025. Improved course button logic: Status 1 shows only Start, Status 2 shows Pause/Finish, Status 3 shows only Resume
- June 14, 2025. Added quick vehicle switch button in header for driver convenience
- June 14, 2025. Implemented modern blue design matching provided mockup with header, vehicle info card, and course list
- June 14, 2025. Updated login screen to match modern design with consistent blue header and styling
- June 14, 2025. Created Windows build scripts: build-android.bat (full build) and quick-build.bat (rapid development)
- June 14, 2025. Removed all blue header bars completely per user request for cleaner mobile design
- June 14, 2025. Replaced with fixed footer navigation containing app branding and essential actions
- June 14, 2025. Enhanced GPS background tracking with improved Android wake locks and shorter intervals (30s)
- June 14, 2025. Implemented robust background location tracking to work when phone is locked
- June 14, 2025. Created native Android foreground service (GPSForegroundService.java) for true background GPS tracking
- June 14, 2025. Implemented OkHttp-based GPS data transmission directly from Android service to bypass JavaScript limitations
- June 14, 2025. Added native GPS plugin (GPSTrackingPlugin.java) with Capacitor bridge for seamless integration
- June 14, 2025. GPS tracking now works independently when phone is locked or user switches to other apps like Facebook
- June 14, 2025. Implemented real GSM signal strength reading from Android TelephonyManager (0-100 scale)
- June 14, 2025. Added persistent authentication with automatic token storage and logout API integration
- June 14, 2025. Fixed session persistence - app no longer logs out when minimized or backgrounded
- June 14, 2025. Fixed GPS bearing calculation using mathematical formula between coordinates when GPS bearing unavailable
- June 14, 2025. Prevented GPS coordinate duplication by prioritizing native Android service over JavaScript tracking
- June 14, 2025. Improved CSS layout spacing to eliminate footer/header element overlapping issues
- June 14, 2025. Fixed UIT transmission to use real course UIT instead of random generated values
- June 14, 2025. Eliminated GPS coordinate duplication by forcing Android to use only native service, never JavaScript
- June 14, 2025. GPS tracking now sends single coordinate stream with proper UIT from course data
- June 14, 2025. Created SimpleGPSService to replace complex system - minimalist approach for maximum reliability
- June 14, 2025. Single Timer-based transmission system with wake lock for guaranteed background operation
- June 14, 2025. Implemented @capacitor-community/background-geolocation for true background GPS tracking
- June 14, 2025. Fixed loading freeze issue - GPS starts in background without blocking UI
- June 14, 2025. Cleaned up architecture - removed duplicate GPS services, using only GPSForegroundService + community plugin
- June 14, 2025. Implemented modern professional corporate design with glassmorphism effects and responsive layout
- June 14, 2025. Added interactive elements, hover animations, and professional branding for corporate environment
- June 14, 2025. Cleaned GPS architecture - removed duplicate services (SimpleGPSService, backgroundGPS.ts, simpleGPS.ts)
- June 14, 2025. Reconstituted minimal GPS architecture: GPSForegroundService.java + GPSTrackingPlugin.java + nativeGPS.ts
- June 14, 2025. GPS background tracking works with native Android service through Capacitor bridge
- June 14, 2025. Removed AlarmManager dependency - GPS works with Timer/Thread backup systems for better reliability
- June 14, 2025. Fixed GPS transmission frequency - eliminated redundant backup systems causing per-second transmission
- June 14, 2025. GPS now sends coordinates exactly once per minute (60 seconds) with status "2" instead of "active"
- June 14, 2025. Background tracking verified working when phone locked/app minimized using single optimized system
- June 14, 2025. Implemented automatic permission requests - app directly asks for background location and battery optimization
- June 14, 2025. Fixed design consistency - all screens now match login's modern professional appearance
- June 14, 2025. GPS background permissions requested automatically when starting tracking, no manual user guidance needed
- June 14, 2025. Fixed Android scheduleAtFixedRate warning - replaced with scheduleWithFixedDelay for stable background GPS transmission
- June 14, 2025. Added mobile safe area support to prevent UI overlap with phone status bar and navigation bar
- June 14, 2025. Enhanced GPS tracking with explicit permission requests and detailed logging for debugging coordinate transmission
- June 14, 2025. Improved viewport configuration with viewport-fit=cover for better mobile display compatibility
- June 14, 2025. CRITICAL FIX: Restored GPSForegroundService to working version that successfully transmitted GPS in background
- June 14, 2025. Added automatic ACCESS_BACKGROUND_LOCATION permission request when starting GPS tracking
- June 14, 2025. GPS confirmed working: Status "2", 60-second intervals, background transmission when phone locked
- June 14, 2025. Implemented correct GPS status logic: Status 2=active (sends coordinates), 3=pause (stops coordinates), 4=stop (final status)
- June 14, 2025. GPS transmits coordinates continuously ONLY when status is 2 (active), pauses transmission for status 3/4
- June 14, 2025. Added pause/resume/stop methods in native Android service with proper status management
- June 14, 2025. Implemented multiple course tracking - GPS handles multiple simultaneous courses with individual status management
- June 14, 2025. Enhanced background location permission request - always opens settings for "Allow all the time" selection
- June 14, 2025. GPS service tracks multiple vehicles/courses simultaneously, coordinates sent per active course every 60 seconds

## User Preferences

Preferred communication style: Simple, everyday language.