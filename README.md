# iTrack GPS

## Descriere

iTrack GPS este o aplicație enterprise avansată pentru monitorizarea și managementul flotelor de vehicule comerciale, dezvoltată special pentru companiile de transport din România. Aplicația combină tehnologiile web moderne React cu servicii GPS native Android pentru a oferi o soluție completă și robustă de tracking vehicular.

### Arhitectura 
- **Frontend React**: Interfață utilizator modernă cu TypeScript și design enterprise
- **Serviciu GPS Nativ Android**: Tracking continuu în fundal cu optimizare baterie
- **Capacități Offline Robuste**: Cache automat coordonate cu sincronizare inteligentă
- **Analytics în Timp Real**: Calcule statistici Haversine cu monitoring performanță

### Funcționalități 
- **Detecție Offline Redundantă**: JavaScript + Android NetworkStateReceiver
- **Debug Infrastructure**: Panel avansat cu logging persistent (50 click-uri)
- **Course Analytics**: Statistici comprehensive cu algoritmi de calcul distanță
- **Professional UI**: Design glassmorphism cu safe-area protection

## Caracteristici 

### 🔐 Sistem 
- Login corporatist cu design glassmorphism profesional
- Suport credențiale admin pentru testing: `admin@itrack.app` / `parola123`
- JWT token management cu persistență automată în Capacitor Preferences
- Auto-login la deschiderea aplicației
- Logout securizat cu curățarea completă a datelor locale

### 📍 GPS Tracking 
- **Serviciu nativ Android**: EnhancedGPSService pentru tracking continuu în fundal
- **Interval optimizat**: Transmisie coordonate la exact 5 secunde
- **Precizie înaltă**: Coordonate cu 8 decimale și metadate complete
- **Single source GPS**: Evitarea duplicatelor prin coordonare Android-WebView
- **Battery optimization**: Management inteligent energie cu foreground service

### 🚛 Gestionare Curse 
- Dashboard cu 5 carduri analytics: Total Curse, Activ, Pauză, Disponibil, Statistici
- Input profesional număr vehicul cu design enterprise
- Management status curse în timp real (Disponibil → Activ → Pauză → Oprit)
- Încărcare automată curse specifice vehiculului cu validare server
- Acțiuni curse: Start, Pauză, Resume, Stop cu feedback vizual

### 📊 Analytics și Statistici
- **CourseStatsModal**: Modal dedicat cu statistici detaliate pentru fiecare cursă
- **Calcule automate**: Distanță parcursă folosind algoritmul Haversine
- **Tracking timp real**: Timp conducere, viteză medie/maximă, opriri detectate
- **Rapoarte cumulative**: Pentru toate cursele vehiculului
- **Al 5-lea card "STATISTICI"**: Clickabil pentru acces rapid la analytics

### 🌐 Capabilități Offline Robuste
- **Detecție automată**: Monitor dual JavaScript + Android NetworkStateReceiver
- **Cache inteligent**: Salvare coordonate GPS cu metadate complete în SharedPreferences
- **Sincronizare vizuală**: Progress bar cu animații shimmer pentru sync status
- **Batch sync**: Până la 50 coordonate transmise simultan când revine online
- **Retry logic**: Maximum 3 încercări per coordonată cu exponential backoff

### 🐛 Debug Infrastructure
- **Panel avansat**: Modal overlay cu toate logurile persistente
- **Acces special**: 50 click-uri pe timestamp cu counter vizibil de la 30-50
- **Logging categorization**: GPS, API, OFFLINE_SYNC, APP, ERROR cu timestamping
- **Export functions**: Copiază logs și Refresh data cu interfață intuitivă
- **Persistență**: Logurile nu se șterg la logout pentru debugging continuu

## Tehnologii și Dependencies

### Core Stack
```json
{
  "React": "19.1.0",
  "TypeScript": "Pentru type safety și tooling avansat",
  "Vite": "6.3.5 - Build system modern cu HMR",
  "Bootstrap": "5.3.6 - Framework UI responsive",
  "Capacitor": "7.3.0 - Bridge layer pentru integrare nativă"
}
```

