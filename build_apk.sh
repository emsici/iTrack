#!/bin/bash

echo "🔧 BUILDING APK cu DirectGPS fixes..."
echo ""

# Sync Capacitor first
echo "📱 Syncing Capacitor..."
npx cap sync android

echo ""
echo "🔨 Building APK..."
cd android
./gradlew assembleDebug

echo ""
echo "✅ APK Location: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "📋 VERIFICĂRI DUPĂ INSTALARE APK:"
echo "1. Verifică în logcat dacă DirectGPS.startGPS este 'function'"
echo "2. Dă START la o cursă și verifică dacă transmite GPS"
echo "3. Logcat command: adb logcat | grep -E '(DirectGPS|OptimalGPS)'"