# Overview

iTrack GPS is an enterprise-grade fleet management solution designed specifically for Romanian transport companies. This is a production-ready hybrid mobile application built with React/TypeScript frontend and native Android GPS services, providing real-time vehicle tracking with 10-second GPS intervals, offline data synchronization, and comprehensive business intelligence features. The system supports multiple environments (development/production) with automated deployment scripts and includes enterprise features like 6 corporate themes, professional analytics, and robust offline capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 19.1.0 with TypeScript**: Strict type safety with modern React features
- **Vite 6.3.5**: Ultra-fast build system optimized for development and production
- **Component-based Architecture**: 12 specialized components for GPS tracking, course management, analytics, and administration
- **State Management**: React hooks with centralized state handling in App.tsx
- **Responsive Design**: Bootstrap 5.3.6 with custom CSS supporting 6 corporate themes
- **Performance Optimized**: Memoized components, lazy loading, and optimized rendering for Android devices

## Backend Integration
- **RESTful API Integration**: Centralized API service with environment-based configuration
- **Dual HTTP Strategy**: CapacitorHttp primary with fetch fallback for maximum reliability
- **JWT Authentication**: Token-based authentication with persistent storage
- **Environment Management**: Automated switching between TEST/PROD environments

## Native Mobile Architecture
- **Capacitor Framework**: Hybrid app framework bridging JavaScript and native Android
- **Native GPS Services**: Java-based background GPS service with Android AlarmManager
- **WebView Bridge**: Bidirectional communication between React app and native Android services
- **Foreground Services**: Continuous GPS tracking with notification management

## Data Storage Solutions
- **Capacitor Preferences**: Primary storage for authentication tokens and user preferences
- **Local Storage**: Browser-based storage for themes and temporary data
- **Offline GPS Queue**: Native Android storage for GPS coordinates when offline
- **Course Analytics**: Persistent storage for route statistics and GPS points

## GPS and Location Services
- **High-Precision GPS**: Native Android GPS with 10-second intervals
- **Offline Capability**: Automatic GPS data queuing when network unavailable
- **Batch Synchronization**: Intelligent batch upload when connectivity restored
- **Thread-Safe Implementation**: AtomicBoolean and ConcurrentHashMap for thread safety
- **Power Management**: Android WakeLock for 24/7 operation with battery optimization

## Authentication and Security
- **JWT Token Management**: Secure token storage with auto-refresh capabilities
- **Environment-based Security**: Different API endpoints for development and production
- **Admin Access**: Special administrative panel with 50-click access pattern
- **Secure Bridge**: Protected communication between WebView and native services

## Analytics and Business Intelligence
- **Real-time Course Tracking**: Live monitoring of transport routes with statistics
- **Haversine Calculations**: Precise distance calculations for route analytics
- **Performance Metrics**: Speed, distance, pause detection, and route optimization
- **GPS Point Analysis**: Detailed tracking with manual/automatic pause detection

# External Dependencies

## Core Framework Dependencies
- **Capacitor 7.x**: Mobile app framework with Android, Core, CLI, and multiple plugins
- **React 19.1.0**: Modern React with concurrent features
- **TypeScript 5.8.3**: Static type checking and enhanced developer experience
- **Vite 6.3.5**: Build tool and development server

## UI and Styling
- **Bootstrap 5.3.6**: CSS framework for responsive design
- **Font Awesome 6.4.0**: Icon library for professional UI elements
- **Leaflet 1.9.4**: Interactive maps for route visualization
- **Custom CSS**: Professional themes with glassmorphism effects

## Mobile Plugins
- **@capacitor/geolocation**: GPS positioning and location services
- **@capacitor/preferences**: Secure local data storage
- **@capacitor/device**: Device information and capabilities
- **@capacitor/network**: Network status monitoring
- **@capacitor/status-bar**: Status bar customization for native look

## Utility Libraries
- **memoizee 0.4.17**: Function memoization for performance optimization
- **@types packages**: TypeScript definitions for enhanced development experience

## External Services
- **EUSCAgency Transport API**: Primary backend service for authentication, course management, and GPS data transmission
- **CDN Resources**: Bootstrap and Font Awesome served via CDN for optimal loading
- **Map Tiles**: Leaflet map integration for route visualization

## Development Tools
- **TypeScript Configuration**: Strict type checking with modern ES2020 targets
- **ESLint Rules**: Code quality enforcement with unused variable detection
- **Build Optimization**: Vite configuration for production builds and development server