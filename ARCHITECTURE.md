# iTrack GPS - Arhitectura Tehnică Detaliată

## Prezentare Generală

iTrack GPS este o aplicație enterprise pentru monitorizarea vehiculelor cu focus pe robustețe, performanță și experiență utilizator profesională. Aplicația combină tehnologiile web moderne cu capabilitățile native Android pentru a oferi o soluție completă de tracking GPS.

## Arhitectura de Nivel Înalt

```
┌─────────────────────────────────────────────────────────────┐
│                    iTrack GPS Application                   │
├─────────────────────────────────────────────────────────────┤
│  React Frontend (TypeScript)                               │
│  ├── Login Enterprise                                      │
│  ├── Vehicle Dashboard                                     │
│  ├── Course Management                                     │
│  ├── Statistics & Analytics                               │
│  └── Debug Panel                                          │
├─────────────────────────────────────────────────────────────┤
│  Capacitor Bridge Layer                                    │
│  ├── GPS Services                                         │
│  ├── Storage (Preferences)                                │
│  ├── Device Info                                          │
│  └── Background Processing                                │
├─────────────────────────────────────────────────────────────┤
│  Android Native Layer                                      │
│  ├── EnhancedGPSService.java                             │
│  ├── Background Location                                   │
│  ├── Battery Optimization                                 │
│  └── Notification Management                              │
├─────────────────────────────────────────────────────────────┤
│  External API Integration                                  │
│  ├── Authentication Server                                │
│  ├── Course Management API                                │
│  └── GPS Data Transmission                                │
└─────────────────────────────────────────────────────────────┘
```

## Componentele Principale

### 1. Frontend React (src/components/)

#### LoginScreen.tsx
**Responsabilitate**: Autentificare utilizator cu design enterprise

**Funcționalități**:
- Design corporatist cu logo și branding profesional
- Validare input cu feedback vizual
- Suport pentru credențiale admin (`admin@itrack.app` / `parola123`)
- Animații și efecte glassmorphism
- Responsive design pentru toate deviceurile

**State Management**:
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [showPassword, setShowPassword] = useState(false);
```

#### VehicleScreenProfessional.tsx
**Responsabilitate**: Dashboard principal pentru gestionarea curselor

**Funcționalități**:
- Input profesional pentru numărul de înmatriculare vehicul
- Dashboard cu 5 carduri analytics: Total, Activ, Pauză, Disponibil, Statistici
- Lista curselor cu acțiuni disponibile (Start, Pauză, Resume, Stop)
- Debug panel cu acces prin 50 click-uri pe timestamp
- Monitorizare status online/offline
- Integrare completă cu serviciile GPS

**Arhitectura State**:
```typescript
// Core state
const [vehicleNumber, setVehicleNumber] = useState('');
const [courses, setCourses] = useState<Course[]>([]);
const [coursesLoaded, setCoursesLoaded] = useState(false);

// UI state
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [showDebugPanel, setShowDebugPanel] = useState(false);
const [showStatsModal, setShowStatsModal] = useState(false);

// Debug state
const [debugLogs, setDebugLogs] = useState<string[]>([]);
const [infoClickCount, setInfoClickCount] = useState(0);

// Offline monitoring
const [isOnline, setIsOnline] = useState(navigator.onLine);
const [offlineCount, setOfflineCount] = useState(0);
```

#### CourseStatsModal.tsx
**Responsabilitate**: Afișarea statisticilor detaliate pentru curse

**Funcționalități**:
- Calcularea automată a statisticilor pentru fiecare cursă
- Afișarea datelor cumulative (distanță totală, timp, viteză)
- Formatarea profesională a datelor
- Export și vizualizare details per cursă

### 2. Servicii (src/services/)

#### api.ts
**Responsabilitate**: Comunicarea cu serverul backend

**Endpoints**:
```typescript
// Autentificare
login(email: string, password: string): Promise<LoginResponse>
logout(token: string): Promise<boolean>

// Gestionare curse
getVehicleCourses(vehicleNumber: string, token: string)

