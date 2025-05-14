# Instrucțiuni pentru generarea și instalarea APK-ului iTrack

## Cerințe preliminare

Pentru a genera APK-ul, aveți nevoie de:

1. [Node.js](https://nodejs.org/) instalat (versiunea 16 sau mai recentă)
2. [Android Studio](https://developer.android.com/studio) instalat
3. [JDK 11 sau mai recent](https://www.oracle.com/java/technologies/javase-jdk11-downloads.html)
4. Variabilele de mediu configurate (ANDROID_SDK_ROOT, JAVA_HOME)

## Procesul de generare APK pas cu pas

### Pasul 1: Descărcarea codului sursă

```bash
# Clonarea repository-ului
git clone https://github.com/[username]/itrack.git
cd itrack

# Instalarea dependențelor
npm install
```

### Pasul 2: Actualizarea configurației Capacitor

Verificați fișierul `capacitor.config.ts` și asigurați-vă că are următoarea configurație:

```typescript
// ...
server: {
  androidScheme: 'https',
  cleartext: true
},
// ...
```

### Pasul 3: Configurarea permisiunilor Android

După adăugarea platformei Android dar înainte de a genera APK-ul, trebuie să modificăm AndroidManifest.xml pentru a adăuga permisiunile necesare:

1. Deschideți fișierul `android/app/src/main/AndroidManifest.xml`
2. Înlocuiți conținutul cu următorul manifest complet (sau actualiza-ți cel existent pentru a include aceste elemente importante):

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permisiuni necesare pentru internet și rețea -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Permisiuni pentru localizare GPS - FOARTE IMPORTANTE! -->
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    
    <!-- Hardware necesar pentru funcționare - FOARTE IMPORTANT! -->
    <uses-feature android:name="android.hardware.location" android:required="true" />
    <uses-feature android:name="android.hardware.location.gps" android:required="true" />
    
    <!-- Permisiuni pentru funcționare în fundal -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        android:networkSecurityConfig="@xml/network_security_config">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name="MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>
</manifest>
```

3. Creați directorul `android/app/src/main/res/xml` dacă nu există deja:
```bash
mkdir -p android/app/src/main/res/xml
```

4. Creați fișierul `android/app/src/main/res/xml/network_security_config.xml` cu următorul conținut:
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

### Pasul 4: Construirea și generarea APK-ului

Executați următoarele comenzi în terminal:

```bash
# Construirea aplicației web
npm run build

# Sincronizarea cu Capacitor
npx cap sync

# Adăugarea platformei Android (dacă nu există deja)
npx cap add android

# Construirea APK-ului
cd android
./gradlew assembleDebug
cd ..
```

### Pasul 4: Localizarea APK-ului

După compilare, APK-ul va fi disponibil la următoarea locație:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Pasul 5: Instalarea APK-ului pe dispozitiv

#### Metoda 1: Utilizând ADB (Android Debug Bridge)

Cu dispozitivul conectat prin USB și debugging activat:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

#### Metoda 2: Transfer manual

1. Copiați fișierul APK pe dispozitivul Android (prin email, USB, etc.)
2. Navigați la fișier folosind un manager de fișiere pe dispozitiv
3. Apăsați pe fișier pentru a-l instala (poate fi necesară activarea instalării din surse necunoscute)

## Configurarea pentru producție

Pentru a configura aplicația pentru mediul de producție:

1. Verificați că API URL-urile sunt setate corect în:
   - `client/src/lib/auth.ts` - Pentru autentificare
   - `client/src/lib/gpsService.ts` - Pentru trimiterea coordonatelor GPS
2. Asigurați-vă că `capacitor.config.ts` are configurația corectă pentru server, fără URL-uri către Replit

## Rezolvarea problemelor comune

### Erori de permisiuni Android

Verificați dacă următoarele permisiuni sunt prezente în `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### Erori de conectivitate API

Dacă aplicația nu poate comunica cu API-ul:

1. Verificați că toate URL-urile sunt corect configurate
2. Asigurați-vă că headerele de autorizare sunt trimise corect
3. Activați `android:usesCleartextTraffic="true"` în AndroidManifest.xml dacă API-ul folosește HTTP

### Erori la compilare

Dacă întâmpinați erori la compilare:

1. Verificați că aveți versiunea corectă de JDK (11+)
2. Asigurați-vă că ANDROID_SDK_ROOT și JAVA_HOME sunt setate corect
3. Rulați `./gradlew clean` înainte de a reîncerca compilarea

## Testarea aplicației

După instalare, verificați următoarele funcționalități:

1. Autentificarea funcționează corect
2. GPS-ul poate fi accesat și coordonatele sunt trimise
3. Aplicația continuă să trimită date în fundal
4. Notificările vocale funcționează
5. Statisticile sunt afișate corect

## Notă pentru iOS

Procesul pentru iOS este similar, dar necesită un Mac cu Xcode instalat:

```bash
npx cap add ios
npx cap open ios
```

Apoi construiți și rulați aplicația din Xcode.