# iTrack GPS - Documentație Tehnică Completă Multi-Course

## 🏗️ Arhitectura Tehnică Detaliată

### Structura pe 5 Nivele

#### 1. **Frontend Layer (React/TypeScript)**
```
src/main.tsx → src/App.tsx → 23 componente specializate
```
- **React 19.1.0** cu TypeScript pentru siguranță tipurilor
- **Vite 6.3.5** pentru build rapid și development server
- **Bootstrap 5.3.6** pentru UI consistency
- **CSS cu 3,651 linii** pentru 6 teme complete

#### 2. **Service Layer (6 servicii specializate)**
- **API Service (621 linii)**: Comunicare centralizată cu backend extern
- **CourseAnalytics (434 linii)**: Analytics per cursă cu pause/resume
- **OfflineGPS (346 linii)**: Cache inteligent cu batch sync la revenirea online
- **ThemeService (226 linii)**: Management 6 teme cu persistență automată
- **AppLogger (153 linii)**: Logging centralizat cu export
- **Storage (94 linii)**: Wrapper Capacitor Preferences

#### 3. **Native Bridge Layer (Capacitor)**
- **WebView Interface**: `window.AndroidGPS` pentru comunicare bidirectionala
- **Plugin-uri native**: Geolocation, Preferences, Device, Network, StatusBar
- **Cross-platform**: Suport Android primar + iOS potential

#### 4. **Android Native Layer Multi-Course (Java)**
- **BackgroundGPSService.java (759 linii)**: Multi-course GPS cu Map<String, Integer> courseStatuses
- **MainActivity.java (350 linii)**: Bridge JavaScript cu startGPS/updateStatus/stopGPS
- **Multi-Course Logic**: transmitGPSDataForActiveCourses() pentru toate cursele ACTIVE
- **Individual Status Management**: courseStatuses.put(uit, status) per UIT
- **Foreground Service**: Tracking continuu multi-course în background
- **WakeLock & ScheduledExecutorService**: Performance garantat pentru curse multiple

#### 5. **External API Integration**
- **Environment flexibil**: PROD/TEST cu switching la nivel de cod
- **Dual transmission**: CapacitorHttp + fetch fallback
- **Retry logic**: 3 încercări cu exponential backoff
- **Timeout management**: 10 secunde pentru toate request-urile

---

## 📋 Analiză Detaliată Componente

### 🎯 Componente React Principale

#### VehicleScreenProfessional.tsx (2345 linii)
**Componenta centrală cu management complet multi-course**

**State Management (15 state-uri):**
```typescript
const [coursesLoaded, setCoursesLoaded] = useState(false);
const [isOnline, setIsOnline] = useState(() => window.navigator.onLine);
const [offlineGPSCount, setOfflineGPSCount] = useState(0);
const [selectedStatusFilter, setSelectedStatusFilter] = useState<number | 'all'>('all');
const [currentTheme, setCurrentTheme] = useState<Theme>('dark');
const [clickCount, setClickCount] = useState(0); // Pentru debug panel
```

**Funcții Business-Critical:**
- `handleStartCourse()`: Activează cursă și pornește GPS tracking
- `handlePauseCourse()`: Pauzează cursă fără a afecta alte curse active
- `handleResumeCourse()`: Reia cursă din pauză
- `handleStopCourse()`: Finalizează cursă complet și oprește GPS
- `loadCoursesForVehicle()`: Încarcă toate cursele pentru vehiculul selectat

#### CourseDetailCard.tsx (1066 linii)
**Card individual pentru fiecare cursă cu toate controalele**

**Props Interface:**
```typescript
interface CourseDetailCardProps {
  course: Course;
  onStart: (course: Course) => void;
  onPause: (course: Course) => void;
  onResume: (course: Course) => void;
  onStop: (course: Course) => void;
  isLoading: boolean;
  currentTheme: Theme;
}
```

**Funcționalități:**
- Status visual cu culori distinctive pentru fiecare stare
- Butoane de control cu loading states
- Afișare detalii curse (rută, destinație, timp estimat)
- Statistici real-time per cursă

#### LoginScreen.tsx (867 linii)
**Autentificare securizată cu API backend**

**Validări:**
- Email format validation
- Password strength requirements
- CAPTCHA integration pentru security
- Remember credentials cu Capacitor Preferences

### 🔧 Servicii Backend

#### api.ts (621 linii)
**Client API centralizat cu toate endpoint-urile**