### Capacitor Plugins
```
├── @capacitor/core - Abstracție platformă mobilă
├── @capacitor/android - Implementări specifice Android
├── @capacitor/geolocation - Servicii GPS native
├── @capacitor/preferences - Stocare locală securizată
├── @capacitor/device - Info device și capabilități
└── @capacitor-community/background-geolocation - Enhanced tracking
```

### Android Native
```
├── Target SDK: API Level 35 (Android 15) pentru features latest
├── Minimum SDK: API Level 23 (Android 6.0) pentru compatibilitate largă
├── Version Code: 180799, Version Name: "1807.99"
└── ProGuard optimization pentru release builds
```

## Arhitectura 

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

## Structura Detaliată a Proiectului

### Componente React (src/components/)

#### LoginScreen.tsx
**Responsabilitate**: Ecran de autentificare enterprise cu design corporatist
- Design glassmorphism cu animații profesionale
- Validare input în timp real
- Suport credențiale admin (`admin@itrack.app` / `parola123`)
- Logo corporatist cu efecte hover și rotație
- Safe-area protection pentru barele native
- Auto-focus și keyboard navigation

#### VehicleScreenProfessional.tsx  
**Responsabilitate**: Dashboard principal pentru gestionarea curselor vehiculelor
- **Pagina de input vehicul**: Design enterprise pentru introducerea numărului de înmatriculare
- **Dashboard 5 carduri analytics**: Total Curse, Activ, Pauză, Disponibil, Statistici
- **Lista curselor interactive**: Card-uri expandabile cu acțiuni (Start, Pauză, Resume, Stop)
- **Debug panel**: Acces prin 50 click-uri pe timestamp cu modal overlay
- **Network monitoring**: Detecție online/offline cu polling la 2 secunde
- **Auto-refresh**: Actualizare automată a curselor la interval
- **Course management**: Integrare completă cu serviciile GPS și analytics

#### CourseStatsModal.tsx
**Responsabilitate**: Modal pentru afișarea statisticilor detaliate ale curselor
- Calcularea automată statistici pentru fiecare cursă
- Afișare distanță totală, timp conducere, viteză medie/maximă
- Statistici cumulative pentru toate cursele vehiculului
- Formatarea profesională a datelor cu icoane și gradiente
- Responsive design cu scroll pentru date extensive

#### CourseCard.tsx
**Responsabilitate**: Card individual pentru afișarea unei curse
- Design compact cu informații esențiale cursă
- Status indicator vizual (Available, Active, Paused, Stopped)
- Acțiuni rapide bazate pe statusul cursului
- Animații hover și feedback vizual

#### CourseDetailCard.tsx
**Responsabilitate**: Card extins cu detalii complete ale unei curse
- Informații complete: UIT, declarant, locații, timings
- Status management cu butoane de acțiune
- Loading states pentru operațiuni asincrone
- Design accordion expandabil

#### OfflineGPSMonitor.tsx
**Responsabilitate**: Monitor central pentru statusul GPS și sincronizarea offline
- **Status indicator**: Icoane animat pentru Online/Offline/Syncing
- **Progress bar**: Afișare progres sincronizare cu animație shimmer
- **Counter offline**: Numărul coordonatelor salvate local
- **Auto-sync**: Sincronizare automată când conexiunea revine
- **Network status**: Monitorizare continuă status conexiune

#### AdminPanel.tsx
**Responsabilitate**: Panel de administrare pentru debugging (deprecated)
- Înlocuit cu debug panel integrat în VehicleScreenProfessional
- Păstrat pentru compatibilitate

### Servicii Business (src/services/)

#### api.ts
**Responsabilitate**: Interfața cu API-ul backend pentru toate comunicările server
- **Authentication**: `login()`, `logout()` cu JWT token management
- **Course Management**: `getVehicleCourses()` pentru încărcarea curselor vehicul
- **GPS Transmission**: `sendGPSData()` pentru transmisia coordonatelor
- **Error Handling**: Retry logic și timeout management
- **Network Detection**: Integrare cu detecția offline pentru fallback

#### directAndroidGPS.ts
**Responsabilitate**: Interfața cu serviciul GPS nativ Android
- **Course Tracking**: Management sesiuni GPS pentru curse active
- **Native Integration**: Comunicare cu EnhancedGPSService.java
- **Status Management**: Actualizare status curse cu notificare nativă
- **Single Source GPS**: Evitarea duplicatelor prin coordonare cu WebView
- **Background Operation**: Menținerea tracking-ului când aplicația e minimizată

