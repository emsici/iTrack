# iTrack GPS - Aplicație de Monitorizare Vehicule

## Descriere

iTrack este o aplicație profesională de monitorizare GPS pentru managementul flotelor de vehicule, dezvoltată special pentru companiile de transport din România. Aplicația oferă urmărire GPS în timp real, gestionarea curselor și capabilități offline pentru colectarea fiabilă a datelor chiar și fără conexiune la internet.

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

## Structura Proiectului

```
src/
├── components/                    # Componente React
│   ├── LoginScreen.tsx           # Ecran autentificare enterprise
│   ├── VehicleScreenProfessional.tsx  # Dashboard principal curse
│   ├── CourseStatsModal.tsx      # Modal statistici detaliate
│   ├── CourseCard.tsx            # Card individual cursă
│   ├── CourseDetailCard.tsx      # Detalii extinse cursă
│   ├── AdminPanel.tsx            # Panel administrare (nefolosit)
│   └── OfflineGPSMonitor.tsx     # Monitor status offline
│
├── services/                     # Servicii aplicație
│   ├── api.ts                   # Comunicare server API
│   ├── directAndroidGPS.ts      # Serviciu GPS nativ Android
│   ├── offlineGPS.ts            # Gestionare GPS offline
│   ├── offlineSyncStatus.ts     # Monitor progres sincronizare
│   ├── courseAnalytics.ts       # Analytics și statistici curse
│   ├── appLogger.ts             # Logging persistent aplicație
│   └── storage.ts               # Stocare locală (tokens)
│
├── types/                       # Tipuri TypeScript
│   └── index.ts                 # Interfețe Course, GPSPosition, etc.
│
├── styles/                      # Stiluri CSS
│   └── professional.css         # Tema enterprise completa
│
└── main.tsx                     # Entry point aplicație
```

```
android/                         # Proiect Android nativ
├── app/src/main/java/com/euscagency/itrack/
│   └── EnhancedGPSService.java  # Serviciu GPS nativ Android
├── app/build.gradle             # Configurare build Android
└── capacitor.config.ts          # Configurare Capacitor
```

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

## Versioning și Releases

### Versiunea Curentă: 1807.99
- Design enterprise pentru input vehicul
- Debug panel cu 50 click-uri și modal overlay
- Al 5-lea card "STATISTICI" cu modal analytics
- GPS transmission optimizat la 5 secunde
- Texte în română și safe-area protection

### Istoric Versiuni
Consultă `changelog.md` pentru istoric complet al versiunilor.

## Licență și Suport

Aplicația iTrack este dezvoltată pentru EuscAgency și companiile partenere de transport.

Pentru suport tehnic sau întrebări, contactați echipa de dezvoltare.