**Environment Management:**
```typescript
const API_CONFIGS = {
  PROD: 'https://www.euscagency.com/etsm_prod/platforme/transport/apk/',
  TEST: 'https://www.euscagency.com/etsm_test/platforme/transport/apk/',
  DEV: 'http://localhost:3000/api/'
};
```

**Endpoint-uri principale:**
- `login.php`: JWT authentication
- `logout.php`: Session cleanup
- `vehicul.php`: Course loading
- `gps.php`: GPS data transmission
- `rezultate.php`: GPS verification

**HTTP Methods:**
- **CapacitorHttp** pentru Android native
- **fetch** fallback pentru compatibility
- **Retry logic** cu exponential backoff
- **Timeout handling** la 15 secunde

#### courseAnalytics.ts (434 linii)
**Serviciu analytics per cursă cu gestionare pause/resume**

**Interfețe principale:**
```typescript
interface CourseStatistics {
  courseId: string;
  startTime: string;
  endTime?: string;
  totalDistance: number;
  drivingTime: number;
  averageSpeed: number;
  maxSpeed: number;
  isActive: boolean;
  gpsPoints: GPSPoint[];
  totalStops: number;
  stopDuration: number;
}
```

**Metode cheie:**
- `startCourseTracking()`: Inițializează analytics pentru cursă
- `pauseCourseTracking()`: Pauzează tracking fără a finaliza
- `resumeCourseTracking()`: Reia tracking din pauză
- `stopCourseTracking()`: Finalizează și calculează statistici finale
- `updateCourseStatistics()`: Update timp real cu coordonate GPS

#### offlineGPS.ts (346 linii)
**Manager GPS offline cu batch sync**

**Funcționalități:**
- **Cache local** pentru coordonate GPS când nu există conexiune
- **Batch sync** la revenirea online (max 50 coordonate per batch)
- **Retry logic** pentru coordonatele eșuate
- **Progress tracking** pentru sincronizare
- **Cleanup automat** pentru coordonatele vechi

---

## 🤖 Android Native Implementation

### BackgroundGPSService.java (759 linii)
**Serviciu GPS nativ cu management multi-course**

#### Arhitectura Multi-Course
```java
// MULTI-COURSE MANAGEMENT: Track individual statuses per UIT
private java.util.Map<String, Integer> courseStatuses = new java.util.HashMap<>();

// GPS TRANSMISSION pentru toate cursele ACTIVE
private void transmitGPSDataForActiveCourses(Location location) {
    for (java.util.Map.Entry<String, Integer> entry : courseStatuses.entrySet()) {
        String uit = entry.getKey();
        int status = entry.getValue();
        
        if (status == 2) { // ACTIVE only
            transmitGPSDataForCourse(location, uit);
        }
    }
}
```

#### Componente Tehnice
- **ScheduledExecutorService**: GPS interval exact la 10 secunde
- **WakeLock PARTIAL_WAKE_LOCK**: Previne sleep-ul sistemului
- **HandlerThread**: Thread dedicat pentru operații GPS
- **LocationManager**: GPS și Network providers
- **Foreground Service**: Notificare persistentă cu HIGH priority

#### Status Management
```java
// Status codes per cursă
// 1 = AVAILABLE (disponibil)  
// 2 = ACTIVE (în derulare - GPS activ)
// 3 = PAUSE (pauzat - GPS skip)
// 4 = STOP (finalizat - eliminare din Map)
```

### MainActivity.java (350 linii)
**Bridge WebView pentru comunicare JavaScript-Android**

#### WebView Interface Methods
```java
@JavascriptInterface
public String startGPS(String courseId, String vehicleNumber, String uit, String authToken, int status)

@JavascriptInterface  
public String updateStatus(String uit, int newStatus)

@JavascriptInterface
public String stopGPS(String uit)

@JavascriptInterface
public String getServiceStatus()
```

#### Bridge Communication
- **window.AndroidGPS** disponibil în JavaScript
- **Verification checks** pentru interface availability
- **Error handling** cu retry logic
- **Status reporting** către frontend

---

## 🔌 API Integration

### Server Endpoints (etsm_prod)

#### POST /login.php
**Request:**
```json
{
  "email": "user@company.com",
  "password": "securepassword"
}
```
**Response:**
```json
{
  "success": true,
  "token": "JWT_TOKEN_HERE",
  "expires": "2025-08-18T10:00:00Z"
}
```

#### GET /vehicul.php?numar=B123ABC
**Headers:** `Authorization: Bearer JWT_TOKEN`
**Response:**
```json
{
  "success": true,
  "curse": [
    {
      "id": "12345",
      "uit": "UIT67890",
      "name": "Transport Bucuresti - Cluj",
      "status": 1,
      "departure_location": "Bucuresti",
      "destination_location": "Cluj-Napoca"
    }
  ]
}
```

