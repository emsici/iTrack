# GPS Tracker Mobile Application

## Overview
This is a React-based GPS tracking application built with Capacitor for cross-platform mobile deployment. The application is designed to track vehicle locations in real-time and manage transport courses. It features user authentication, vehicle management, and GPS data transmission to a remote server.

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
- Real-time location tracking using Capacitor Geolocation
- Background location updates support
- Configurable tracking intervals
- GPS data buffering and transmission
- Support for both native and web environments

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
- **App ID**: com.gps.tracker
- **App Name**: GPS Tracker
- **Target SDK**: Android API level based on Capacitor requirements
- **Permissions**: Location access, network access, background processing

### Environment Support
- **Native Android**: Full feature support with native GPS and storage
- **Web Browser**: Development and testing mode with fallback implementations
- **Cross-platform**: Single codebase for multiple deployment targets

## Changelog
- June 14, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.