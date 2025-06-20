# iTrack GPS Application

## Overview

iTrack is a professional GPS tracking application designed for drivers and fleet management, specifically built for Romanian transport companies. The application enables real-time vehicle tracking, course management, and provides offline capabilities for reliable data collection even without internet connectivity.

## System Architecture

### Frontend Architecture
- **Framework**: React 19.1.0 with TypeScript for type safety and modern component development
- **Build Tool**: Vite 6.3.5 for fast development and optimized production builds
- **UI Framework**: Bootstrap 5.3.6 with custom CSS featuring glassmorphism and modern animations
- **Mobile Framework**: Capacitor 7.3.0 for cross-platform native mobile deployment
- **Styling**: Modern CSS with backdrop-filter, conic-gradient, and 3D animations

### Backend Architecture
- **API Communication**: RESTful API integration with external transport management system
- **Base URL**: `https://www.euscagency.com/etsm3/platforme/transport/apk`
- **Authentication**: JWT token-based authentication with persistent storage
- **Data Format**: JSON for all API communications

### Mobile Platform Integration
- **Primary Target**: Android platform with native GPS services
- **Cross-Platform**: Capacitor enables iOS deployment capability
- **Native Services**: Enhanced GPS tracking with background operation support
- **Permissions**: Location, background location, and battery optimization exemption

## Key Components

### Authentication System
- Email/password login with comprehensive validation
- JWT token management with automatic persistence
- Session management with auto-login capability
- Secure logout with complete data cleanup
- Admin panel access for development and debugging

### GPS Tracking Service
- **Enhanced GPS Service**: Native Android background service for continuous tracking
- **Offline Capability**: Automatic coordinate caching when internet is unavailable
- **Batch Synchronization**: Automatic sync of up to 50 cached coordinates when online
- **High Precision**: 5-second intervals with 8-decimal coordinate precision
- **Battery Optimization**: Smart power management with foreground service
- **Single Source GPS**: Only Android native service transmits (WebView GPS disabled to prevent duplicates)

### Course Management
- Vehicle-specific course loading with validation
- Real-time course status management (Available, In Progress, Paused, Stopped)
- Course analytics with distance, time, and speed calculations
- Professional driver interface optimized for truck operations

### Data Storage
- **Local Storage**: Capacitor Preferences for authentication tokens
- **Offline GPS**: SharedPreferences for coordinate caching
- **Course Analytics**: Local statistics storage with real-time updates

## Data Flow

1. **Authentication Flow**:
   - User login → JWT token generation → Token storage → Auto-login setup
   - Logout → Server notification → Local data cleanup → Return to login

2. **GPS Tracking Flow**:
   - Course start → GPS service activation → Continuous coordinate collection → Real-time transmission
   - Offline mode → Local coordinate storage → Automatic sync when online

3. **Course Management Flow**:
   - Vehicle number input → Course loading → Status management → Analytics tracking → Completion

## External Dependencies

### Core Dependencies
- **@capacitor/core**: Mobile platform abstraction layer
- **@capacitor/android**: Android-specific implementations
- **@capacitor/geolocation**: Native GPS location services
- **@capacitor/preferences**: Secure local data storage
- **@capacitor-community/background-geolocation**: Enhanced background tracking

### Development Dependencies
- **TypeScript**: Type safety and development tooling
- **Vite**: Modern build system with hot reload
- **Bootstrap**: UI component framework
- **Font Awesome**: Icon library for professional interface

### Android Native Dependencies
- **LocationManager**: Core Android location services
- **TelephonyManager**: GSM signal strength detection
- **NotificationManager**: Foreground service notifications
- **PowerManager**: Battery optimization management

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server on port 5555
- **Live Reload**: Hot module replacement for rapid development
- **TypeScript Compilation**: Real-time type checking and error detection

### Android Build Process
1. **Web Build**: `npm run build` → Vite optimized production build
2. **Capacitor Sync**: `npx cap sync android` → Copy web assets to Android project
3. **Android Studio**: `npx cap open android` → Native build and testing
4. **APK Generation**: Gradle build system with ProGuard optimization

### Production Deployment
- **Target SDK**: API Level 35 (Android 15) for latest features
- **Minimum SDK**: API Level 23 (Android 6.0) for broad compatibility
- **App Bundle**: Optimized AAB format for Play Store distribution
- **Permissions**: Location, background location, and network access

## Changelog

- June 20, 2025: Versiunea 1807.99 completă
  - Design hibrid: input vehicul elegant (ca login), listă curse funcțională
  - Admin access mutat la timestamp (20 click-uri) cu modal elegant fără delogare
  - GPS transmission optimizat la exact 5 secunde (eliminat WebView GPS)
  - Texte în română: TOTAL CURSE, ACTIV, PAUZĂ, DISPONIBIL
  - Bottom navigation cu safe-area pentru telefoane
  - Versiune Android actualizată la 1807.99
  - UI îmbunătățiri: bara de sus ascunsă, header centrat, iconițe expand/collapse
  - Placeholder simplificat pentru numărul de înmatriculare
- June 20, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.