#### POST /gps.php
**Request:**
```json
{
  "uit": "UIT67890",
  "numar_inmatriculare": "B123ABC",
  "lat": 44.4267674,
  "lng": 26.1025384,
  "viteza": 45,
  "directie": 180,
  "altitudine": 85,
  "hdop": 1.2,
  "gsm_signal": 4,
  "baterie": 85,
  "status": 2,
  "timestamp": "2025-08-17 14:30:25"
}
```

### GPS Data Format

#### Coordonate GPS (transmise la 10 secunde)
```typescript
interface GPSData {
  uit: string;              // UIT cursă
  numar_inmatriculare: string; // Număr vehicul
  lat: number;              // Latitudine (7 decimale)
  lng: number;              // Longitudine (7 decimale)  
  viteza: number;           // km/h
  directie: number;         // 0-360 grade
  altitudine: number;       // metri
  hdop: number;            // Horizontal Dilution of Precision
  gsm_signal: number;      // 1-4 (signal strength)
  baterie: number;         // 0-100%
  status: number;          // 2=ACTIVE, 3=PAUSE, 4=STOP
  timestamp: string;       // Romania timezone
}
```

---

## 🛠️ Development Setup

### Prerequisites
```bash
Node.js 18+
Android Studio 2024.1+
Capacitor CLI 6.0+
TypeScript 5.0+
```

### Build Commands
```bash
# Development
npm run dev
# sau
npx vite --host 0.0.0.0 --port 5000

# Production Build
npm run build
npx cap sync android
npx cap open android

# APK Build în Android Studio
Build → Generate Signed Bundle/APK → APK
```

### Environment Variables
```typescript
// src/services/api.ts
const API_BASE_URL = API_CONFIGS.PROD; // PROD/TEST/DEV
```

### Testing Multi-Course
```bash
1. Login cu credențiale companiei
2. Introduce număr vehicul (ex: B123ABC)  
3. START multiple curse simultan
4. Test PAUSE pe o cursă → alte curse rămân ACTIVE
5. Test RESUME → cursa pauzată devine din nou ACTIVE
6. Monitor GPS logs în AdminPanel (50 clicks pe timestamp)
```

---

## 🔍 Debugging & Monitoring

### Debug Panel (AdminPanel.tsx)
**Accesibil prin 50 clicks pe timestamp**

**Categorii logs:**
- **GPS**: Coordonate transmise și status serviciu
- **API**: Request/response pentru toate endpoint-urile
- **OFFLINE_SYNC**: Sincronizare coordonate offline
- **APP**: Evenimente aplicație și workflow
- **ERROR**: Erori și excepții capturate

### Log Format
```typescript
interface LogEntry {
  id: string;
  timestamp: string;
  category: 'GPS' | 'API' | 'OFFLINE_SYNC' | 'APP' | 'ERROR';
  message: string;
  details?: any;
}
```

### Performance Monitoring
- **GPS interval**: Exact 10 secunde per cursă activă
- **Battery usage**: Optimizat cu WakeLock parțial
- **Network usage**: Batch transmission pentru eficiență
- **Memory usage**: Cleanup automat pentru GPS points vechi

---

## 🚀 Deployment

### APK Distribution
```bash
# Debug APK
./gradlew assembleDebug

# Release APK (cu signing)
./gradlew assembleRelease
```

### Server Requirements
- **HTTPS mandatory** pentru production
- **CORS enabled** pentru domain-ul aplicației
- **JWT validation** pentru toate endpoint-urile protejate
- **Rate limiting** pentru a preveni abuse

### Mobile Permissions
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

---

## 📈 Scalabilitate și Optimizare

### Performance Optimizations
- **Zero-lag scrolling**: Eliminat backdrop-filter și transform CSS
- **Memory management**: Cleanup automat pentru GPS points (max 1000 per cursă)
- **Network efficiency**: Batch sync offline coordinates (50 per request)
- **Battery optimization**: GPS doar pentru curse ACTIVE

### Multi-Course Limits
- **Teoretic**: Unlimited curse per vehicul
- **Practic**: Testat cu 10 curse simultane
- **Recommendation**: Max 5-7 curse active pentru performance optimal

### Security Features
- **JWT tokens** cu expirare automată
- **HTTPS only** pentru production
- **Input validation** pentru toate formularele
- **SQL injection protection** pe backend