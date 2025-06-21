# iTrack GPS Application - Documentație Completă

## Overview

iTrack este o aplicație profesională enterprise de monitorizare GPS pentru managementul flotelor de vehicule, dezvoltată special pentru companiile de transport din România. Aplicația oferă urmărire GPS în timp real, gestionarea curselor, capabilități offline robuste și analytics comprehensive pentru optimizarea operațiunilor de transport.

## Arhitectura Sistemului

### Frontend Architecture
- **Framework**: React 19.1.0 cu TypeScript pentru siguranță și dezvoltare modernă
- **Build Tool**: Vite 6.3.5 pentru dezvoltare rapidă și build-uri optimizate
- **UI Framework**: Bootstrap 5.3.6 cu CSS personalizat featuring glassmorphism și animații moderne
- **Mobile Framework**: Capacitor 7.3.0 pentru deployment cross-platform nativ
- **Styling**: CSS modern cu backdrop-filter, gradiente și animații 3D enterprise

### Backend Integration
- **API Communication**: Integrare RESTful API cu sistemul extern de management transport
- **Base URL**: `https://www.euscagency.com/etsm3/platforme/transport/apk`
- **Authentication**: Autentificare JWT token cu persistență automată
- **Data Format**: JSON pentru toate comunicările API cu validare completă

### Mobile Platform Integration
- **Primary Target**: Platforma Android cu servicii GPS native
- **Cross-Platform**: Capacitor permite deployment iOS
- **Native Services**: GPS tracking enhanced cu operare în fundal
- **Permissions**: Location, background location, și excludere battery optimization

## Componente Cheie

### Sistem Autentificare Enterprise
- Login email/password cu design corporatist profesional
- Management JWT token cu persistență automată și auto-login
- Credențiale admin pentru debugging: `admin@itrack.app` / `parola123`
- Logout securizat cu curățarea completă a datelor locale
- Validare comprehensivă cu feedback vizual

### Serviciu GPS Tracking Avansat
- **Enhanced GPS Service**: Serviciu nativ Android pentru tracking continuu în fundal
- **Interval Optimizat**: Transmisie coordonate la exact 5 secunde pentru echilibru precizie/baterie
- **Offline Capability**: Cache automat coordonate când internetul nu este disponibil
- **Batch Synchronization**: Sync automat până la 50 coordonate cache când revine online
- **High Precision**: Coordonate cu precizie 8 decimale și metadate complete
- **Battery Optimization**: Management inteligent alimentare cu foreground service
- **Single Source GPS**: Doar serviciul Android nativ transmite (WebView GPS dezactivat)

### Gestionare Curse Profesională
- Input profesional număr vehicul cu design enterprise
- Încărcare curse specifice vehiculului cu validare server
- Management status timp real: Disponibil, Activ, Pauză, Oprit
- Dashboard cu 5 carduri analytics: Total Curse, Activ, Pauză, Disponibil, Statistici
- Analytics curse cu calcule distanță, timp și viteză folosind formula Haversine
- Interfață șofer optimizată pentru operațiuni transport comercial

### Analytics și Statistici Enterprise
- **CourseStatsModal**: Modal dedicat cu statistici detaliate pentru fiecare cursă
- **Calcule automate**: Distanță parcursă, timp conducere, viteză medie/maximă, opriri
- **Tracking timp real**: Utilizând algoritmul Haversine pentru calcule precise distanță
- **Rapoarte cumulative**: Pentru toate cursele vehiculului cu export capabilities
- **Dashboard vizual**: 5 carduri responsive cu animații și efecte hover

### Debug Panel Avansat
- **Activare**: 50 click-uri pe timestamp cu counter vizibil de la 30-50
- **Modal overlay**: Design profesional cu toate logurile aplicației
- **Logging persistent**: Logurile nu se șterg la logout pentru debugging continuu
- **Funcții export**: Copiază logs și Refresh data cu interfață intuitivă
- **Categorii logging**: GPS, API, OFFLINE_SYNC, APP, ERROR cu timestamping

### Gestionare Offline Robustă
- **Detecție automată**: Monitor status online/offline cu indicator vizual
- **Cache inteligent**: Coordonate GPS salvate automat cu metadate complete
- **Progres vizual**: Indicator sincronizare cu progres în timp real
- **Recuperare automată**: Re-transmisie coordonate când conexiunea revine
- **Retry logic**: Maximum 3 încercări per coordonată cu exponential backoff

## Fluxurile de Date

