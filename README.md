# iTrack - Aplicație de Urmărire GPS pentru Transport

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-7.3.0-green.svg)](https://capacitorjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue.svg)](https://www.typescriptlang.org/)
[![Android](https://img.shields.io/badge/Platform-Android-brightgreen.svg)](https://developer.android.com/)

## Despre Aplicație

iTrack este o aplicație mobilă pentru urmărirea vehiculelor de transport în timp real. Șoferii folosesc aplicația pentru a gestiona și monitoriza cursele de transport, cu transmisia automată a coordonatelor GPS către sistemul central ETSM3.

## Funcționalități

- **Autentificare securizată** cu email și parolă
- **Încărcare curse** după numărul vehiculului  
- **Start/Pauză/Stop curse** cu butoane simple
- **Urmărire GPS în fundal** chiar când telefonul este blocat
- **Transmisie automată** coordonate la fiecare 60 secunde
- **Logout securizat** cu ștergerea datelor locale

## Tehnologii

- **React 19** - interfața utilizator
- **TypeScript** - cod type-safe
- **Capacitor 7** - deployment nativ Android
- **Bootstrap 5** - design responsive
- **Servicii Android native** - GPS în fundal

## Instalare Dezvoltare

```bash
# Clonare proiect
git clone <url-repository>
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
- **Finalizare** - termină cursa definitiv
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

Aplicația folosește servicii Android native pentru urmărire precisă:

- **SimpleGPSService.java** - serviciu de fundal pentru GPS
- **SimpleGPSPlugin.java** - interfața între JavaScript și Android
- **nativeGPS.ts** - controlul GPS din TypeScript

## Datele Transmise

La fiecare 60 secunde, aplicația trimite:

```json
{
  "lat": 44.426765,
  "lng": 26.102538,
  "timestamp": "2025-06-19 10:30:00",
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
│   │   ├── LoginScreen.tsx      # Ecran autentificare
│   │   ├── VehicleScreen.tsx    # Ecran principal
│   │   ├── CourseCard.tsx       # Card cursă
│   │   └── CourseDetailCard.tsx # Detalii cursă
│   ├── services/
│   │   ├── api.ts              # Comunicare server
│   │   ├── nativeGPS.ts        # Control GPS
│   │   └── storage.ts          # Stocare locală
│   └── types/
│       └── index.ts            # Tipuri TypeScript
├── android/
│   └── app/src/main/java/com/euscagency/itrack/
│       ├── SimpleGPSService.java   # Serviciu GPS
│       ├── SimpleGPSPlugin.java    # Plugin Capacitor
│       └── MainActivity.java       # Activitate principală
└── build/                      # Build final
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
# Build complet Android
./build-android.sh

# Build rapid dezvoltare
./quick-build.bat

# Rebuild Android din zero
./rebuild-android.sh
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