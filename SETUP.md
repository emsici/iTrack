# iTrack GPS - Ghid de Instalare și Configurare

## Cerințe de Sistem

### Pentru Dezvoltare
- **Node.js**: 18.0+ (recomandat 20.x)
- **npm**: 9.0+ sau **yarn**: 1.22+
- **Android Studio**: Arctic Fox sau mai nou
- **Java JDK**: 17 (pentru Android build)
- **Git**: Pentru clonarea repository-ului

### Pentru Dispozitive Target
- **Android**: API Level 23+ (Android 6.0+)
- **RAM**: Minim 2GB, recomandat 4GB+
- **Storage**: 100MB space liber pentru aplicație
- **GPS**: Hardware GPS obligatoriu
- **Internet**: WiFi sau date mobile pentru sincronizare

## Instalare Rapidă

### 1. Clonare Repository
```bash
# Clonare din GitHub
git clone https://github.com/your-org/itrack-gps.git
cd itrack-gps

# Verificare structura proiect
ls -la
```

### 2. Instalare Dependencies
```bash
# Instalare packages Node.js
npm install

# Sau cu yarn
yarn install

# Verificare instalare
npm list --depth=0
```

### 3. Configurare Capacitor
```bash
# Sincronizare proiect Android
npx cap sync android

# Verificare configurare
npx cap doctor
```

### 4. Rulare Dezvoltare
```bash
# Start dev server
npm run dev

# Aplicația va fi disponibilă pe http://localhost:5000
```

## Configurare Detaliată

### Configurare Environment Variables
Creați fișierul `.env` în root-ul proiectului:

```env
# API Configuration
VITE_API_BASE_URL=https://www.euscagency.com/etsm3/platforme/transport/apk
VITE_API_TIMEOUT=10000

# Development Settings
VITE_DEV_MODE=true
VITE_MOCK_API=false

# GPS Configuration
VITE_GPS_INTERVAL=5000
VITE_GPS_HIGH_ACCURACY=true

# Logging
VITE_LOG_LEVEL=debug
VITE_PERSISTENT_LOGS=true
```

### Configurare Android

#### 1. Android SDK Setup
```bash
# Verificare Android SDK în Android Studio
# Tools > SDK Manager > Android SDK

# SDK Platforms necesare:
# - Android 15.0 (API Level 35) - Target
# - Android 6.0 (API Level 23) - Minimum

# SDK Tools necesare:
# - Android SDK Build-Tools 35.0.0
# - Android Emulator
# - Android SDK Platform-Tools
# - Google Play Services
```

#### 2. Configurare Permisiuni
Fișierul `android/app/src/main/AndroidManifest.xml` trebuie să conțină:

