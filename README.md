# iTrack - Aplicația Profesională de Urmărire GPS

Aplicație modernă pentru urmărirea vehiculelor de transport în timp real, cu design contemporan și funcționalități GPS avansate. Destinată șoferilor profesioniști pentru gestionarea completă a curselor de transport cu transmisie automată către sistemul ETSM3.

## Funcționalități Avansate

- **Urmărire GPS ultra-precisă** cu transmisie la 5 secunde și coordonate de 8 zecimale
- **Sistem offline complet** - salvează automat coordonatele când nu există internet
- **Sincronizare automată** în batch-uri de 50 coordonate când revine conexiunea
- **Design holografic modern** cu efecte shimmer și glassmorphism contemporan
- **Statistici detaliate curse** - distanță, timp, viteză, opriri pentru fiecare cursă
- **Citire GSM reală** din TelephonyManager Android pentru precizie maximă
- **Serviciu GPS nativ** independent care funcționează când telefonul este blocat
- **Interfață profesională** optimizată pentru șoferii de camioane
- **Sistem triplu de backup** pentru activarea GPS garantată în APK
- **Cleanup complet la logout** - zero date GPS sau coordonate rămase

## Stack Tehnologic Modern

- **React 19.1.0** cu TypeScript pentru interfață avansată și siguranță tipurilor
- **Vite 6.3.5** pentru build rapid și optimizat cu tree-shaking
- **Capacitor 7.3.0** pentru integrare nativă Android completă
- **Servicii GPS native** cu EnhancedGPSService și DirectGPSPlugin
- **Tipografie Inter** cu font-variation-settings pentru claritate maximă
- **CSS modern** cu backdrop-filter, conic-gradient și animații 3D
- **Offline storage** cu SharedPreferences Android pentru persistență

## Instalare Dezvoltare

```bash
# Clonare proiect
git clone https://github.com/emsici/iTrack
cd itrack

# Instalare dependențe
npm install

# Rulare aplicație
npm run dev
```

## Build Android

```bash
# Build pentru producție
npm run build

# Sincronizare Capacitor
npx cap sync android

# Deschidere Android Studio
npx cap open android
```

## Utilizare Aplicație

### 1. Autentificare
- Deschide aplicația
- Introduce email și parolă
- Apasă "Conectare"
- Token-ul se salvează automat

### 2. Încărcare Curse
- Introduce numărul vehiculului (ex: B123ABC)
- Apasă "Încarcă Curse"
- Se afișează lista de transporturi disponibile

### 3. Gestionare Curse
- **Start** - pornește urmărirea GPS și schimbă statusul în "Activ"
- **Pauză** - suspendă temporar cursa
- **Finalizează** - termină cursa definitiv
- **Info** - afișează detalii complete despre cursă

### 4. Urmărire GPS
- GPS-ul pornește automat când apesi "Start"
- Funcționează în fundal chiar dacă minimizezi aplicația
- Transmite coordonate la fiecare 60 secunde
- Include: poziție, viteză, direcție, baterie, semnal GSM

### 5. Logout
- Apasă butonul "Ieșire" din partea de jos
- Sistemul anunță serverul despre deconectare
- Toate datele locale sunt șterse
- Utilizatorul revine la ecranul de login

## Arhitectura GPS

Aplicația folosește servicii Android native pentru urmărire precisă cu sistem offline complet:

- **EnhancedGPSService.java** - serviciu de fundal pentru GPS cu stocare offline
- **DirectGPSPlugin.java** - interfața între JavaScript și Android
- **directAndroidGPS.ts** - controlul GPS din TypeScript
- **offlineGPS.ts** - sistem stocare și sincronizare offline automată
- **OfflineGPSMonitor.tsx** - monitorizare vizuală în timp real

## Funcționalități GPS

### Transmisia Coordonatelor
La fiecare 5 secunde, aplicația trimite coordonate GPS:

