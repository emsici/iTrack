#!/bin/bash

echo "🔧 Construiesc aplicația Android cu serviciul GPS nativ..."

# Construiește aplicația web
echo "📦 Construiesc aplicația web..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Eroare la construirea aplicației web"
    exit 1
fi

# Sincronizează cu Capacitor
echo "🔄 Sincronizez cu Capacitor Android..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "❌ Eroare la sincronizarea Capacitor"
    exit 1
fi

# Copiază fișierele native
echo "📂 Copiez serviciul GPS nativ..."
cp -r android/app/src/main/java/com/itrack android/app/src/main/java/

# Construiește APK-ul
echo "🏗️ Construiesc APK-ul Android..."
cd android
./gradlew assembleDebug
if [ $? -ne 0 ]; then
    echo "❌ Eroare la construirea APK-ului"
    exit 1
fi

echo "✅ APK construit cu succes!"
echo "📍 Locația APK: android/app/build/outputs/apk/debug/app-debug.apk"

# Afișează informații despre APK
ls -la app/build/outputs/apk/debug/app-debug.apk