```xml
<!-- Permisiuni GPS -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Permisiuni Serviciu -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />

<!-- Permisiuni Baterie -->
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Permisiuni Internet -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

#### 3. Configurare build.gradle
În `android/app/build.gradle`:

```gradle
android {
    namespace "com.euscagency.itrack"
    compileSdk 35

    defaultConfig {
        applicationId "com.euscagency.itrack"
        minSdk 23
        targetSdk 35
        versionCode 180799
        versionName "1807.99"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
             additionalParameters '--no-version-vectors'
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

### Configurare GPS Nativ

#### 1. Serviciu GPS Enhanced
Fișierul `android/app/src/main/java/com/euscagency/itrack/EnhancedGPSService.java` trebuie configurat:

```java
public class EnhancedGPSService extends Service {
    private static final int LOCATION_INTERVAL = 5000; // 5 secunde
    private static final float LOCATION_DISTANCE = 0f; // Update la fiecare schimbare
    private static final int NOTIFICATION_ID = 12345;
    
    // Configurare LocationManager
    private LocationManager locationManager;
    private LocationListener locationListener;
}
```

#### 2. Configurare Notificări
Pentru serviciul foreground, configurați notificările în Android:

```java
private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "iTrack GPS Tracking",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Serviciu GPS pentru monitorizare vehicule");
        
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(channel);
    }
}
```

## Build pentru Producție

### 1. Build Web Assets
```bash
# Build optimizat pentru producție
npm run build

# Verificare build
ls -la dist/
```

### 2. Sincronizare Android
```bash
# Copiere assets în proiectul Android
npx cap sync android

# Verificare sincronizare
npx cap copy android
```

### 3. Build APK în Android Studio
```bash
# Deschidere Android Studio
npx cap open android

# În Android Studio:
# 1. Build > Generate Signed Bundle / APK
# 2. Selectați APK
# 3. Configurați key store pentru signing
# 4. Selectați Release build type
# 5. Build APK
```

### 4. Optimizări ProGuard
În `android/app/proguard-rules.pro`:

```proguard
# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }

# Keep GPS Service
-keep class com.euscagency.itrack.EnhancedGPSService { *; }

# Keep React Native bridge
-keep class com.facebook.react.** { *; }

# Obfuscate sensitive strings
-adaptclassstrings
-obfuscationdictionary dictionary.txt
```

## Testing și Debugging

### 1. Testing Local
```bash
# Rulare teste unit
npm test

# Rulare teste integrazione
npm run test:integration

# Coverage report
npm run test:coverage
```

### 2. Testing pe Dispozitiv
```bash
# Build development APK
npx cap sync android
npx cap copy android

# În Android Studio:
# Build > Build Bundle(s) / APK(s) > Build APK(s)
# Instalare pe dispozitiv pentru testing
```

### 3. Debugging GPS
Pentru debugging probleme GPS:

```javascript
// Activare debug mode în aplicație
localStorage.setItem('debug_mode', 'true');

// Accesare debug panel
// 50 click-uri pe timestamp în dashboard

// Verificare logs GPS în Chrome DevTools
// chrome://inspect > Inspect device WebView
```

### 4. Network Debugging
```bash
# Monitoring request-uri API
# Chrome DevTools > Network tab

# Testing offline mode
# Chrome DevTools > Network > Throttling > Offline

# Verificare cache offline
# Chrome DevTools > Storage > Local Storage
```

## Configurare Server

### 1. Server Requirements
Pentru backend API (dacă instalați propriul server):

```bash
# PHP 8.0+
sudo apt install php8.0 php8.0-curl php8.0-json php8.0-mysql

# Apache sau Nginx
sudo apt install apache2

# MySQL pentru database
sudo apt install mysql-server
```

### 2. API Endpoint Configuration
În fișierul de configurare PHP:

```php
<?php
// config.php
define('API_BASE_URL', 'https://your-domain.com/api');
define('JWT_SECRET', 'your-secret-key-here');
define('DB_HOST', 'localhost');
define('DB_NAME', 'itrack_gps');
define('DB_USER', 'itrack_user');
define('DB_PASS', 'secure_password');

// CORS pentru aplicația mobile
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
?>
```

## Depanare Probleme Comune

### 1. Probleme Node.js
```bash
# Verificare versiune Node.js
node --version  # Trebuie 18.0+

# Curățare npm cache
npm cache clean --force

# Reinstalare dependencies
rm -rf node_modules package-lock.json
npm install
```

### 2. Probleme Android
```bash
# Verificare Android SDK
echo $ANDROID_HOME

# Curățare cache Gradle
cd android
./gradlew clean

# Reset Capacitor
npx cap sync android --force
```

### 3. Probleme GPS
```javascript
// Verificare permisiuni în cod
if (navigator.permissions) {
  navigator.permissions.query({name: 'geolocation'})
    .then(result => console.log('GPS permission:', result.state));
}

// Testing GPS în browser
navigator.geolocation.getCurrentPosition(
  position => console.log('GPS works:', position.coords),
  error => console.error('GPS error:', error)
);
```

### 4. Probleme API
```javascript
// Testing connectivity
fetch('https://www.euscagency.com/etsm3/platforme/transport/apk/api_login.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'test', password: 'test'})
})
.then(response => console.log('API response:', response.status))
.catch(error => console.error('API error:', error));
```

## Deployment la Producție

### 1. Play Store Preparation
```bash
# Generare App Bundle pentru Play Store
# În Android Studio:
# Build > Generate Signed Bundle / APK > Android App Bundle
# Configurare signing cu production key store
```

### 2. CI/CD Pipeline
Pentru automatizare deployment:

```yaml
# .github/workflows/android.yml
name: Android Build
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    - name: Install dependencies
      run: npm install
    - name: Build web assets
      run: npm run build
    - name: Setup Android SDK
      uses: android-actions/setup-android@v2
    - name: Build APK
      run: cd android && ./gradlew assembleRelease
```

### 3. Monitoring Producție
```javascript
// Error tracking în aplicație
window.addEventListener('error', (event) => {
  console.error('Production error:', event.error);
  // Send to monitoring service
});

// Performance monitoring
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Performance metric:', entry);
  }
});
observer.observe({entryTypes: ['measure', 'navigation']});
```

## Suport și Mentenanță

### Logs și Monitoring
- **Application Logs**: Accesibile prin debug panel (50 click-uri pe timestamp)
- **GPS Logs**: Categorie dedicată pentru probleme tracking
- **API Logs**: Monitoring toate request-urile cu timing
- **Error Tracking**: Capturare și raportare erori automat

### Backup și Recovery
- **Settings Backup**: Aplicația salvează automat configurările
- **Offline Data**: Coordonatele GPS sunt păstrate până la sincronizare
- **Logs Persistence**: Logurile supraviețuiesc logout-ului

### Updates și Patches
- **Over-the-Air Updates**: Pentru componenta web prin Capacitor
- **App Store Updates**: Pentru modificări native Android
- **API Versioning**: Backward compatibility pentru API changes

Pentru suport tehnic sau întrebări specifice, consultați documentația API.md și ARCHITECTURE.md.