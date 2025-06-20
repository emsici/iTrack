# Instrucțiuni de Compilare iTrack GPS

Ghid complet pentru compilarea aplicației profesionale de urmărire GPS iTrack pentru implementare Android cu funcționalități native avansate.

## Cerințe Prealabile

### Mediul de Dezvoltare
- **Node.js 20+** - Versiunea LTS recomandată pentru stabilitate maximă
- **Android Studio** - Versiunea stabilă recentă cu Android SDK complet
- **Java Development Kit (JDK)** - Versiunea 17 sau superioară pentru compatibilitate
- **Git** - Pentru controlul versiunilor și sincronizare

### Cerințe Android SDK
- **Android SDK Platform-Tools** - Versiunea cea mai recentă
- **Android Build Tools** - Versiunea 34.0.0 sau superioară
- **SDK Țintă** - API Level 34 (Android 14) pentru funcționalități moderne
- **SDK Minim** - API Level 24 (Android 7.0) pentru compatibilitate largă

## Pași de Instalare

### 1. Clonare Repository
```bash
git clone <url-repository>
cd itrack-gps
```

### 2. Instalare Dependențe Complete
```bash
# Instalare pachete Node.js
npm install

# Verificare versiuni
node --version  # Trebuie să fie 20+
npm --version   # Trebuie să fie 10+
```

### 3. Configurare Mediu Android
Setează variabilele de mediu necesare:
```bash
# Windows
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set JAVA_HOME=C:\Program Files\Java\jdk-17

# Linux/Mac
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

### 4. Configurare Capacitor Pentru GPS Nativ
```bash
# Adăugare platformă Android
npx cap add android

# Sincronizare inițială
npx cap sync android

# Verificare configurație
npx cap doctor
```

## Compilare pentru Dezvoltare

### Pornire Server Dezvoltare cu Hot Reload
```bash
# Server Vite cu acces extern
npx vite --host 0.0.0.0 --port 5000

# Sau folosind npm script
npm run dev
```
Acces aplicație: `http://localhost:5000`

### Dezvoltare Live pe Telefon Android
```bash
# Live reload direct pe device
npx cap run android --live-reload --external

# Pentru debugging intensiv
npx cap run android --live-reload --external --consolelogs
```

## Compilare pentru Producție

### 1. Build Optimizat Web Assets
```bash
# Build cu optimizări Vite complete
npx vite build

# Verificare mărime bundle
ls -la dist/assets/
```

### 2. Sincronizare cu Android Native
```bash
# Copiere assets și configurație
npx cap sync android

# Verificare sincronizare
npx cap doctor
```

### 3. Deschidere Android Studio pentru APK
```bash
# Lansare Android Studio cu proiectul
npx cap open android
```

### 4. Generare APK Funcțional
În Android Studio:
1. Selectează `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. Pentru release: `Build` → `Generate Signed Bundle / APK`
3. APK generat în: `android/app/build/outputs/apk/`

## Scripturi de Build Rapide

### Build Complet Windows (build.bat)
```bash
@echo off
echo === iTrack GPS Build Process ===

echo [1/4] Curățare build anterior...
if exist dist rmdir /s /q dist
if exist android\app\build rmdir /s /q android\app\build

echo [2/4] Build web assets cu Vite...
call npx vite build

echo [3/4] Sincronizare Capacitor cu GPS nativ...
call npx cap sync android

echo [4/4] Lansare Android Studio pentru APK...
call npx cap open android

echo === Build gata pentru Android Studio ===
pause
```

### Build Manual Complet
```bash
# Curățare completă
rm -rf dist/ android/app/build/ node_modules/

# Reinstalare dependențe fresh
npm install

# Build web cu optimizări
npx vite build --mode production

# Sincronizare cu verificări
npx cap sync android
npx cap doctor

# Generare APK final
npx cap build android
```

## Depanare Probleme Comune

### Probleme Node.js și Dependențe

1. **Conflicte versiuni Node.js**
   ```bash
   # Verificare versiune
   node --version

   # Curățare cache npm
   npm cache clean --force

   # Reinstalare completă
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Erori TypeScript în build**
   ```bash
   # Verificare tipuri
   npx tsc --noEmit

   # Update dependențe TypeScript
   npm update @types/react @types/react-dom typescript
   ```

### Probleme Android SDK