#### offlineGPS.ts
**Responsabilitate**: Gestionarea coordonatelor GPS când nu există conexiune
- **Offline Storage**: Salvare coordonate în SharedPreferences cu metadate complete
- **Batch Sync**: Sincronizare până la 50 coordonate simultan
- **Retry Logic**: Maximum 3 încercări per coordonată cu exponential backoff
- **Data Integrity**: Validare și cleanup automat coordonate sincronizate
- **Storage Management**: Limitare la 10,000 coordonate pentru optimizare

#### offlineSyncStatus.ts
**Responsabilitate**: Monitorizarea progresului sincronizării offline
- **Progress Tracking**: Callbacks pentru update-uri timp real progres
- **Visual Feedback**: Integrare cu OfflineGPSMonitor pentru progress bar
- **Status Notifications**: Notificări completion, error, progress
- **Performance Metrics**: Estimare timp rămas și rate sincronizare

#### courseAnalytics.ts
**Responsabilitate**: Calcularea și gestionarea statisticilor curselor
- **Distance Calculation**: Algoritm Haversine pentru calcul distanță precisă
- **Speed Analytics**: Viteză medie, maximă și profile de viteză
- **Time Tracking**: Timp conducere efectiv, opriri, pauze
- **Stop Detection**: Detectare automată opriri bazată pe viteză și timp
- **Persistent Storage**: Salvare statistici în localStorage cu prefix organizat

#### appLogger.ts
**Responsabilitate**: Sistem de logging persistent pentru debugging
- **Console Interception**: Capturarea automată console.log, warn, error
- **Categorization**: Organizare loguri pe categorii (GPS, API, OFFLINE_SYNC, APP)
- **Persistent Storage**: 1000 loguri max cu rotație automată
- **Export Functions**: Interfață pentru vizualizare și export loguri
- **Debug Integration**: Integrare cu debug panel pentru acces rapid

#### storage.ts
**Responsabilitate**: Gestionarea stocării locale pentru tokens și settings
- **Token Management**: Stocare JWT tokens în Capacitor Preferences
- **Security**: Criptare și validare tokens
- **Auto-cleanup**: Ștergere automată la logout

### Tipuri TypeScript (src/types/)

#### index.ts
**Definește interfețele principale ale aplicației**:
- **Course**: Structura completă a unei curse cu toate câmpurile API
- **GPSPosition**: Coordonate GPS cu metadate (accuracy, speed, heading)
- **CourseStatus**: Enum pentru statusurile curselor (1-4)
- **GPSData**: Format transmisie coordonate către server
- **CourseStatistics**: Structura analytics cu toate calculele

### Stiluri CSS (src/styles/)

#### professional.css
**Tema enterprise completă cu toate stilurile aplicației**:
- **Enterprise Theme**: Design corporatist cu glassmorphism și gradiente
- **Component Styles**: Stiluri pentru toate componentele React
- **Animations**: Animații profesionale (pulse, shimmer, hover effects)
- **Responsive Design**: Media queries pentru toate dimensiunile
- **Safe Area**: Protection pentru barele native Android/iOS
- **Debug Panel**: Stiluri complete pentru modal debug cu overlay

### Android Native (android/)

#### EnhancedGPSService.java
**Serviciu GPS nativ Android pentru tracking în fundal**:
- **Foreground Service**: Operare continuă cu notificare persistentă
- **Location Providers**: GPS și Network cu algoritm selecție cel mai precis
- **Network Detection**: NetworkStateReceiver pentru detecție offline robustă
- **Battery Optimization**: Wake locks și excludere din Doze mode
- **Offline Storage**: Cache coordonate în SharedPreferences
- **Course Management**: Tracking multiplu curse simultane

