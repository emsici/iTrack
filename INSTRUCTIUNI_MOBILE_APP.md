# Instrucțiuni pentru aplicația mobilă iTrack

## Configurare și construire

### Pregătire mediu de dezvoltare

1. Instalați Node.js (v20 sau mai recent) și npm
2. Clonați repository-ul: `git clone <url_repository>`
3. Instalați dependențele: `npm install`

### Configurare Capacitor

1. Adăugați platformele Capacitor:
   ```bash
   npx cap add android
   npx cap add ios  # Doar pentru dezvoltare pe Mac
   ```

2. Construiți aplicația web:
   ```bash
   npm run build
   ```

3. Copiați fișierele construite în proiectul Capacitor:
   ```bash
   npx cap sync
   ```

### Construire APK Android

1. Deschideți proiectul Android în Android Studio:
   ```bash
   npx cap open android
   ```

2. În Android Studio:
   - Asigurați-vă că aveți SDK-ul Android instalat (API level 33 sau mai recent)
   - Configurați un dispozitiv virtual sau conectați un dispozitiv fizic
   - Click pe "Build" > "Build Bundle(s) / APK(s)" > "Build APK(s)"
   - APK-ul va fi generat în `android/app/build/outputs/apk/debug/app-debug.apk`

Alternativ, puteți folosi script-ul automatizat:
```bash
./build-apk.sh
```

## Configurații importante

### AndroidManifest.xml

Asigurați-vă că `android/app/src/main/AndroidManifest.xml` conține permisiunile necesare:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

De asemenea, aplicația trebuie să permită traficul necriptat:

```xml
<application
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config">
    <!-- ... -->
</application>
```

### Network Security Config

Creați sau modificați `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">euscagency.com</domain>
    </domain-config>
</network-security-config>
```

### Capacitor Config

În `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.euscagency.itrack',
  appName: 'iTrack',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
```

## Rezolvarea problemelor

### Probleme CORS

Dacă întâmpinați probleme CORS în aplicația mobilă, asigurați-vă că folosiți plugin-ul `@capacitor-community/http` pentru comunicarea cu API-ul extern. Verificați documentul `CORS_MOBILE_IMPLEMENTATION.md` pentru detalii complete.

### Probleme de rețea

1. Verificați că dispozitivul are conexiune la internet
2. Verificați că aplicația are permisiunile necesare pentru a accesa internetul
3. Verificați că serverul API este accesibil
4. Asigurați-vă că configurația de securitate a rețelei permite traficul către domeniul API-ului
5. Verificați logurile pentru a vedea erorile specifice

### Probleme GPS și locație

1. Asigurați-vă că serviciile de localizare sunt activate pe dispozitiv
2. Verificați că aplicația are permisiunile necesare pentru a accesa locația
3. Testați într-o zonă cu semnal GPS bun
4. Verificați că timpul este sincronizat corect pe dispozitiv
5. Verificați că aplicația are permisiunea de a rula în background, altfel tracking-ul se va opri când aplicația este minimizată