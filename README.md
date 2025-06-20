# iTrack GPS - Aplicație de Monitorizare Vehicule

## Descriere

iTrack GPS este o aplicație enterprise avansată pentru monitorizarea și managementul flotelor de vehicule comerciale, dezvoltată special pentru companiile de transport din România. Aplicația combină tehnologiile web moderne React cu servicii GPS native Android pentru a oferi o soluție completă și robustă de tracking vehicular.

### Arhitectura Hibridă
- **Frontend React**: Interfață utilizator modernă cu TypeScript și design enterprise
- **Serviciu GPS Nativ Android**: Tracking continuu în fundal cu optimizare baterie
- **Capacități Offline Robuste**: Cache automat coordonate cu sincronizare inteligentă
- **Analytics în Timp Real**: Calcule statistici Haversine cu monitoring performanță

### Funcționalități Enterprise
- **Detecție Offline Redundantă**: JavaScript + Android NetworkStateReceiver
- **Debug Infrastructure**: Panel avansat cu logging persistent (50 click-uri)
- **Course Analytics**: Statistici comprehensive cu algoritmi de calcul distanță
- **Professional UI**: Design glassmorphism cu safe-area protection

## Caracteristici Principale

### 🚛 Urmărire GPS Avansată
- **Serviciu GPS nativ Android** cu operare continuă în fundal
- **Transmisie coordonate** la interval de 5 secunde cu precizie de 8 decimale
- **Operare în fundal** când telefonul este blocat
- **Optimizare baterie** cu serviciu foreground și notificări
- **GPS singular** - doar serviciul Android nativ transmite (WebView GPS dezactivat pentru evitarea duplicatelor)

### 📱 Capabilități Offline
- **Cache automat** al coordonatelor când internetul nu este disponibil
- **Sincronizare în lot** - până la 50 de coordonate când conexiunea revine
- **Stocare persistentă** în SharedPreferences Android
- **Monitor vizual** al statusului offline cu progress în timp real
- **Auto-sync** transparent când conexiunea este restabilită

### 🎯 Gestionare Curse Profesională
- **Încărcare curse** specifice vehiculului cu validare
- **Managementul statusurilor** în timp real (Disponibil, Activ, Pauză, Oprit)
- **Analytics course** cu distanță, timp și calcule de viteză
- **Interfață șofer** optimizată pentru operațiuni de transport

### 📊 Analytics și Statistici
- **Dashboard cu 5 carduri**: Total Curse, Activ, Pauză, Disponibil, Statistici
- **Modal statistici detaliate** cu analytics comprehensive
- **Calcul automat**: distanță parcursă, timp de conducere, viteză medie/maximă
- **Rapoarte în timp real** pentru management și clienți

### 🔧 Panel de Debug
- **Acces debug** prin 50 click-uri pe timestamp (counter de la 30)
- **Modal overlay** cu toate logurile aplicației persistent
- **Funcții utile**: Copiază logs, Refresh data
- **Logging persistent** - logurile nu se șterg la logout

### 🏢 Design Enterprise
- **Pagină login** profesională cu branding corporatist
- **Input vehicul** redesignat cu aspect business
- **Tema dark** cu glassmorphism și animații moderne
- **Safe-area protection** pentru barele native Android
- **Design responsive** pentru toate dimensiunile de ecran

## Arhitectura Tehnică

### Frontend
```
React 19.1.0 + TypeScript
├── Vite 6.3.5 (build tool)
├── Bootstrap 5.3.6 (UI framework)
├── Capacitor 7.3.0 (mobile platform)
└── CSS modern cu backdrop-filter și animații
```

### Backend Integration
```
API RESTful
├── Base URL: https://www.euscagency.com/etsm3/platforme/transport/apk
├── Autentificare: JWT token cu persistență
├── Format date: JSON pentru toate comunicările
└── Endpoints: login, logout, getVehicleCourses, sendGPSData
```

### Mobile Platform
```
Android (target principal)
├── API Level 35 (Android 15) target
├── API Level 23 (Android 6.0) minimum
├── Capacitor pentru integrare nativă
└── Capabilități iOS prin Capacitor
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

## Fluxurile de Date

### 1. Fluxul de Autentificare
```
Utilizator → Login Screen → Validare credențiale → JWT token → Stocare locală → Auto-login
```

### 2. Fluxul GPS Tracking
```
Start cursă → Activare serviciu GPS → Colectare coordonate (5s) → Transmisie timp real
              ↓ (offline)
          Stocare locală → Sincronizare automată (când online)
```

### 3. Fluxul Gestionare Curse
```
Număr vehicul → Încărcare curse → Gestionare status → Analytics tracking → Finalizare
```

## API Endpoints

### Autentificare
- `POST /api_login.php` - Login utilizator
- `POST /api_logout.php` - Logout utilizator

### Gestionare Curse
- `GET /get_courses_by_vehicle.php?vehicle={nr}` - Încărcare curse vehicul
- `POST /update_course_status.php` - Actualizare status cursă

### GPS Tracking
- `POST /gps.php` - Transmisie coordonate GPS

## Configurare și Rulare

### Dezvoltare Locală
```bash
# Instalare dependențe
npm install

# Rulare server dezvoltare
npm run dev

# Server disponibil pe http://localhost:5000
```

### Build Android
```bash
# Build web assets
npm run build

# Sincronizare Capacitor
npx cap sync android

# Deschidere Android Studio
npx cap open android

# Build APK din Android Studio
```

## Funcționalități Avansate

### Debug și Logging
- **Activare debug**: 50 click-uri pe timestamp
- **Counter vizibil**: de la 30 la 50 click-uri
- **Modal debug**: overlay cu toate logurile
- **Persistență logs**: păstrare între sesiuni
- **Export logs**: funcție copiere în clipboard

### Analytics Curse
- **Tracking automat**: distanță, timp, viteză pentru fiecare cursă
- **Calcule în timp real**: folosind formula Haversine pentru distanță
- **Statistici cumulative**: pentru toate cursele vehiculului
- **Rapoarte detaliate**: în modal dedicat statistici

### Gestionare Offline
- **Detecție conexiune**: monitor automat status online/offline
- **Cache inteligent**: coordonate GPS salvate automat offline
- **Progres vizual**: indicator sincronizare cu progres în timp real
- **Recuperare automată**: re-transmisie coordonate când conexiunea revine

## Securitate și Performanță

### Securitate
- **Token JWT**: autentificare sigură cu expirare
- **Stocare locală**: Capacitor Preferences pentru date sensibile
- **Validare input**: sanitizare toate inputurile utilizator
- **HTTPS**: toate comunicările API securizate

### Performanță
- **Optimizare baterie**: serviciu foreground cu notificări eficiente
- **Interval GPS optim**: 5 secunde pentru echilibru precizie/baterie
- **Cache inteligent**: evitarea request-urilor inutile
- **Lazy loading**: încărcare componente la cerere

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
- Consultă `changelog.md` pentru istoric detaliat al versiunilor

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

## Licență și Suport

### Dezvoltat pentru
- **EuscAgency** - Sistem principal de management transport
- **Companii partenere de transport** - Integrare flotă vehiculară
- **Șoferi profesioniști** - Interfață optimizată pentru operațiuni zilnice

### Suport Tehnic
- **Documentație**: README.md, ARCHITECTURE.md, API.md, SETUP.md
- **Debug Tools**: Panel integrat cu logging persistent
- **Network Monitoring**: Detecție robustă offline/online status
- **Performance Analytics**: Monitoring timp real și statistici usage

Pentru suport tehnic avansat sau customizări enterprise, contactați echipa de dezvoltare.