```json
{
  "lat": 44.426765,
  "lng": 26.102538,
  "timestamp": "2024-06-20 10:30:00",
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

### Sistem GPS Offline
Aplicația include sistem complet de stocare offline și sincronizare automată:

- **Stocare automată offline**: Coordonatele GPS se salvează local când nu există internet
- **Sincronizare automată**: Când revine conexiunea, coordonatele se trimit automat (50/batch)
- **Monitorizare vizuală în timp real**: 
  - Indicator "OFFLINE" când se pierde internetul
  - Contorul coordonatelor salvate local se actualizează live
  - Progresul sincronizării cu bara de progres animată
  - Dispare automat când sincronizarea e completă

### Separare Sisteme
- **GPS Offline**: Sincronizare automată în fundal
- **Refresh Curselor**: Control manual/auto independent (30s interval)

## Componente Cheie

### Interface Utilizator
- **VehicleScreenProfessional.tsx** - ecranul principal cu design glassmorphism modern
- **CourseDetailCard.tsx** - carduri curse interactive cu detalii expandabile
- **CourseStatsModal.tsx** - modal statistici profesional cu analitică cursă
- **AdminPanel.tsx** - console debug pentru dezvoltatori
- **OfflineGPSMonitor.tsx** - monitorizare GPS offline în timp real

### Servicii Backend
- **directAndroidGPS.ts** - integrare GPS Android nativă
- **offlineGPS.ts** - stocare offline și sincronizare automată
- **courseAnalytics.ts** - calculul statisticilor curselor în timp real
- **api.ts** - comunicare cu serverul de transport ETSM3

### Versiune Actuală
**iTrack v1807.99** - Include monitorizare GPS offline completă și eficiență îmbunătățită

## API Endpoints

### Autentificare
```
POST /login.php
{
  "email": "sofer@firma.com",
  "password": "parola123"
}
```

### Încărcare Curse
```
GET /courses.php?vehicle=B123ABC
Authorization: Bearer <token>
```

### Transmisie GPS
```
POST /gps.php
Authorization: Bearer <token>
{datele_gps}
```

### Logout
```
POST /login.php
Authorization: Bearer <token>
{
  "iesire": 1
}
```

## Structura Proiect

```
itrack/
├── src/
│   ├── components/
│   │   ├── LoginScreen.tsx           # Ecran autentificare
│   │   ├── VehicleScreenProfessional.tsx # Ecran principal
│   │   ├── CourseCard.tsx            # Card cursă
│   │   ├── CourseDetailCard.tsx      # Detalii cursă expandabile
│   │   ├── CourseStatsModal.tsx      # Statistici course
│   │   ├── AdminPanel.tsx            # Console debug mobil
│   │   └── OfflineSyncProgress.tsx   # Progress sincronizare
│   ├── services/
│   │   ├── api.ts                    # Comunicare server
│   │   ├── directAndroidGPS.ts       # Control GPS nativ
│   │   ├── offlineGPS.ts             # Stocare GPS offline
│   │   ├── offlineSyncStatus.ts      # Monitorizare sincronizare
│   │   ├── courseAnalytics.ts        # Statistici cursă
│   │   └── storage.ts                # Stocare locală
│   ├── styles/
│   │   └── professionalVehicleScreen.css # Design glassmorphism
│   └── types/
│       └── index.ts                  # Tipuri TypeScript
├── android/
│   └── app/src/main/java/com/euscagency/itrack/
│       ├── EnhancedGPSService.java   # Serviciu GPS principal
│       ├── DirectGPSPlugin.java      # Plugin Capacitor
│       └── MainActivity.java         # Activitate principală
├── dist/                             # Build final web
└── build/                            # Build Android
```

## Permisiuni Android

Aplicația necesită:
- `ACCESS_FINE_LOCATION` - GPS precis
- `ACCESS_BACKGROUND_LOCATION` - GPS în fundal
- `FOREGROUND_SERVICE` - serviciu persistent
- `WAKE_LOCK` - prevenire sleep
- `INTERNET` - comunicare server

## Configurare Server

URL de bază: `https://www.euscagency.com/etsm3/platforme/transport/apk`

Aplicația se conectează la sistemul ETSM3 pentru:
- Autentificare utilizatori
- Încărcare curse vehicule
- Transmisie coordonate GPS
- Gestionare sesiuni

## Build Scripturi

```bash
# Build 
./build.bat


```

## Statusuri Curse

- **1 - Disponibilă** - cursa poate fi pornită
- **2 - Activă** - urmărire GPS în desfășurare  
- **3 - Pauzată** - temporar oprită
- **4 - Finalizată** - cursa terminată

## Suport

Pentru probleme tehnice sau întrebări despre aplicație, contactați echipa de dezvoltare.

## Informații Aplicație

- **Nume Package:** com.euscagency.itrack
- **Versiune:** 1807.99
- **Platformă:** Android
- **SDK Minim:** API 24 (Android 7.0)
- **Dezvoltat pentru:** EUSC Agency Transport Management

---
*Aplicație dezvoltată pentru gestionarea eficientă a transporturilor și urmărirea în timp real a vehiculelor comerciale.*