**Configurare Android**:
```xml
<!-- Permisiuni în AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

#### build.gradle
**Configurare build Android cu versioning**:
- Target SDK 35 (Android 15), Min SDK 23 (Android 6.0)
- Version Code 180799, Version Name "1807.99"
- ProGuard optimization pentru release builds
- Permisiuni complete location și background processing

### Entry Points

#### main.tsx
**Entry point principal al aplicației React**:
- Inițializare React DOM
- Import stiluri globale
- Setup providers și context

#### capacitor.config.ts
**Configurare Capacitor pentru integrare nativă**:
- App ID: com.euscagency.itrack
- Web dir: dist pentru build assets
- iOS și Android configuration

### Fișiere Configurare

#### package.json
**Dependencies și scripts npm**:
- React 19.1.0, TypeScript, Vite 6.3.5
- Capacitor 7.3.0 cu plugins GPS și preferences
- Bootstrap 5.3.6 pentru UI components

#### tsconfig.json
**Configurare TypeScript**:
- Strict mode pentru type safety
- Module resolution pentru imports
- Target ES2020 pentru compatibilitate

## Documentația API

### Configurare API

#### Base URL
```
Base URL configurat în aplicație pentru comunicarea cu serverul backend
```

#### Headers Comune

**Pentru autentificare (login):**
```json
{
  "Content-Type": "application/json"
}
```

**Pentru toate celelalte endpoint-uri:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {jwt_token}"
}
```

#### Timeout și Retry
- **Timeout**: 10 secunde pentru toate request-urile
- **Retry Logic**: Maximum 3 încercări pentru request-urile eșuate
- **Exponential Backoff**: Delay crescător între retry-uri

### Endpoint-uri API

#### 1. Autentificare

##### POST /login.php
Autentifică utilizatorul și returnează JWT token.

**Request Body:**
```json
{
  "email": "sofer@company.ro",
  "password": "parola123"
}
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

##### POST /login.php (Logout)
Invalidează token-ul JWT și curăță sesiunea server.

**Request Body:**
```json
{
  "iesire": 1
}
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {jwt_token}"
}
```

#### 2. Gestionare Curse

##### GET /vehicul.php
Încarcă toate cursele disponibile pentru un vehicul specific.

**URL Parameters:**
```
?nr={numar_inmatriculare}
```

**Headers:**
```json
{
  "Authorization": "Bearer {jwt_token}",
  "Content-Type": "application/json"
}
```

**Response Success (200):**
```json
[
  {
    "id": "course_001",
    "name": "Transport Bucuresti - Cluj",
    "departure_location": "Bucuresti",
    "destination_location": "Cluj-Napoca",
    "departure_time": "2025-06-20 08:00:00",
    "arrival_time": "2025-06-20 16:00:00",
    "description": "Transport marfa generala",
    "status": 1,
    "uit": "UIT123456789",
    "ikRoTrans": 1001,
    "codDeclarant": 2001,
    "denumireDeclarant": "Transport SRL",
    "nrVehicul": "B123ABC",
    "dataTransport": "2025-06-20",
    "vama": "Bucuresti",
    "birouVamal": "Bucuresti Nord",
    "judet": "Bucuresti",
    "denumireLocStart": "Depozit Bucuresti",
    "vamaStop": "Cluj",
    "birouVamalStop": "Cluj Est",
    "judetStop": "Cluj",
    "denumireLocStop": "Magazin Cluj"
  }
]
```

**Statusuri Curse:**
- `1`: Disponibil (poate fi începută)
- `2`: Activ (în desfășurare)
- `3`: Pauză (întreruptă temporar)
- `4`: Oprită (finalizată)

#### 2. GPS Tracking

##### POST /gps.php
Transmite coordonatele GPS cu metadate complete.

**Headers:**
```json
{
  "Authorization": "Bearer {jwt_token}",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "lat": 44.426767,
  "lng": 26.102538,
  "timestamp": "2025-06-20T10:30:15Z",
  "viteza": 85,
  "directie": 45,
  "altitudine": 95,
  "baterie": 78,
  "numar_inmatriculare": "B123ABC",
  "uit": "UIT123456789",
  "status": "2",
  "hdop": "1.2",
  "gsm_signal": "4"
}
```

**Parametri GPS:**
- **lat/lng**: Coordonate cu precizie 8 decimale
- **timestamp**: ISO 8601 format cu timezone UTC
- **viteza**: Viteza în km/h (integer)
- **directie**: Direcția în grade (0-360)
- **altitudine**: Altitudinea în metri
- **baterie**: Procentaj baterie (0-100)
- **hdop**: Horizontal Dilution of Precision
- **gsm_signal**: Puterea semnalului GSM (1-5)

### Gestionarea Erorilor

#### Coduri de Status HTTP
- **200**: Success - Request procesat cu succes
- **400**: Bad Request - Date invalide în request
- **401**: Unauthorized - Token JWT invalid sau expirat
- **403**: Forbidden - Acces interzis pentru resursa solicitată
- **404**: Not Found - Endpoint-ul nu există
- **429**: Too Many Requests - Rate limiting activ
- **500**: Internal Server Error - Eroare server

#### Rate Limiting
- **Login**: 5 încercări per minut per IP
- **GPS Data**: 1 request per 5 secunde per vehicul
- **Course Management**: 10 request-uri per minut per token
- **General**: 100 request-uri per minut per token

### Autentificare JWT

#### Token Format
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf3sddassV_adQssw5c
```