// GPS tracking
sendGPSData(gpsData: GPSData, token: string): Promise<boolean>
```

**Configurare**:
- Base URL: `https://www.euscagency.com/etsm3/platforme/transport/apk`
- Timeout: 10 secunde pentru toate request-urile
- Retry logic pentru request-urile eșuate
- Logging complet al tuturor interacțiunilor API

#### directAndroidGPS.ts
**Responsabilitate**: Interfața cu serviciul GPS nativ Android

**Funcționalități**:
- Gestionarea sesiunilor de tracking GPS
- Comunicarea cu serviciul nativ EnhancedGPSService
- Optimizarea pentru o singură sursă GPS (evitarea duplicatelor)
- Gestionarea course-urilor active

**Arhitectura**:
```typescript
class DirectAndroidGPSService {
  private activeCourses: Map<string, ActiveCourse> = new Map();
  
  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number)
  async stopTracking(courseId: string)
  async updateCourseStatus(courseId: string, newStatus: number)
  getActiveCourses(): string[]
  hasActiveCourses(): boolean
}
```

#### offlineGPS.ts
**Responsabilitate**: Gestionarea coordonatelor GPS offline

**Funcționalități**:
- Cache automat al coordonatelor când internetul nu este disponibil
- Stocare în format OfflineGPSCoordinate cu metadate complete
- Sincronizare în batch până la 50 coordonate
- Retry logic cu maximum 3 încercări per coordonată
- Cleanup automat după sincronizare reușită

**Structura datelor**:
```typescript
interface OfflineGPSCoordinate {
  id: string;
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
  lat: number;
  lng: number;
  timestamp: string;
  viteza: number;
  directie: number;
  altitudine: number;
  baterie: number;
  hdop: string;
  gsm_signal: string;
  retryCount: number;
  savedAt: string;
}
```

#### courseAnalytics.ts
**Responsabilitate**: Calcularea și gestionarea statisticilor curselor

**Funcționalități**:
- Tracking în timp real al statisticilor GPS
- Calcularea distanței folosind formula Haversine
- Detectarea opririlor și calcularea timpului de conducere
- Calcularea vitezei medii și maxime
- Persistența statisticilor în storage local

**Algoritmi**:
```typescript
// Calcularea distanței Haversine
private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Raza Pământului în km
  const dLat = this.toRadians(lat2 - lat1);
  const dLng = this.toRadians(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
           Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

#### appLogger.ts
**Responsabilitate**: Logging persistent pentru debugging

**Funcționalități**:
- Interceptarea automată a console.log, warn, error
- Categorizarea logurilor (GPS, API, OFFLINE_SYNC, APP)
- Stocare persistentă cu limită de 1000 loguri
- Interface pentru accesarea și exportul logurilor
- Nu se șterg la logout pentru debugging persistent

### 3. Serviciul GPS Nativ Android

#### EnhancedGPSService.java
**Locație**: `android/app/src/main/java/com/euscagency/itrack/EnhancedGPSService.java`

**Responsabilitate**: Serviciu foreground pentru tracking GPS continuu

**Funcționalități principale**:
- **Foreground Service**: Operare continuă în fundal cu notificare persistentă
- **Location Manager**: Utilizarea GPS_PROVIDER și NETWORK_PROVIDER
- **Battery Optimization**: Solicitarea excluderii din Doze mode
- **Interval 5 secunde**: Transmisie optimizată pentru echilibru precizie/baterie
- **Error Handling**: Gestionarea erorilor de locație și re-conectare automată

**Configurare Android**:
```xml
<!-- Permisiuni în AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

## Fluxurile de Date Detaliate

### Flux Autentificare
```
1. User input → LoginScreen.tsx
2. Validare locală → api.ts/login()
3. Request HTTP → Backend API
4. Response JWT token → storage.ts/storeToken()
5. Navigation → VehicleScreenProfessional.tsx
6. Auto-login la următoarea lansare
```

### Flux GPS Tracking
```
1. User selectează cursă → VehicleScreenProfessional.tsx
2. Start tracking → directAndroidGPS.ts/startTracking()
3. Activare serviciu → EnhancedGPSService.java
4. Colectare coordonate (5s interval) → Android LocationManager
5. Transmisie → api.ts/sendGPSData()
6. Offline fallback → offlineGPS.ts/saveCoordinate()
7. Auto-sync când online → offlineGPS.ts/syncOfflineCoordinates()
```

