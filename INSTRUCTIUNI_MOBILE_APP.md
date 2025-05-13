# Instrucțiuni pentru construirea aplicației mobile iTrack

Această aplicație a fost configurată pentru a putea fi rulată ca aplicație mobilă pe platformele Android și iOS folosind Capacitor.

## Metoda 1: Descărcare directă a APK-ului

Pentru a instala rapid aplicația pe un dispozitiv Android:

1. Descărcați APK-ul de la: https://github.com/eusc/itrack/releases/download/v1.0/itrack-v1.0.apk
2. Pe dispozitivul Android, permiteți instalarea din surse necunoscute în setări
3. Deschideți fișierul APK descărcat și instalați aplicația
4. La prima pornire, acordați aplicației toate permisiunile solicitate (locație, etc.)

🔴 Dacă link-ul de mai sus nu funcționează, folosiți Metoda 2 pentru a construi APK-ul local.

## Pași pentru construirea aplicației mobile

### Pasul 1: Construiți aplicația web
```bash
npm run build
```

### Pasul 2: Sincronizați proiectul cu Capacitor
```bash
npx cap sync
```

### Pasul 3: Adăugați platforma Android
```bash
npx cap add android
```

### Pasul 4: Deschideți proiectul în Android Studio
```bash
npx cap open android
```

### Pasul 5: Construiți și rulați aplicația pe un dispozitiv sau emulator
Din Android Studio:
1. Selectați un dispozitiv sau emulator din lista de dispozitive
2. Apăsați butonul "Run" (triunghiul verde)

## Modificări aduse pentru compatibilitate mobilă

Am implementat următoarele modificări pentru a asigura funcționarea corectă a aplicației pe dispozitive mobile:

1. **Integrare Capacitor**: Am adăugat Capacitor pentru a putea converti aplicația web într-o aplicație nativă.
2. **Acces la Geolocation**: Am implementat un serviciu compatibil cross-platform pentru accesul la GPS.
3. **Background tracking**: Aplicația poate continua să trimită coordonate GPS chiar și când rulează în fundal.
4. **UI Adaptat**: Interfața a fost optimizată pentru experiența mobilă.

## Permisiuni necesare

Pe Android, aplicația va cere următoarele permisiuni:
- Acces la locație precisă
- Acces la locație în fundal
- Acces la rețea

## Notă pentru iOS

Pentru a construi aplicația pentru iOS, urmați pași similari, doar că la pasul 3 și 4, înlocuiți "android" cu "ios":

```bash
npx cap add ios
npx cap open ios
```

Veți avea nevoie de un Mac cu Xcode instalat pentru a construi versiunea iOS.

## Troubleshooting

Dacă întâmpinați probleme:

1. Asigurați-vă că aveți Java JDK și Android SDK instalate
2. Verificați că toate dependențele sunt instalate: `npm install`
3. Curățați cache-ul: `npx cap clean`
4. Reîncercați sincronizarea: `npx cap sync`

### Probleme de conectivitate API

Dacă aplicația nu se poate conecta la API-ul extern când rulează pe dispozitiv:

1. Verificați permisiunile de rețea în aplicație
2. Asigurați-vă că aplicația are acces la internet
3. Verificați dacă API-ul extern acceptă solicitări de pe dispozitivul mobil (CORS)
4. În Android Studio, verificați logurile de rețea pentru a vedea dacă există erori de conectivitate
5. Verificați în fișierul `android/app/src/main/AndroidManifest.xml` că aveți permisiunile necesare și configurația pentru trafic necriptat:

   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
   <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
   <uses-permission android:name="android.permission.WAKE_LOCK" />
   
   <!-- În secțiunea <application> -->
   <application
       android:usesCleartextTraffic="true"
       android:networkSecurityConfig="@xml/network_security_config">
   </application>
   ```

6. Creați un fișier `android/app/src/main/res/xml/network_security_config.xml` cu următorul conținut:
   
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <network-security-config>
       <base-config cleartextTrafficPermitted="true">
           <trust-anchors>
               <certificates src="system" />
           </trust-anchors>
       </base-config>
       <domain-config cleartextTrafficPermitted="true">
           <domain includeSubdomains="true">www.euscagency.com</domain>
       </domain-config>
   </network-security-config>
   ```

7. Asigurați-vă că în `capacitor.config.ts` aveți configurația corectă:
   ```typescript
   server: {
     androidScheme: 'https',
     cleartext: true
   },
   android: {
     allowMixedContent: true,
     webContentsDebuggingEnabled: true,
     // ...
   }
   ```

### Probleme cu autentificarea

Dacă autentificarea nu funcționează pe dispozitivul mobil:

1. Verificați în consola Android Studio dacă există erori la încercarea de autentificare
2. Asigurați-vă că folosiți aceleași credențiale care funcționează în versiunea web
3. Verificați că URL-ul API-ului extern este corect în configurație (`https://www.euscagency.com/etsm3/platforme/transport/apk/login.php`)
4. Verificați dacă la apelarea API-ului de autentificare se trimit datele în format corect (fără Content-Type header)