#### Gestionare Token
- **Stocare**: Capacitor Preferences (securizat)
- **Expirare**: Verificare automată înaintea fiecărui request
- **Refresh**: Re-login automat când token expiră
- **Cleanup**: Ștergere la logout

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

### 5. Flux Offline/Online
```
Detecție offline → Salvare coordonate local → Progress bar sync → 
Reconectare → Batch sync până la 50 coordonate → Cleanup după success
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
Utilizarea useState și useEffect pentru managementul stării componentelor fără library-uri externe.

### 4. Error Boundaries
Gestionarea erorilor la nivel de componentă cu fallback UI și logging.

## Securitate

### Autentificare
- **JWT Token**: Stocare sigură în Capacitor Preferences
- **Expirare**: Token-urile au expirare și refresh automat
- **Logout securizat**: Curățarea completă a datelor locale

### Validare Input
- **Sanitizare**: Toate inputurile sunt sanitizate
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

## Instalare și Setup

### Cerințe de Sistem

#### Pentru Dezvoltare
- **Node.js**: 20.0+ (recomandat versiunea LTS)
- **npm**: 9.0+ sau **yarn**: 1.22+
- **Android Studio**: Arctic Fox sau mai nou
- **Java JDK**: 17+ pentru compilarea Android
- **Git**: Pentru clonarea repository-ului

#### Pentru Dispozitive Target
- **Android**: API Level 23+ (Android 6.0+)
- **RAM**: Minim 2GB, recomandat 4GB+
- **Storage**: 100MB spațiu liber pentru aplicație
- **GPS**: Hardware GPS obligatoriu
- **Internet**: WiFi sau date mobile pentru sincronizare

### Instalare Rapidă

#### 1. Clonare Repository
```bash
# Clonare din GitHub
git clone https://github.com/emsici/iTrack
cd iTrack

# Verificare structura proiect
ls -la
```

#### 2. Instalare Dependencies
```bash
# Instalare packages Node.js
npm install

# Sau cu yarn
yarn install

# Verificare instalare
npm list --depth=0
```

#### 3. Configurare Capacitor
```bash
# Sincronizare proiect Android
npx cap sync android

# Verificare configurare
npx cap doctor
```

#### 4. Rulare Dezvoltare
```bash
# Start dev server
npm run dev

# Aplicația va fi disponibilă pe http://localhost:5000
```

### Configurare Detaliată

#### Configurare Environment Variables
Creați fișierul `.env` în root-ul proiectului:

```env
# Development Settings
VITE_DEV_MODE=true
VITE_MOCK_API=false

# GPS Configuration
VITE_GPS_INTERVAL=5000
VITE_GPS_HIGH_ACCURACY=true

# Logging
VITE_LOG_LEVEL=debug
VITE_PERSISTENT_LOGS=true
```

#### Configurare Android

##### Android SDK Setup
```bash
# Verificare Android SDK în Android Studio
# Tools > SDK Manager > Android SDK

# SDK Platforms necesare:
# - Android 15.0 (API Level 35) - Target
# - Android 6.0 (API Level 23) - Minimum

