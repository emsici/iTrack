# 📁 Structura Completă Proiect iTrack GPS

*Documentație detaliată a arhitecturii și organizării fișierelor aplicației*

---

## 🏗️ STRUCTURA DIRECTORII PRINCIPALE

```
iTrack/
├── android/                    # Proiect Android nativ Capacitor
├── src/                       # Codul sursă React/TypeScript
├── dist/                      # Build output pentru producție
├── node_modules/              # Dependințe npm
└── fișiere_documentație.md    # Fișiere documentație în root
```

---

## 📱 ANDROID NATIVE (android/)

### Structura Java Native
```
android/app/src/main/java/com/euscagency/itrack/
├── BackgroundGPSService.java     # Serviciu GPS persistent cu ScheduledExecutorService
├── MainActivity.java             # Activity principal cu bridge JavaScript
└── BackgroundRefreshService.java # Serviciu auxiliar refresh (backup)
```

### Configurații Android
```
android/
├── app/
│   ├── build.gradle              # Configurație build Android
│   ├── capacitor.build.gradle    # Integrare Capacitor
│   └── src/main/
│       ├── AndroidManifest.xml   # Permisiuni și servicii declarate
│       └── assets/
│           ├── capacitor.config.json
│           └── capacitor.plugins.json
├── gradle/                       # Gradle wrapper
├── settings.gradle               # Setări proiect Android
└── variables.gradle              # Variabile globale
```

---

## ⚛️ REACT FRONTEND (src/)

### Componente UI (src/components/)
```
components/
├── LoginScreen.tsx               # Ecran autentificare cu management JWT
├── VehicleScreenProfessional.tsx # Ecran principal - management vehicule/curse
├── VehicleNumberDropdown.tsx     # Dropdown vehicule cu istoric inteligent
├── CourseDetailCard.tsx          # Card prezentare cursă individuală
├── CourseDetailsModal.tsx        # Modal detalii complete cursă
├── CourseStatsModal.tsx          # Modal statistici cu formula Haversine
├── RouteMapModal.tsx             # Modal hartă Leaflet pentru traseu
├── OfflineSyncMonitor.tsx        # Monitor progres sincronizare offline
├── AdminPanel.tsx                # Panel debug cu export log-uri
├── AboutModal.tsx                # Modal informații despre aplicație
├── SettingsModal.tsx             # Modal configurări aplicație
└── ToastNotification.tsx         # Sistem notificări toast
```

### Servicii Core (src/services/)
```
services/
├── api.ts                        # Comunicare cu backend PHP prin CapacitorHttp
├── storage.ts                    # Persistență locală cu Capacitor Preferences
├── offlineGPS.ts                 # Management coordonate offline cu batch sync
├── courseAnalytics.ts            # Analiză statistici curse (formula Haversine)
├── appLogger.ts                  # Logging aplicație cu categorii multiple
└── themeService.ts               # Management teme cu persistență automată
```

### Utilitare și Tipuri
```
src/
├── hooks/
│   └── useToast.ts               # Hook personalizat pentru toast notifications
├── types/
│   └── index.ts                  # Definții TypeScript pentru aplicație
├── styles/
│   └── professional.css         # Stiluri CSS cu glassmorphism effects
├── App.tsx                       # Componenta root cu routing logic
└── main.tsx                      # Entry point React cu strict mode
```

---

## ⚙️ CONFIGURAȚII BUILD & DEVELOPMENT

### Fișiere Configurare Root
```
├── package.json                  # Dependințe npm și script-uri build
├── package-lock.json             # Lock file pentru versiuni exacte
├── capacitor.config.ts           # Configurație Capacitor pentru mobile
├── tsconfig.json                 # Configurație TypeScript cu strict mode
├── tsconfig.node.json            # Configurație TypeScript pentru Vite
├── vite.config.ts                # Configurație Vite build tool
├── index.html                    # Template HTML principal
└── replit.md                     # Documentație arhitectură și preferințe
```

### Build Scripts
```
├── build.bat                     # Script build Windows
├── start.bat                     # Script start Windows
├── start.sh                      # Script start Unix/Linux
└── dist/                         # Output build pentru producție
```

---

## 📄 DOCUMENTAȚIE COMPLETĂ

### Documentații Business și Tehnice (Root Directory)
```
├── ANALIZA_TEHNICA_COMPLETA_iTrack.md    # Analiză tehnică exhaustivă
├── PREZENTARE_BUSINESS_iTrack.md         # Prezentare business pentru stakeholderi
├── PREZENTARE_CLIENTI_iTrack.md          # Prezentare pentru clienții finali
├── POVESTEA_iTrack.md                    # Narațiune dezvoltare aplicație
├── STRUCTURA_COMPLETA_iTrack.md          # Acest fișier - structura completă
├── README.md                             # Documentație generală cu link-uri
├── replit.md                             # Arhitectura sistemului și preferințe
├── changelog.md                          # Istoric modificări versiuni
└── TEST_CONFLICT_SCENARIO.md             # Scenarii testare conflicte
```

**📝 Note:** Toate fișierele de documentație sunt în directorul root pentru acces direct.

---

## 🔧 DEPENDINȚE EXTERNE

### Capacitor Core (Mobile Native Bridge)
```json
"@capacitor/core": "6.2.1",
"@capacitor/android": "6.2.1",
"@capacitor/cli": "6.2.1",
"@capacitor/device": "6.0.2",
"@capacitor/geolocation": "6.1.1",
"@capacitor/network": "6.1.1",
"@capacitor/preferences": "6.1.1",
"@capacitor/status-bar": "6.1.1"
```

### React Ecosystem
```json
"react": "18.3.1",
"react-dom": "18.3.1",
"typescript": "5.8.4",
"vite": "6.3.5",
"@vitejs/plugin-react": "4.4.1"
```

### UI/UX Libraries
```json
"bootstrap": "5.3.3",
"leaflet": "1.9.4",
"@types/leaflet": "1.9.19",
"memoizee": "0.4.17",
"openid-client": "6.2.1"
```

---

## 🌐 API ENDPOINTS BACKEND

### Servicii Web PHP
```
Backend ETSM Production:
├── login.php          # POST - Autentificare utilizator
├── logout.php         # POST - Deconectare securizată
├── vehicul.php        # GET  - Lista curse pentru vehicul
├── gps.php            # POST - Transmisie coordonate GPS
└── rezultate.php      # GET  - Verificare rezultate transmisie
```

Base URL: `https://www.euscagency.com/etsm_prod/platforme/transport/apk/`

---

## 📊 METRICI PROIECT

### Dimensiuni Codebase
- **Total Componente React**: 17 componente specializate
- **Servicii TypeScript**: 6 servicii core + 1 hook personalizat
- **Fișiere Android Java**: 3 fișiere principale
- **Fișiere Configurare**: 8 fișiere principale
- **Documentații**: 12+ fișiere documentație completă

### Arhitectură
- **Pattern Principal**: Component-based architecture cu separation of concerns
- **State Management**: React useState/useEffect cu persistență locală
- **API Integration**: CapacitorHttp cu fallback și retry logic
- **Threading**: Java native cu ScheduledExecutorService și ThreadPoolExecutor
- **Securitate**: JWT tokens cu Capacitor Preferences encryption

Această structură asigură scalabilitatea, mentenabilitatea și performanța optimă pentru aplicația iTrack GPS enterprise.