# GPS Tracker Application

## Overview

This is a hybrid mobile GPS tracking application built with React, TypeScript, and Capacitor. The app is designed for vehicle tracking, allowing users to monitor and manage transportation courses with real-time GPS data collection. It features a web-based interface that can be packaged as a native Android application.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Bootstrap 5 with custom CSS for responsive design
- **State Management**: React hooks (useState, useEffect) for local state management
- **Mobile Framework**: Capacitor for cross-platform native functionality

### Backend Integration
- **API Communication**: RESTful API integration using CapacitorHttp
- **Authentication**: Bearer token-based authentication with persistent storage
- **External API**: Integration with ETSM3 platform transport API

### Mobile Platform
- **Target Platform**: Android (configured, iOS support available)
- **App ID**: com.gps.tracker
- **Build Output**: dist/ directory for web assets

## Key Components

### Core Components
1. **App.tsx**: Main application coordinator handling authentication state and screen navigation
2. **LoginScreen.tsx**: User authentication interface with email/password validation
3. **VehicleScreen.tsx**: Main dashboard for vehicle course management
4. **CourseCard.tsx**: Individual course management component with status controls

### Services Layer
1. **api.ts**: HTTP client for external API communication
2. **gps.ts**: GPS tracking service with background location updates
3. **storage.ts**: Secure token storage using Capacitor Preferences

### Type Definitions
- **Course**: Transportation course data structure
- **GPSPosition**: Location data with accuracy and movement metrics
- **CourseStatus**: Course state management interface

## Data Flow

### Authentication Flow
1. User enters credentials on LoginScreen
2. Credentials sent to ETSM3 API via login endpoint
3. Bearer token received and stored securely
4. App transitions to VehicleScreen with authenticated state

### GPS Tracking Flow
1. User selects vehicle number and loads available courses
2. Course status changes trigger GPS tracking start/stop
3. Background GPS collection sends periodic location updates
4. Location data transmitted to API with course and vehicle context

### Course Management Flow
1. Vehicle courses fetched from API based on vehicle registration number
2. Course status updates (available/in-progress/paused/stopped) managed locally
3. Status changes synchronized with GPS tracking service

## External Dependencies

### Capacitor Plugins
- **@capacitor/geolocation**: Location services with background updates
- **@capacitor/background-mode**: Background task execution
- **@capacitor/preferences**: Secure local storage
- **@capacitor/http**: Network requests with native performance

### UI Dependencies
- **Bootstrap 5**: CSS framework for responsive design
- **Font Awesome 6**: Icon library for enhanced UI

### API Integration
- **Base URL**: https://www.euscagency.com/etsm3/platforme/transport/apk
- **Endpoints**: 
  - POST /login.php: User authentication
  - Additional course and GPS data endpoints (implementation in progress)

## Deployment Strategy

### Development Environment
- **Platform**: Node.js 20 with Replit environment
- **Package Manager**: npm for dependency management
- **Build Process**: Vite development server with hot reload

### Mobile Deployment
- **Android Build**: Capacitor CLI generates native Android project
- **Build Output**: APK generation through Android Studio or Capacitor build
- **Permissions**: Location, background processing, and network access

### Configuration
- **Capacitor Config**: Background mode enabled, HTTPS scheme for Android
- **TypeScript**: Strict mode with modern ES2020 target
- **Security**: HTTPS enforcement for API communications

## Recent Changes
- June 14, 2025: Simplified authentication flow by removing persistent token storage
- June 14, 2025: Fixed Vite development server configuration for proper hosting
- June 14, 2025: Application fully functional with real API integration for login and vehicle course management
- June 14, 2025: GPS background tracking system implemented with Android permissions

## Changelog
- June 14, 2025: Initial setup and complete application development

## User Preferences

Preferred communication style: Simple, everyday language.
Uses Romanian language for UI text and error messages.