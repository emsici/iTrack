#!/bin/bash

# Script pentru construirea APK-ului aplicației Transport GPS

# Pasul 1: Construim aplicația web
echo "Pas 1: Construim aplicația web..."
npm run build

# Pasul 2: Sincronizăm proiectul cu Capacitor
echo "Pas 2: Sincronizăm proiectul cu Capacitor..."
npx cap sync

# Pasul 3: Adăugăm platforma Android (dacă nu există deja)
echo "Pas 3: Adăugăm platforma Android..."
npx cap add android

# Pasul 4: Verificăm că Android SDK este instalat
echo "Pas 4: Verificăm Android SDK..."
if [ -z "$ANDROID_SDK_ROOT" ]; then
  echo "ANDROID_SDK_ROOT nu este setat. Trebuie să instalați Android SDK."
  exit 1
fi

# Pasul 5: Construim APK-ul
echo "Pas 5: Construim APK-ul..."
cd android
./gradlew assembleDebug
cd ..

# Pasul 6: Afișăm locația APK-ului
echo "Pas 6: APK construit cu succes!"
echo "Fișierul APK se găsește la: android/app/build/outputs/apk/debug/app-debug.apk"

echo "Pentru a instala pe telefon, folosiți:"
echo "adb install android/app/build/outputs/apk/debug/app-debug.apk"