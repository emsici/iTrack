# Implementare soluție CORS pentru aplicația mobilă iTrack

## Problema

Aplicația mobilă (APK) nu poate comunica direct cu API-ul extern din cauza restricțiilor CORS (Cross-Origin Resource Sharing) atunci când rulează în WebView-ul Capacitor. Acest lucru împiedică funcționalități esențiale precum autentificarea, înregistrarea vehiculului și trimiterea coordonatelor GPS.

## Soluția implementată

Am implementat o soluție care permite aplicației să facă apeluri directe către API-ul extern atunci când rulează pe un dispozitiv nativ (Android/iOS), evitând astfel problemele de CORS.

### 1. Instalarea plugin-ului Capacitor HTTP

```bash
npm install @capacitor-community/http
npx cap sync
```

### 2. Detectarea platformei

În loc să folosim proxy-ul pentru toate cererile, detectăm dacă aplicația rulează pe un dispozitiv nativ:

```typescript
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
```

### 3. Utilizarea plugin-ului pentru cereri HTTP pe dispozitive native

Atunci când aplicația rulează pe un dispozitiv nativ, folosim plugin-ul `@capacitor-community/http` pentru a face cereri directe către API-ul extern:

```typescript
import { Http } from '@capacitor-community/http';

if (isNative) {
  // Pe dispozitiv nativ folosim plugin-ul pentru a evita CORS
  const httpResponse = await Http.request({
    method: 'POST',
    url: 'https://www.euscagency.com/etsm3/platforme/transport/apk/login.php',
    data: payload,
    // Headers specifice cererii
  });
  
  // Procesăm răspunsul
  if (httpResponse.status >= 200 && httpResponse.status < 300) {
    // Succes
  }
} else {
  // În browser, continuăm să folosim proxy-ul
  const response = await fetch('/api/login', {...});
}
```

### 4. Fișiere modificate

Am actualizat următoarele fișiere pentru a implementa această soluție:

1. `client/src/lib/auth.ts` - Serviciul de autentificare și informații vehicul
2. `client/src/lib/gpsService.ts` - Serviciul pentru trimiterea coordonatelor GPS

### 5. URL-uri API externe configurate

Am configurat URL-urile API externe pentru a fi folosite direct pe dispozitive native:

- Login: `https://www.euscagency.com/etsm3/platforme/transport/apk/login.php`
- Informații vehicul: `https://www.euscagency.com/etsm3/platforme/transport/apk/vehicul.php?nr={numar}`
- Trimitere GPS: `https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php`

## Construirea și testarea

După aceste modificări, trebuie să:

1. Reconstruiți aplicația Android: `npx cap sync android`
2. Deschideți proiectul în Android Studio
3. Construiți și rulați aplicația pe un dispozitiv fizic sau emulator

## Note importante

- Asigurați-vă că dispozitivul are conexiune la internet
- Verificați că toate permisiunile necesare sunt acordate (locație, rețea)
- Dacă întâmpinați probleme, verificați logurile pentru a vedea erorile specifice