1. **Variabile mediu incorrecte**
   ```bash
   # Verificare ANDROID_HOME
   echo $ANDROID_HOME
   ls $ANDROID_HOME/platform-tools

   # Verificare JAVA_HOME
   echo $JAVA_HOME
   java -version
   ```

2. **SDK lipsă sau învechit**
   ```bash
   # Update prin Android Studio SDK Manager
   # Sau folosind sdkmanager
   $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --update
   ```

### Probleme Capacitor și GPS

1. **Erori sincronizare Capacitor**
   ```bash
   # Reset complet Capacitor
   rm -rf android/
   npx cap add android
   npx cap sync android
   ```

2. **Plugin GPS nu funcționează**
   ```bash
   # Verificare înregistrare plugin în MainActivity.java
   # Asigură-te că DirectGPSPlugin este în lista de plugins
   ```

3. **Serviciu GPS nu pornește**
   ```bash
   # Verificare AndroidManifest.xml pentru:
   # - EnhancedGPSService în <application>
   # - Permisiuni location complete
   # - FOREGROUND_SERVICE permission
   ```

## Optimizări Performanță

### Optimizări Build Size
```bash
# Analiză bundle size
npx vite build --mode production
npx bundlesize

# Optimizări CSS
# - Unused CSS removal automată prin Vite
# - Tree-shaking pentru JavaScript
# - Compresie gzip automată
```

### Optimizări Android Native
```bash
# În android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
        }
    }
}
```

## Verificări Post-Compilare

### Testare APK Local
```bash
# Instalare pe device via ADB
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Verificare loguri GPS
adb logcat | grep -i "GPS\|Enhanced\|iTrack"
```

### Testare Funcționalități Critice
1. **Login și autentificare** - token JWT valid
2. **Încărcare curse** - API vehicul.php funcțional
3. **GPS background** - transmisie la 5 secunde când locked
4. **Offline storage** - salvare coordonate fără internet
5. **Sincronizare batch** - upload 50 coordonate simultan
6. **Logout complet** - ștergere date și oprire GPS

### Monitorizare Performance
```bash
# Memory usage
adb shell dumpsys meminfo com.euscagency.itrack

# Battery optimization
adb shell dumpsys battery

# GPS status în timp real
adb shell dumpsys location
```

## Arhitectura GPS Nativă

### Servicii Android Core
- **EnhancedGPSService.java** - Serviciu foreground pentru GPS background
- **DirectGPSPlugin.java** - Bridge Capacitor pentru control GPS
- **MainActivity.java** - Înregistrare plugin și permisiuni

### Flow de Date GPS
1. **JavaScript** → `directAndroidGPS.ts` → **DirectGPSPlugin**
2. **DirectGPSPlugin** → Intent → **EnhancedGPSService**
3. **EnhancedGPSService** → OkHttp → **gps.php** (server ETSM3)

### Persistență Offline
- **SharedPreferences** pentru coordonate GPS offline
- **Batch processing** - 50 coordonate per request
- **Retry logic** - 3 încercări pentru fiecare coordonată

## Output Final Build

### Structură Generată
```
dist/                          # Web assets optimizate
├── assets/
│   ├── index-[hash].js       # JavaScript bundle
│   ├── index-[hash].css      # CSS bundle optimizat
│   └── web-[hash].js         # Capacitor web layer

android/                       # Proiect Android nativ
├── app/
│   ├── build/outputs/apk/    # APK-uri generate
│   └── src/main/
│       ├── java/.../         # Servicii GPS native
│       └── assets/public/    # Web assets sincronizate
```

### Verificare APK Final
```bash
# Informații APK
aapt dump badging android/app/build/outputs/apk/debug/app-debug.apk

# Mărime APK
ls -lah android/app/build/outputs/apk/debug/app-debug.apk

# Verificare permisiuni
aapt dump permissions android/app/build/outputs/apk/debug/app-debug.apk
```

## Suport Tehnic

Pentru probleme de compilare:
1. **Verifică console output** pentru erori specifice
2. **Asigură-te că toate cerințele prealabile** sunt instalate
3. **Folosește versiuni stabile** pentru toate tool-urile
4. **Testează pe device real Android** pentru GPS functionality

### Debug Logs Utile
```bash
# Loguri build Vite
DEBUG=vite:* npx vite build

# Loguri Capacitor sync
DEBUG=capacitor:* npx cap sync android

# Loguri Android build
./gradlew assembleDebug --debug
```

---
*Compilare optimizată pentru aplicația profesională iTrack GPS cu funcționalități native Android avansate*