### 1. Flux Autentificare Enterprise
```
User input → LoginScreen.tsx → Validare credențiale → JWT token → 
Stocare Capacitor Preferences → Auto-login setup → Navigation dashboard
```

### 2. Flux GPS Tracking
```
Start cursă → Activare EnhancedGPSService → Colectare coordonate (5s) → 
Transmisie timp real → [Offline] Cache local → Sync automat când online
```

### 3. Flux Gestionare Curse
```
Număr vehicul → Încărcare curse API → Status management → 
Analytics tracking → Completion cu statistici
```

### 4. Flux Analytics
```
Start tracking → Calculare distanță Haversine → Update statistici timp real → 
Persistare localStorage → Afișare CourseStatsModal
```

## Structura Fișierelor

### Componente React (src/components/)
- **LoginScreen.tsx**: Ecran autentificare enterprise cu design corporatist
- **VehicleScreenProfessional.tsx**: Dashboard principal cu gestionare curse și analytics
- **CourseStatsModal.tsx**: Modal statistici detaliate cu calcule comprehensive
- **CourseCard.tsx & CourseDetailCard.tsx**: Componente individuale curse
- **OfflineGPSMonitor.tsx**: Monitor status offline cu progres sync vizual

### Servicii Business (src/services/)
- **api.ts**: Comunicare server cu endpoints login, logout, courses, GPS
- **directAndroidGPS.ts**: Interfață serviciu GPS nativ Android
- **offlineGPS.ts**: Gestionare coordonate offline cu batch sync
- **offlineSyncStatus.ts**: Monitor progres sincronizare cu callbacks
- **courseAnalytics.ts**: Calcule statistici cu algoritmi Haversine
- **appLogger.ts**: Logging persistent cu categorii și export
- **storage.ts**: Gestionare tokens în Capacitor Preferences

### Android Native
- **EnhancedGPSService.java**: Serviciu foreground GPS cu optimizare baterie
- **build.gradle**: Configurare Android cu versiunea 1807.99
- **AndroidManifest.xml**: Permisiuni location și background processing

## Dependencies și Tehnologii

### Core Dependencies
- **@capacitor/core**: Abstracție platformă mobilă
- **@capacitor/android**: Implementări specifice Android
- **@capacitor/geolocation**: Servicii GPS native
- **@capacitor/preferences**: Stocare locală securizată
- **@capacitor-community/background-geolocation**: Background tracking enhanced

### Development Stack
- **React 19.1.0**: UI library cu hooks moderne
- **TypeScript**: Type safety și tooling avansat
- **Vite 6.3.5**: Build system modern cu HMR
- **Bootstrap 5.3.6**: Framework UI responsive

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server pe port 5000
- **Live Reload**: Hot module replacement pentru dezvoltare rapidă
- **TypeScript Compilation**: Type checking și error detection în timp real

### Android Build Process
1. **Web Build**: `npm run build` → Build optimizat producție Vite
2. **Capacitor Sync**: `npx cap sync android` → Copiere assets în proiect Android
3. **Android Studio**: `npx cap open android` → Build și testing nativ
4. **APK Generation**: Gradle build cu ProGuard optimization

### Production Configuration
- **Target SDK**: API Level 35 (Android 15) pentru features latest
- **Minimum SDK**: API Level 23 (Android 6.0) pentru compatibilitate largă
- **App Bundle**: Format AAB optimizat pentru Play Store
- **Permissions**: Location, background location, network access, battery optimization

## Securitate și Performanță

### Securitate Enterprise
- **JWT Token**: Autentificare sigură cu expirare automată
- **Stocare locală**: Capacitor Preferences pentru date sensibile
- **Validare input**: Sanitizare toate inputurile cu regex patterns
- **HTTPS obligatoriu**: Toate comunicările API securizate SSL

### Optimizări Performanță
- **GPS interval optim**: 5 secunde pentru echilibru precizie/baterie
- **Foreground service**: Previne kill aplicație de către sistem Android
- **Batch operations**: Salvare în lot coordonate pentru eficiență
- **Memory management**: Cleanup automat date vechi și monitoring usage

## Versioning și Updates