### Flux Analytics
```
1. Start tracking → courseAnalytics.ts/startCourseTracking()
2. GPS updates → courseAnalytics.ts/updateCourseStatistics()
3. Calcule timp real → Haversine distance, speed, stops
4. Persistare → localStorage cu prefix course_analytics_
5. Afișare → CourseStatsModal.tsx
```

## Patterns de Design

### 1. Service Layer Pattern
Toate operațiunile business sunt abstractizate în servicii dedicate:
- `api.ts` - Comunicare externă
- `directAndroidGPS.ts` - GPS native
- `offlineGPS.ts` - Gestionare offline
- `courseAnalytics.ts` - Calcule statistici

### 2. Observer Pattern
Utilizat pentru monitorizarea statusului online/offline:
```typescript
window.addEventListener('online', handleOnlineStatus);
window.addEventListener('offline', handleOfflineStatus);
```

### 3. State Management Local
Utilizarea useState și useEffect pentru managementul stării componentelor fără library-uri externe (Redux, Zustand).

### 4. Error Boundaries
Gestionarea erorilor la nivel de componentă cu fallback UI și logging.

## Securitate

### Autentificare
- **JWT Token**: Stocare sigură în Capacitor Preferences
- **Expirare**: Token-urile au expirare și refresh automat
- **Logout securizat**: Curățarea completă a datelor locale

### Validare Input
- **Sanitizare**: Toate inputurile sunt sanitizate (regex pentru numărul vehiculului)
- **Validare server-side**: Double validation pe backend
- **XSS Protection**: Escape-ul tuturor datelor afișate

### Comunicare API
- **HTTPS obligatoriu**: Toate endpoint-urile folosesc SSL
- **Timeout-uri**: Previne hanging requests
- **Rate limiting**: Gestionarea la nivel de client

## Performanță

### Optimizări Frontend
- **Lazy Loading**: Componentele se încarcă la cerere
- **Memoization**: Utilizarea React.memo pentru componente costisitoare
- **Bundle splitting**: Vite optimizează automat bundle-ul

### Optimizări GPS
- **Interval optim**: 5 secunde echilibrează precizia cu consumul de baterie
- **Provider selection**: Utilizarea celui mai precis provider disponibil
- **Foreground service**: Previne kill-ul aplicației de către sistem

### Optimizări Storage
- **Batch operations**: Salvarea în lot a coordonatelor offline
- **Cleanup automat**: Ștergerea datelor vechi și inutile
- **Compression**: Minimizarea dimensiunii datelor stocate

## Deployment și Build

### Dezvoltare
```bash
npm run dev          # Vite dev server pe port 5000
npx cap sync android # Sincronizare assets cu proiectul Android
npx cap open android # Deschidere Android Studio
```

### Producție
```bash
npm run build        # Build optimizat pentru producție
npx cap sync android # Copiere assets în proiectul Android
# Build APK din Android Studio cu ProGuard enabled
```

### Configurare Android
- **Target SDK**: API Level 35 (Android 15)
- **Min SDK**: API Level 23 (Android 6.0)
- **ProGuard**: Obfuscare și optimizare cod
- **Signing**: Configurare pentru release cu key store

## Monitoring și Debugging

### Logging
- **Categorii**: GPS, API, OFFLINE_SYNC, APP, ERROR
- **Persistență**: Logurile supraviețuiesc logout-ului
- **Export**: Copiere în clipboard pentru debugging

### Debug Panel
- **Activare**: 50 click-uri pe timestamp
- **Counter vizual**: De la 30 la 50 click-uri
- **Modal overlay**: Afișare toate logurile cu funcții export/refresh

### Performance Monitoring
- **Memory usage**: Tracking în debug panel
- **API response times**: Logging pentru toate request-urile
- **GPS accuracy**: Monitoring precizia coordonatelor

Această arhitectură asigură scalabilitatea, mentenabilitatea și performanța aplicației iTrack GPS pentru utilizarea în medii de producție enterprise.