# iTrack - Aplicație Profesională de Urmărire GPS pentru Șoferi

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-7.3.0-green.svg)](https://capacitorjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue.svg)](https://www.typescriptlang.org/)
[![Android](https://img.shields.io/badge/Platform-Android-brightgreen.svg)](https://developer.android.com/)

## Prezentare Generală

iTrack este o aplicație profesională de urmărire GPS bazată pe React, proiectată special pentru șoferi să urmărească cursele active de transport în timp real. Construită cu Capacitor pentru deployment nativ Android, aplicația oferă autentificare securizată, gestionarea curselor vehiculelor și transmisia continuă de date GPS în fundal către serverul de management transport ETSM3.

### Caracteristici Principale

- 🚛 **Gestionarea Curselor Vehiculelor** - Încărcare și gestionare curse transport după numărul vehiculului
- 📍 **Urmărire GPS în Timp Real** - Localizare continuă în fundal chiar și când telefonul este blocat
- 🔐 **Autentificare Securizată** - Autentificare bazată pe token cu sesiuni persistente
- 📱 **Integrare Android Nativă** - Serviciu Android nativ complet pentru operarea GPS în fundal
- 🔋 **Optimizat pentru Baterie** - Urmărire GPS eficientă cu wake locks și servicii foreground
- 🌐 **Integrare Server** - Transmisie de date în timp real către sistemul de management transport ETSM3

## Stack Tehnologic

### Frontend
- **React 19.1.0** cu TypeScript pentru dezvoltare type-safe
- **Vite 6.3.5** pentru dezvoltare rapidă și build-uri optimizate
- **Bootstrap 5.3.6** pentru design UI responsive
- **Module CSS** cu efecte de design glassmorphism

### Platformă Mobilă
- **Capacitor 7.3.0** pentru deployment nativ mobile cross-platform
- **Servicii Android Native** pentru urmărire GPS în fundal adevărată
- **Servicii Android Foreground** pentru monitorizarea persistentă a locației

### Integrare Backend
- **API RESTful** integrat cu sistemul de management transport ETSM3
- **Autentificare Bearer Token** pentru comunicare API securizată
- **Format JSON** pentru comunicare eficientă client-server

## Arhitectură

### Sistem de Urmărire GPS
Aplicația folosește o arhitectură GPS simplificată și robustă:

- **SimpleGPSService.java** - Serviciu Android nativ foreground pentru urmărire GPS în fundal
- **SimpleGPSPlugin.java** - Bridge Capacitor pentru comunicarea JavaScript-Android
- **nativeGPS.ts** - Interfață TypeScript pentru controlul serviciului GPS

### Fluxul de Autentificare
1. Credențialele utilizatorului sunt trimise la API-ul de autentificare
2. Serverul returnează Bearer token
3. Token-ul este stocat local folosind Capacitor Preferences
4. Token-ul este folosit pentru toate cererile API ulterioare
5. Logout securizat cu notificare server

### Gestionarea Curselor
1. Utilizatorul introduce numărul de identificare al vehiculului
2. Sistemul încarcă cursele disponibile de la server
3. Utilizatorul poate porni, pausa sau opri cursele individuale
4. Urmărirea GPS începe automat pentru cursele active
5. Actualizări de status în timp real trimise la server

## Instalare și Dezvoltare

### Cerințe Preliminare
- Node.js 20 sau mai recent
- Android Studio cu Android SDK
- Java/OpenJDK pentru compilarea Android

### Configurare
```bash
# Clonare repository
git clone <repository-url>
cd itrack

# Instalare dependențe
npm install

# Pornire server dezvoltare
npm run dev
```

### Build Android
```bash
# Build aplicație web
npm run build

# Sincronizare cu Capacitor
npx cap sync android

# Deschidere în Android Studio
npx cap open android

# Sau build APK direct
./build-android.sh
```

## Configurare

### Variabile de Mediu
Aplicația se conectează la sistemul de management transport ETSM3:
- URL de bază: `https://www.euscagency.com/etsm3/platforme/transport/apk`
- Autentificare: Bazată pe Bearer token
- Endpoint GPS: `gps.php`
- Endpoint Login: `login.php`

### Permisiuni Android
Aplicația necesită următoarele permisiuni:
- `ACCESS_FINE_LOCATION` - Pentru coordonate GPS precise
- `ACCESS_BACKGROUND_LOCATION` - Pentru urmărire când aplicația este minimizată
- `FOREGROUND_SERVICE` - Pentru operare persistentă în fundal
- `WAKE_LOCK` - Pentru a preveni adormirea dispozitivului în timpul urmăririi
- `INTERNET` - Pentru comunicarea cu serverul

## Utilizare

### Autentificare
1. Lansează aplicația
2. Introduce credențialele email și parolă
3. Sistemul validează și stochează token-ul de autentificare
4. Login automat la următoarele lansări ale aplicației

### Pornirea Urmăririi GPS
1. Introduce numărul de identificare al vehiculului
2. Încarcă cursele de transport disponibile
3. Selectează cursa și apasă butonul "Start"
4. Urmărirea GPS începe automat în fundal
5. Coordonatele sunt transmise la fiecare 60 de secunde către server

### Gestionarea Statusului Curselor
- **Disponibilă (1)** - Cursa gata să înceapă
- **Activă (2)** - Urmărire GPS în progres
- **Pauzată (3)** - Temporar suspendată
- **Finalizată (4)** - Cursa completată

### Logout
1. Apasă butonul "Ieșire" din footer
2. Sistemul trimite notificare de logout la server
3. Token-ul de autentificare local este șters
4. Utilizatorul este redirecționat la ecranul de login

## Transmisia Datelor GPS

Aplicația transmite date GPS cuprinzătoare:

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

## Build și Deployment

### Build Dezvoltare
```bash
npm run dev
```

### Build Producție
```bash
npm run build
npx cap sync android
```

### APK Android
```bash
# Build complet (recomandat)
./build-android.sh

# Build rapid dezvoltare
./quick-build.bat
```

## Structura Proiectului

```
itrack/
├── src/
│   ├── components/         # Componente React
│   ├── services/          # Servicii API și GPS
│   ├── types/             # Definiții de tipuri TypeScript
│   └── App.tsx            # Componenta principală a aplicației
├── android/
│   └── app/src/main/java/com/euscagency/itrack/
│       ├── SimpleGPSService.java    # Serviciu GPS nativ
│       ├── SimpleGPSPlugin.java     # Bridge Capacitor
│       └── MainActivity.java        # Activitatea Android principală
├── public/                # Asset-uri statice
└── build/                 # Output build producție
```

## Integrare API

### Autentificare
```
POST /login.php
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "password"
}
```

### Cursele Vehiculului
```
GET /courses.php?vehicle=B123ABC
Authorization: Bearer <token>
```

### Date GPS
```
POST /gps.php
Authorization: Bearer <token>
Content-Type: application/json

{GPS_DATA_OBJECT}
```

### Logout
```
POST /login.php
Authorization: Bearer <token>
Content-Type: application/json

{
  "iesire": 1
}
```

## Contribuții

1. Fork repository-ul
2. Creează o ramură pentru feature (`git checkout -b feature/functionalitate-noua`)
3. Commit modificările (`git commit -am 'Adaugă functionalitate nouă'`)
4. Push către ramură (`git push origin feature/functionalitate-noua`)
5. Creează un Pull Request

## Licență

Acest proiect este software proprietar dezvoltat pentru managementul transportului EUSC Agency.

## Suport

Pentru suport tehnic și întrebări, vă rugăm să contactați echipa de dezvoltare.

---

**Versiunea:** 1807.99  
**Package:** com.euscagency.itrack  
**Platformă:** Android  
**SDK Minim:** API 24 (Android 7.0)