### Versiunea Curentă: 1808.00 (June 21, 2025)
- **Design unificat complet**: Lista de curse, GPS monitor și footer cu același stil închis ca header-ul
- **Sistem offline robust**: Detectare reală conexiune + salvare automată coordonate când pică internetul
- **Sincronizare automată**: Progress bar cu shimmer animation când revine conexiunea
- **Centrare perfectă**: Conținut centrat uniform fără spații laterale
- **Design enterprise**: Pagină input vehicul redesigned complet business
- **Debug panel**: 50 click-uri cu modal overlay și logging persistent
- **Al 5-lea card**: "STATISTICI" clickabil cu CourseStatsModal analytics
- **GPS optimization**: Transmisie exact 5 secunde, eliminat WebView GPS
- **UI îmbunătățiri**: Safe-area protection, texte română, responsive design
- **Architecture updates**: Service layer pattern, error boundaries, optimization
- **Documentation completă**: README.md actualizat cu structura detaliată a tuturor componentelor
- **Consolidare documentație**: API.md și ARCHITECTURE.md integrate în README.md pentru organizare simplificată
- **Localizare completă**: build.bat tradus în română pentru consistență cu toate textele aplicației
- **Consolidare finală documentație**: SETUP.md și BUILD_INSTRUCTIONS.md integrate în README.md, eliminat linkul API din prezentări
- **Validare input îmbunătățită**: Suport complet rețele mobile RO - Orange, Vodafone, Telekom, Digi, RCS&RDS cu formatare automată la +40
- **Documentație Google Play Protect**: Ghid complet pentru rezolvarea problemelor de instalare APK din afara Play Store
- **Poziționare nativă optimizată**: Aplicația se poziționează exact sub bara nativă de sus și deasupra celei de jos pentru aspect nativ
- **Detecție offline robustă**: Verificare dublă navigator.onLine + isOnline pentru afișare corectă status offline
- **Progress bar sincronizare îmbunătățit**: Animații shimmer și statistici detaliate când revine internetul pentru sincronizare GPS
- **Design simplificat**: Un singur card central elegant cu logo iTrack și formular - eliminat cardurile suplimentare pentru aspect mai curat
- **Design corporatist finalizat**: Header cu iconițe în partea de sus pe fundal închis, fără suprapuneri cu barele native Android
- **Iconiță Android unificată**: Implementat același design corporatist ca logo-ul iTrack cu camion în cerc, adaptive icon complet pentru toate dimensiunile
- **Request deduplication implementat**: Eliminat cererile multiple simultane care cauzau răspunsuri goale prin sistem de blocare și refolosire cereri active
- **Problemă API rezolvată**: Corectat verificarea response.data -> response direct în VehicleScreenProfessional pentru încărcarea curselor
- **Iconița Android regenerată**: Rezolvat problema afișării iconița default prin rebuild iconițelor cu designul corporatist iTrack
- **Safe-area positioning complet**: Header poziționat sub bara nativă de sus, footer și conținut poziționat deasupra barei native de jos
- **Logo centrat perfect**: Header redesignat cu logo-ul centrat absolut stânga-dreapta folosind transform: translateX(-50%)
- **Design carduri optimizat**: Eliminat suprapunerile, spacing organizat, folosește doar datele reale din API fără câmpuri inventate
- **GPS testing validat**: Testat cu curl statusurile 2→3→2 folosind token real, transmisie coordonate confirmată la server
- **Android GPS nativ completat**: MainActivity.java cu WebView interface, EnhancedGPSService corect conectat pentru background GPS real
- **GPS transmission reparată**: Eliminat condiționările care blocau pornirea, GPS transmite acum coordonate în toate mediile
- **APK ready**: Aplicația pregătită pentru background GPS cu telefon blocat, transmisie coordonate multiple curse simultan

### Features Majore Implementate
1. **Enterprise Authentication**: Login corporatist cu credențiale admin
2. **Advanced GPS Tracking**: Serviciu nativ Android cu capabilities offline
3. **Course Analytics**: Calcule Haversine cu statistici comprehensive
4. **Debug Infrastructure**: Panel avansat cu logging persistent
5. **Offline Robustness**: Cache automat cu sync vizual progress
6. **Professional UI**: Design glassmorphism cu animații enterprise

## API Documentation

### Authentication Endpoints
- `POST /api_login.php`: Login cu email/password, returns JWT token
- `POST /api_logout.php`: Logout securizat cu cleanup server-side

### Course Management
- `GET /get_courses_by_vehicle.php?vehicle={nr}`: Încărcare curse vehicul
- `POST /update_course_status.php`: Actualizare status cursă (1-4)

### GPS Tracking
- `POST /gps.php`: Transmisie coordonate cu metadate complete (lat, lng, speed, etc.)

## User Preferences

Preferred communication style: Simple, everyday language.