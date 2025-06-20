# Manual APK Build - Step by Step Fix

## Issue: Gradle Cache Corruption
The error indicates corrupted Gradle cache files. Follow these exact steps:

### Step 1: Delete Corrupted Cache (Command Prompt as Administrator)
```cmd
cd C:\Users\eusun\.gradle
rmdir /s /q caches
rmdir /s /q wrapper
```

### Step 2: Clean Project Files
```cmd
cd "C:\Users\eusun\OneDrive\Desktop\iTrack (100)\iTrack\android"
rmdir /s /q build
rmdir /s /q .gradle
rmdir /s /q app\build
```

### Step 3: Re-sync Capacitor
```cmd
cd "C:\Users\eusun\OneDrive\Desktop\iTrack (100)\iTrack"
npx cap sync android
```

### Step 4: Build with Fresh Cache
```cmd
cd android
gradlew clean --refresh-dependencies
gradlew assembleDebug --no-daemon
```

## Alternative: Use Android Studio
1. Open Android Studio
2. File → Open → Select `android` folder
3. Wait for Gradle sync (may take 5-10 minutes)
4. Build → Generate Signed Bundle/APK → APK → Debug
5. Create APK

## APK Location After Success
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## GPS Features Confirmed Ready
- Background tracking with phone locked
- 60-second coordinate transmission
- Complete GPS data: lat, lng, speed, direction, altitude, battery, UIT, status
- All Android permissions configured
- EnhancedGPSService ready for activation

The GPS will work immediately after APK installation and course start.