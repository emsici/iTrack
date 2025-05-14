#!/bin/bash

echo "==============================================="
echo "    SCRIPT GENERARE APK PENTRU iTrack"
echo "==============================================="

# Pasul 1: Construim aplicația web
echo "Pasul 1/6: Construim aplicația web..."
npm run build

# Pasul 2: Sincronizăm proiectul cu Capacitor
echo "Pasul 2/6: Sincronizăm proiectul cu Capacitor..."
npx cap sync

# Pasul 3: Adăugăm platforma Android (dacă nu există deja)
if [ ! -d "android" ]; then
    echo "Pasul 3/6: Adăugăm platforma Android..."
    npx cap add android
else
    echo "Pasul 3/6: Platforma Android deja existentă, continuăm..."
fi

# Pasul 3.1: Verificăm și actualizăm AndroidManifest.xml
echo "Pasul 3.1/6: Verificăm Manifestul Android pentru permisiuni corecte..."
# Copiem șablonul de manifest peste cel generat
if [ -f "AndroidManifest-template.xml" ]; then
    echo "Aplicăm șablonul de manifest personalizat pentru permisiuni corecte..."
    cp AndroidManifest-template.xml android/app/src/main/AndroidManifest.xml
    echo "Manifest actualizat cu succes!"
else
    echo "AVERTISMENT: Nu s-a găsit șablonul AndroidManifest-template.xml!"
    echo "Permisiunile pentru locație ar putea să nu funcționeze corect."
fi

# Pasul 4: Verificăm că Android SDK este instalat
echo "Pasul 4/6: Verificăm Android SDK..."
if [ -z "$ANDROID_SDK_ROOT" ]; then
  echo "AVERTISMENT: ANDROID_SDK_ROOT nu este setat. Poți avea probleme la compilare."
  echo "Continuăm oricum..."
fi

# Pasul 5: Construim APK-ul
echo "Pasul 5/6: Construim APK-ul..."
cd android
./gradlew assembleDebug
cd ..

# Pasul 6: Afișăm locația APK-ului
echo "Pasul 6/6: APK construit cu succes!"
echo ""
echo "==============================================="
echo "    INSTRUCȚIUNI DE INSTALARE"
echo "==============================================="
echo "Fișierul APK se găsește la: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "Pentru a instala pe telefon, folosiți:"
echo "adb install android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "NOTĂ: Dacă întâmpini probleme cu autentificarea la prima rulare,"
echo "      verifică INSTRUCTIUNI_MOBILE_APP.md pentru soluții."
echo "==============================================="