# SDK Tools necesare:
# - Android SDK Build-Tools 35.0.0
# - Android Emulator
# - Android SDK Platform-Tools
```

##### Configurare build.gradle
În `android/app/build.gradle`:

```gradle
android {
    namespace "com.euscagency.itrack"
    compileSdk 35

    defaultConfig {
        applicationId "com.euscagency.itrack"
        minSdk 23
        targetSdk 35
        versionCode 180799
        versionName "1807.99"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
             additionalParameters '--no-version-vectors'
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

### Build pentru Producție

#### 1. Build Web Assets
```bash
# Build optimizat pentru producție
npm run build

# Verificare build
ls -la dist/
```

#### 2. Sincronizare Android
```bash
# Copiere assets în proiectul Android
npx cap sync android

# Verificare sincronizare
npx cap copy android
```

#### 3. Build APK în Android Studio
```bash
# Deschidere Android Studio
npx cap open android

# În Android Studio:
# 1. Build > Generate Signed Bundle / APK
# 2. Selectați APK
# 3. Configurați key store pentru signing
# 4. Selectați Release build type
# 5. Build APK
```

#### 4. Script Build Automat (build.bat)
```bash
# Rulare script automat în Windows
build.bat

# Procesul include:
# [1/4] Instalare dependinte
# [2/4] Build proiect
# [3/4] Sincronizare cu Android
# [4/4] Deschidere Android Studio
```

### Testing și Debugging

#### Testing Local
```bash
# Rulare teste unit
npm test

# Testing pe dispozitiv
npx cap sync android
npx cap copy android

# În Android Studio:
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

#### Debugging GPS
Pentru debugging probleme GPS:

```javascript
// Activare debug mode în aplicație
localStorage.setItem('debug_mode', 'true');

// Accesare debug panel
// 50 click-uri pe timestamp în dashboard

// Verificare logs GPS în Chrome DevTools
// chrome://inspect > Inspect device WebView
```

#### Network Debugging
```bash
# Monitoring request-uri API
# Chrome DevTools > Network tab

# Testing offline mode
# Chrome DevTools > Network > Throttling > Offline

# Verificare cache offline
# Chrome DevTools > Storage > Local Storage
```

### Depanare Probleme Comune

#### Probleme Node.js
```bash
# Verificare versiune Node.js
node --version  # Trebuie 20.0+

# Curățare npm cache
npm cache clean --force

# Reinstalare dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Probleme Android
```bash
# Verificare Android SDK
echo $ANDROID_HOME

# Curățare cache Gradle
cd android
./gradlew clean

# Reset Capacitor
npx cap sync android --force
```

#### Probleme GPS
```javascript
// Verificare permisiuni în cod
if (navigator.permissions) {
  navigator.permissions.query({name: 'geolocation'})
    .then(result => console.log('GPS permission:', result.state));
}

// Testing GPS în browser
navigator.geolocation.getCurrentPosition(
  position => console.log('GPS works:', position.coords),
  error => console.error('GPS error:', error)
);
```

## Configurare Android

### Permisiuni Necesare
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Target Configuration
- **Target SDK**: API 35 (Android 15)
- **Min SDK**: API 23 (Android 6.0)
- **Compile SDK**: API 35

## Exemple de Utilizare

### Flow Tipic Utilizare
```typescript
// 1. Autentificare
const loginResponse = await login('sofer@company.ro', 'password');
// → JWT token stocat automat în Capacitor Preferences

// 2. Încărcare curse vehicul
const courses = await getVehicleCourses('B123ABC', token);
// → Lista curselor disponibile pentru vehicul

// 3. Start tracking GPS
await startGPSTracking('course_001', 'B123ABC', 'UIT123', token, 2);
// → Serviciul GPS Android începe tracking în fundal

// 4. Monitoring offline (automat)
// Când nu există internet → coordonate salvate în SharedPreferences
// Când revine internet → sincronizare automată batch

// 5. Analytics curse
const stats = await getCourseStats('course_001');
// → Statistici distanță, timp, viteză calculate cu Haversine
```

### Integrare Components

#### Debug Panel Access
```typescript
// Acces debug panel prin 50 click-uri pe timestamp
const handleTimestampClick = () => {
  // Counter vizibil de la 30-50 click-uri
  // La 50 → Modal overlay cu toate logurile persistent
};
```

#### Offline GPS Monitoring
```tsx
<OfflineGPSMonitor 
  isOnline={navigator.onLine}
  coursesActive={hasActiveCourses}
/>
// → Status indicator automat cu progress bar sincronizare
```

#### Course Statistics Modal
```tsx
<CourseStatsModal
  isOpen={showStats}
  onClose={() => setShowStats(false)}
  courses={activeCourses}
  vehicleNumber="B123ABC"
/>
// → Modal cu analytics comprehensive pentru toate cursele
```

## Versioning și Releases

### Versiunea Curentă: 1807.99 (20 Iunie 2025)
**Features Majore Implementate:**
- **Enterprise Vehicle Input**: Redesign complet pagină introducere vehicul cu branding corporatist
- **Debug Infrastructure**: Panel avansat cu acces prin 50 click-uri și logging persistent
- **5th Analytics Card**: Card "STATISTICI" clickabil cu CourseStatsModal comprehensive
- **Robust Offline Detection**: JavaScript + Android NetworkStateReceiver redundant
- **GPS Optimization**: Transmisie exact la 5 secunde, eliminat WebView GPS duplicates
- **Safe Area Protection**: Padding automat pentru barele native Android/iOS
- **Progress Bar Enhanced**: Animații shimmer și tranziții smooth pentru sync status

**Îmbunătățiri Arhitecturale:**
- NetworkStateReceiver în EnhancedGPSService.java pentru detecție offline robustă
- Service layer pattern cu separarea responsabilităților
- Error boundaries și logging categorization
- Memory management și performance optimization

### Istoric Versiuni
- **v1807.99**: Versiune enterprise completă cu toate funcționalitățile
- **[📋 Consultă Changelog Complet](./changelog.md)** pentru istoric detaliat al tuturor versiunilor și modificărilor

## Deployment și Distribuție

### APK Build pentru Producție
```bash
# 1. Build web assets optimizat
npm run build

# 2. Sincronizare cu proiectul Android
npx cap sync android

# 3. Build APK în Android Studio
npx cap open android
# → Build > Generate Signed Bundle/APK
```

### Requirements pentru Deployment
- **Target SDK**: API 35 (Android 15) pentru features latest
- **Min SDK**: API 23 (Android 6.0) pentru compatibilitate
- **Permissions**: Location, Background Location, Battery Optimization
- **Signing**: Certificat de producție pentru Play Store

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

## Licență și Suport

### Dezvoltat pentru
- **EuscAgency** - Sistem principal de management transport
- **Companii partenere de transport** - Integrare flotă vehiculară
- **Șoferi profesioniști** - Interfață optimizată pentru operațiuni zilnice

### Suport Tehnic
- **Documentație**: README.md completă cu toate specificațiile
- **Debug Tools**: Panel integrat cu logging persistent
- **Network Monitoring**: Detecție robustă offline/online status
- **Performance Analytics**: Monitoring timp real și statistici usage

Pentru suport tehnic avansat sau customizări enterprise, contactați echipa de dezvoltare.

## Probleme Instalare APK

### Google Play Protect blochează instalarea
**Problema**: "A apărut o problemă și verificarea nu a reușit sau a fost întreruptă"

**Explicație**: Google Play Protect este un sistem de securitate Android care verifică automat toate APK-urile instalate din afara Google Play Store. Nu este o problemă din codul aplicației.

**Soluții**:

#### 1. Dezactivare temporară Play Protect
```
1. Deschide Google Play Store
2. Tap pe profilul tău (colțul din dreapta sus)
3. Selectează "Play Protect"
4. Dezactivează "Scan apps with Play Protect"
5. Instalează APK-ul
6. Reactivează Play Protect după instalare
```

#### 2. Permite surse necunoscute
```
Android 8+:
Settings → Apps → Special access → Install unknown apps → 
Chrome/File Manager → Allow from this source

Android 7 și mai vechi:
Settings → Security → Unknown sources → Enable
```

#### 3. Bypass warning Play Protect
```
1. Când apare warning-ul, tap "More details"
2. Tap "Install anyway"
3. Sau direct "Install anyway" dacă opțiunea e disponibilă
```

#### 4. Alternative browser pentru download
```
- Încearcă download cu Firefox sau alt browser
- Sau folosește File Manager pentru instalare
- Verifică că APK-ul este complet descărcat
```

**Important**: Reactivează Play Protect după instalare pentru securitate.

---

*Documentația este actualizată pentru versiunea 1807.99 - Iunie 2025*