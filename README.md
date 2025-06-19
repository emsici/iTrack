# iTrack - Professional Driver GPS Tracking Application

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-7.3.0-green.svg)](https://capacitorjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue.svg)](https://www.typescriptlang.org/)
[![Android](https://img.shields.io/badge/Platform-Android-brightgreen.svg)](https://developer.android.com/)

## Overview

iTrack is a professional React-based GPS tracking application specifically designed for drivers to track their active transport courses in real-time. Built with Capacitor for native Android deployment, the application features secure authentication, vehicle course management, and continuous background GPS data transmission to the ETSM3 transport management server.

### Key Features

- 🚛 **Vehicle Course Management** - Load and manage transport courses by vehicle number
- 📍 **Real-time GPS Tracking** - Continuous background location tracking even when phone is locked
- 🔐 **Secure Authentication** - Token-based authentication with persistent sessions
- 📱 **Native Android Integration** - Full native Android service for background GPS operation
- 🔋 **Battery Optimized** - Efficient GPS tracking with wake locks and foreground services
- 🌐 **Server Integration** - Real-time data transmission to ETSM3 transport management system

## Technology Stack

### Frontend
- **React 19.1.0** with TypeScript for type-safe development
- **Vite 6.3.5** for fast development and optimized builds
- **Bootstrap 5.3.6** for responsive UI design
- **CSS Modules** with glassmorphism design effects

### Mobile Platform
- **Capacitor 7.3.0** for cross-platform native mobile deployment
- **Native Android Services** for true background GPS tracking
- **Android Foreground Services** for persistent location monitoring

### Backend Integration
- **RESTful API** integration with ETSM3 transport management system
- **Bearer Token Authentication** for secure API communication
- **JSON Data Format** for efficient client-server communication

## Architecture

### GPS Tracking System
The application uses a simplified, robust GPS architecture:

- **SimpleGPSService.java** - Native Android foreground service for background GPS tracking
- **SimpleGPSPlugin.java** - Capacitor bridge for JavaScript-Android communication
- **nativeGPS.ts** - TypeScript interface for GPS service control

### Authentication Flow
1. User credentials sent to authentication API
2. Server returns Bearer token
3. Token stored locally using Capacitor Preferences
4. Token used for all subsequent API requests
5. Secure logout with server notification

### Course Management
1. User enters vehicle identification number
2. System fetches available courses from server
3. User can start, pause, or stop individual courses
4. GPS tracking automatically begins for active courses
5. Real-time status updates sent to server

## Installation & Development

### Prerequisites
- Node.js 20 or higher
- Android Studio with Android SDK
- Java/OpenJDK for Android compilation

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd itrack

# Install dependencies
npm install

# Start development server
npm run dev
```

### Android Build
```bash
# Build web application
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android

# Or build APK directly
./build-android.sh
```

## Configuration

### Environment Variables
The application connects to the ETSM3 transport management system:
- Base URL: `https://www.euscagency.com/etsm3/platforme/transport/apk`
- Authentication: Bearer token-based
- GPS Endpoint: `gps.php`
- Login Endpoint: `login.php`

### Android Permissions
The application requires the following permissions:
- `ACCESS_FINE_LOCATION` - For precise GPS coordinates
- `ACCESS_BACKGROUND_LOCATION` - For tracking when app is minimized
- `FOREGROUND_SERVICE` - For persistent background operation
- `WAKE_LOCK` - To prevent device sleep during tracking
- `INTERNET` - For server communication

## Usage

### Authentication
1. Launch the application
2. Enter email and password credentials
3. System validates and stores authentication token
4. Automatic login on subsequent app launches

### Starting GPS Tracking
1. Enter vehicle identification number
2. Load available transport courses
3. Select course and press "Start" button
4. GPS tracking begins automatically in background
5. Coordinates transmitted every 60 seconds to server

### Course Status Management
- **Available (1)** - Course ready to start
- **Active (2)** - GPS tracking in progress
- **Paused (3)** - Temporarily suspended
- **Finished (4)** - Course completed

### Logout
1. Press "Ieșire" (Exit) button in footer
2. System sends logout notification to server
3. Local authentication token cleared
4. User redirected to login screen

## GPS Data Transmission

The application transmits comprehensive GPS data:

```json
{
  "lat": 44.426765,
  "lng": 26.102538,
  "timestamp": "2025-06-19 10:30:00",
  "viteza": 45,
  "directie": 180,
  "altitudine": 85,
  "baterie": 87,
  "numar_inmatriculare": "B123ABC",
  "uit": "UIT123456",
  "status": "2",
  "hdop": "5",
  "gsm_signal": "75"
}
```

## Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npx cap sync android
```

### Android APK
```bash
# Full build (recommended)
./build-android.sh

# Quick development build
./quick-build.bat
```

## Project Structure

```
itrack/
├── src/
│   ├── components/         # React components
│   ├── services/          # API and GPS services
│   ├── types/             # TypeScript type definitions
│   └── App.tsx            # Main application component
├── android/
│   └── app/src/main/java/com/euscagency/itrack/
│       ├── SimpleGPSService.java    # Native GPS service
│       ├── SimpleGPSPlugin.java     # Capacitor bridge
│       └── MainActivity.java        # Main Android activity
├── public/                # Static assets
└── build/                 # Production build output
```

## API Integration

### Authentication
```
POST /login.php
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "password"
}
```

### Vehicle Courses
```
GET /courses.php?vehicle=B123ABC
Authorization: Bearer <token>
```

### GPS Data
```
POST /gps.php
Authorization: Bearer <token>
Content-Type: application/json

{GPS_DATA_OBJECT}
```

### Logout
```
POST /login.php
Authorization: Bearer <token>
Content-Type: application/json

{
  "iesire": 1
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is proprietary software developed for EUSC Agency transport management.

## Support

For technical support and questions, please contact the development team.

---

**Version:** 1807.99  
**Package:** com.euscagency.itrack  
**Platform:** Android  
**Minimum SDK:** API 24 (Android 7.0)