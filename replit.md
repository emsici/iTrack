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
- June 14, 2025. Optimized GPS transmission frequency to 60-second intervals to reduce server load and battery consumption
- June 14, 2025. Implemented numeric status values (2=active, 3=paused, 4=stopped) for course status transmission
- June 14, 2025. Added minimum distance threshold of 0.5 meters to prevent unnecessary GPS updates when vehicle is stationary
- June 14, 2025. Eliminated GPS coordinate duplication - removed triple backup system, now uses single timer at 60-second intervals
- June 14, 2025. Fixed plugin registration by moving MainActivity to correct package (com.euscagency.itrack)
- June 14, 2025. Implemented strict vehicle validation - users cannot proceed without valid courses for entered vehicle number
- June 14, 2025. Created CourseDetailCard component with expandable dropdown showing complete course information
- June 14, 2025. Added functional Info button that toggles detailed course information display
- June 14, 2025. Course details include: departure/arrival times, locations, UIT code, descriptions, and formatted timestamps
- June 14, 2025. Fixed app crashing issue by replacing complex GPS system with SimpleGPSService
- June 14, 2025. Created SimpleGPSPlugin for reliable Android GPS tracking without crashes
- June 14, 2025. Guaranteed GPS transmission every 60 seconds for each active course UIT separately
- June 14, 2025. Simplified architecture: SimpleGPSService + SimpleGPSPlugin + Timer-based transmission
- June 14, 2025. App now stable with foreground service, wake locks, and persistent notifications
- June 14, 2025. Confirmed complete background GPS tracking: works when phone locked, app minimized, or user in other apps
- June 14, 2025. GPS transmits every 60 seconds to gps.php for each active course UIT separately with full location data
- June 14, 2025. Added automatic GPS permission requests (ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, ACCESS_BACKGROUND_LOCATION)
- June 14, 2025. Implemented clickable vehicle number with visual highlighting instead of separate change button
- June 14, 2025. Fixed Info button functionality and removed hardcoded time display, replaced with transport type
- June 14, 2025. Finalized clean GPS architecture: eliminated GPSAlarmReceiver and all backup systems causing conflicts
- June 14, 2025. GPS tracking now uses only native Android GPSForegroundService + GPSTrackingPlugin + nativeGPS.ts
- June 14, 2025. Removed artificial data (08:00-18:00 times), using only authentic API data (dataTransport, locations, UIT)
- June 14, 2025. Plugin registered in MainActivity.java, no more "plugin not implemented" errors expected
- June 14, 2025. Reintegrated native Android GPS background tracking for real GPS transmission
- June 14, 2025. CourseCard connected to GPSForegroundService for continuous 60-second GPS updates
- June 14, 2025. Background GPS works when phone locked, app minimized, or user in other applications
- June 14, 2025. GPSTrackingPlugin bridges JavaScript to native Android service for true background operation
- June 15, 2025. Fixed GPSTrackingPlugin to send action parameter and status to GPSForegroundService
- June 15, 2025. Corrected package imports in GPSForegroundService (com.euscagency.itrack.MainActivity)
- June 15, 2025. GPS service now uses dynamic courseStatus instead of hardcoded "2" for status transmission
- June 15, 2025. Status values are purely numeric: 1=available, 2=active, 3=paused, 4=finished (no text values)
- June 15, 2025. Created SimpleGPSService.java for minimalist background GPS tracking without complex redundancy systems
- June 15, 2025. Implemented SimpleGPSPlugin.java with Capacitor bridge for clean native Android integration
- June 15, 2025. Eliminated complex multi-level GPS systems causing conflicts - now uses single robust service
- June 15, 2025. Simplified architecture: SimpleGPSService + SimpleGPSPlugin + single timer transmission (60 seconds)
- June 15, 2025. GPS tracking strictly native Android - no JavaScript fallbacks or debugging code
- June 19, 2025. Updated logout function to send {"iesire": 1} to login.php with Bearer token authentication
- June 19, 2025. Modified SimpleGPSService to support multiple concurrent courses with separate GPS transmission
- June 19, 2025. Each active course (UIT) now receives individual GPS coordinates every 60 seconds
- June 19, 2025. Added CourseData structure to track multiple courses with individual vehicle numbers, UITs, and status
- June 19, 2025. Notification displays active course count: "3 curse active - GPS tracking"
- June 19, 2025. Updated all UI components with modern corporate glassmorphism design for professional business appearance
- June 19, 2025. Implemented responsive design with media queries for optimal display on mobile and desktop devices
- June 19, 2025. Enhanced course cards with UIT prominently displayed as primary identifier (most important field)
- June 19, 2025. Structured course information: Header (UIT, ikRoTrans, codDeclarant), Summary (data, traseu), Dropdown (complete details)
- June 19, 2025. Created consistent corporate design across LoginScreen, VehicleScreen, and course listing with Font Awesome icons
- June 19, 2025. Integrated native GPS tracking with course status management - starts/stops GPS based on course actions
- June 19, 2025. Fixed GPS background transmission: Status 2=start GPS, Status 3=pause with GPS update, Status 4=stop GPS completely
- June 19, 2025. GPS coordinates now transmit automatically every 60 seconds for all active courses with individual UITs
- June 19, 2025. Fixed GPS plugin binding error - added fallback mock GPS for web development environment
- June 19, 2025. Enhanced corporate design with dynamic animated backgrounds and interactive glassmorphism effects
- June 19, 2025. Implemented advanced CSS animations: gradient shifts, pulse effects, button press animations, hover transforms
- June 19, 2025. Updated LoginScreen with modern corporatist design: animated logo, gradient backgrounds, interactive buttons
- June 19, 2025. Enhanced VehicleScreen with dynamic course statistics, interactive vehicle selector, and professional styling
- June 19, 2025. Added comprehensive animation system with fade-in effects, bounce animations, and responsive hover states
- June 19, 2025. Enhanced login form visibility with white backgrounds and clear visual hierarchy for business users
- June 19, 2025. Improved password toggle button with distinct styling and hover effects for better UX
- June 19, 2025. Updated branding from "Sistem profesional de urmărire GPS" to "Business Transport Solutions" for corporate appeal
- June 19, 2025. Fixed mobile navigation bar overlap with device buttons using safe-area-inset-bottom padding
- June 19, 2025. Implemented comprehensive responsive design with media queries for mobile, tablet, and desktop
- June 19, 2025. Added safe area support for iOS devices and modern mobile browsers
- June 19, 2025. Enhanced course content padding to prevent overlap with fixed bottom navigation

## User Preferences

Preferred communication style: Simple, everyday language.